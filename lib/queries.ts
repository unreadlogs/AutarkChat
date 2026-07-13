import { headers } from "next/headers";
import { connectToDatabase } from "./mongodb";
import type {
  DBChat,
  DBUser,
  DBMessage,
  DBArtifact,
  DBAttachment,
  MessageResponse,
  VisibilityType,
} from "./types";
import { generateUUID } from "./utils";
import { hash } from "bcrypt-ts";

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<DBUser | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection<DBUser>("users").findOne({ email });
  if (user) return user;
  return db.collection<DBUser>("guest").findOne({ email });
}

export async function getUserById(id: string): Promise<DBUser | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection<DBUser>("users").findOne({ id });
  if (user) return user;
  return db.collection<DBUser>("guest").findOne({ id });
}

export async function createUser(data: {
  email: string;
  password: string;
  isAnonymous?: boolean;
  ipAddress?: { v4: string | null; v6: string | null };
}): Promise<DBUser> {
  const { db } = await connectToDatabase();
  const now = new Date();
  const user: DBUser = {
    id: generateUUID(),
    email: data.email,
    name: null,
    password: data.password,
    isAnonymous: data.isAnonymous ?? false,
    ipAddress: data.ipAddress ?? { v4: null, v6: null },
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<DBUser>("users").insertOne(user);
  return user;
}

export async function extractClientIP(): Promise<{ v4: string | null; v6: string | null }> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  let ipv4: string | null = null;
  let ipv6: string | null = null;

  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip.includes(":")) ipv6 = ip;
    else ipv4 = ip;
  }

  if (!ipv4 && !ipv6) {
    const realIP = headersList.get("x-real-ip");
    if (realIP) {
      if (realIP.includes(":")) ipv6 = realIP;
      else ipv4 = realIP;
    }
  }

  return { v4: ipv4, v6: ipv6 };
}

export async function getOrCreateGuestUser(ipAddress: { v4: string | null; v6: string | null }): Promise<DBUser> {
  const { db } = await connectToDatabase();

  if (ipAddress.v4 || ipAddress.v6) {
    const filter: any = {};
    if (ipAddress.v4 && ipAddress.v6) {
      filter.$or = [
        { "ipAddress.v4": ipAddress.v4 },
        { "ipAddress.v6": ipAddress.v6 },
      ];
    } else if (ipAddress.v4) {
      filter["ipAddress.v4"] = ipAddress.v4;
    } else {
      filter["ipAddress.v6"] = ipAddress.v6;
    }

    const existingGuest = await db.collection<DBUser>("guest").findOne(filter);
    if (existingGuest) {
      return existingGuest;
    }
  }

  const email = `guest-${Date.now()}`;
  const hashedPassword = await hash(generateUUID(), 10);
  const now = new Date();
  const guestUser: DBUser = {
    id: generateUUID(),
    email,
    name: null,
    password: hashedPassword,
    isAnonymous: true,
    ipAddress,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<DBUser>("guest").insertOne(guestUser);
  return guestUser;
}

// ---------------------------------------------------------------------------
// Chat operations
// ---------------------------------------------------------------------------

export async function saveChat(data: {
  id: string;
  title: string;
  userId: string;
  visibility: VisibilityType;
  compareModels?: string[];
}): Promise<void> {
  const { db } = await connectToDatabase();
  const now = new Date();
  const chat: DBChat = {
    id: data.id,
    title: data.title,
    userId: data.userId,
    visibility: data.visibility,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
  if (data.compareModels && data.compareModels.length > 1) {
    chat.compareModels = data.compareModels;
  }
  await db.collection<DBChat>("chats").insertOne(chat);
}

export async function getChatById(id: string): Promise<DBChat | null> {
  const { db } = await connectToDatabase();
  return db.collection<DBChat>("chats").findOne({ id });
}

export async function getChatsByUserId(opts: {
  userId: string;
  limit: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}): Promise<{ chats: Pick<DBChat, "id" | "title" | "createdAt" | "updatedAt" | "pinned" | "lastMessageAt">[]; hasMore: boolean }> {
  const { db } = await connectToDatabase();
  const { userId, limit, startingAfter, endingBefore } = opts;
  const extendedLimit = limit + 1;

  const filter: Record<string, unknown> = { userId };

  if (startingAfter) {
    const anchor = await db.collection<DBChat>("chats").findOne({ id: startingAfter }, { projection: { createdAt: 1 } });
    if (anchor) filter.createdAt = { $gt: anchor.createdAt };
  } else if (endingBefore) {
    const anchor = await db.collection<DBChat>("chats").findOne({ id: endingBefore }, { projection: { createdAt: 1 } });
    if (anchor) filter.createdAt = { $lt: anchor.createdAt };
  }

  const chats = await db
    .collection<DBChat>("chats")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(extendedLimit)
    .project({ _id: 0, id: 1, title: 1, createdAt: 1, updatedAt: 1, pinned: 1, lastMessageAt: 1 })
    .toArray() as Array<Pick<DBChat, "id" | "title" | "createdAt" | "updatedAt" | "pinned" | "lastMessageAt">>;

  const hasMore = chats.length > limit;

  return {
    chats: hasMore ? chats.slice(0, limit) : chats,
    hasMore,
  };
}

export async function deleteChatById(id: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBMessage>("messages").deleteMany({ chatId: id });
  await db.collection<DBArtifact>("artifacts").deleteMany({ chatId: id });
  await db.collection<DBAttachment>("attachments").deleteMany({ chatId: id });
  await db.collection<DBChat>("chats").deleteOne({ id });
}

export async function deleteAllChatsByUserId(userId: string): Promise<{ deletedCount: number }> {
  const { db } = await connectToDatabase();
  const chatIds = (await db.collection<DBChat>("chats").find({ userId }, { projection: { id: 1 } }).toArray()).map(
    (c: { id: string }) => c.id
  );

  await db.collection<DBMessage>("messages").deleteMany({ chatId: { $in: chatIds } });
  await db.collection<DBArtifact>("artifacts").deleteMany({ chatId: { $in: chatIds } });
  await db.collection<DBAttachment>("attachments").deleteMany({ chatId: { $in: chatIds } });
  const result = await db.collection<DBChat>("chats").deleteMany({ userId });
  return { deletedCount: result.deletedCount };
}

export async function toggleChatPinned(id: string, pinned: boolean): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBChat>("chats").updateOne({ id }, { $set: { pinned, updatedAt: new Date() } });
}

export async function updateChatTitleById(chatId: string, title: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBChat>("chats").updateOne(
    { id: chatId },
    { $set: { title, updatedAt: new Date() } }
  );
}

export async function updateChatVisibilityById(chatId: string, visibility: VisibilityType): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBChat>("chats").updateOne(
    { id: chatId },
    { $set: { visibility, updatedAt: new Date() } }
  );
}

export async function touchChatLastMessageAt(chatId: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBChat>("chats").updateOne(
    { id: chatId },
    { $set: { updatedAt: new Date(), lastMessageAt: new Date() } }
  );
}

// ---------------------------------------------------------------------------
// Message operations (standalone `messages` collection)
// ---------------------------------------------------------------------------

export async function createMessage(message: DBMessage): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBMessage>("messages").insertOne(message);
}

export async function getMessagesByChatId(chatId: string): Promise<DBMessage[]> {
  const { db } = await connectToDatabase();
  return db
    .collection<DBMessage>("messages")
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function appendMessageResponse(
  chatId: string,
  messageId: string,
  response: MessageResponse
): Promise<void> {
  const { db } = await connectToDatabase();
  const now = new Date();
  await db.collection<DBMessage>("messages").updateOne(
    { id: messageId },
    { $push: { responses: response }, $set: { updatedAt: now } }
  );
  await db.collection<DBChat>("chats").updateOne(
    { id: chatId },
    { $set: { updatedAt: now, lastMessageAt: now } }
  );
}

export async function getMessageCountByUserId(userId: string, hours: number): Promise<number> {
  const { db } = await connectToDatabase();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const chatIds = (await db.collection<DBChat>("chats").find({ userId }, { projection: { id: 1 } }).toArray()).map(
    (c: { id: string }) => c.id
  );
  return db.collection<DBMessage>("messages").countDocuments({
    chatId: { $in: chatIds },
    role: "user",
    createdAt: { $gte: cutoff },
  });
}

// ---------------------------------------------------------------------------
// Artifact operations (standalone `artifacts` collection)
// ---------------------------------------------------------------------------

export async function createArtifact(artifact: DBArtifact): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBArtifact>("artifacts").insertOne(artifact);
}

export async function getArtifactsByChatId(chatId: string): Promise<DBArtifact[]> {
  const { db } = await connectToDatabase();
  return db
    .collection<DBArtifact>("artifacts")
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function updateArtifactContent(artifactId: string, content: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBArtifact>("artifacts").updateOne(
    { id: artifactId },
    { $set: { content, updatedAt: new Date() } }
  );
}

// ---------------------------------------------------------------------------
// Attachment operations (standalone `attachments` collection)
// ---------------------------------------------------------------------------

export async function createAttachment(attachment: DBAttachment): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<DBAttachment>("attachments").insertOne(attachment);
}

export async function getAttachmentsByChatId(chatId: string): Promise<DBAttachment[]> {
  const { db } = await connectToDatabase();
  return db
    .collection<DBAttachment>("attachments")
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray();
}

// ---------------------------------------------------------------------------
// Custom Model operations & Server Cache
// ---------------------------------------------------------------------------

export async function getCustomModels(): Promise<import("./types").DBModel[]> {
  const { db } = await connectToDatabase();
  const models = await db
    .collection<import("./types").DBModel>("models")
    .find({})
    .sort({ createdAt: 1 })
    .toArray();
  return models;
}

export async function addCustomModel(model: Omit<import("./types").DBModel, "id" | "createdAt">): Promise<import("./types").DBModel> {
  const { db } = await connectToDatabase();
  const now = new Date();
  const newModel: import("./types").DBModel = {
    id: generateUUID(),
    ...model,
    createdAt: now,
  };
  await db.collection<import("./types").DBModel>("models").insertOne(newModel);
  return newModel;
}

export async function deleteCustomModel(id: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection<import("./types").DBModel>("models").deleteOne({ id });
}

// ---------------------------------------------------------------------------
// Token Usage operations
// ---------------------------------------------------------------------------

export async function recordTokenUsage(
  chatId: string,
  modelId: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection("usage").insertOne({
    id: generateUUID(),
    chatId,
    modelId,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    createdAt: new Date(),
  });
}

export async function getTokenUsageMetrics(): Promise<any[]> {
  const { db } = await connectToDatabase();
  return db.collection("usage").find({}).sort({ createdAt: -1 }).toArray();
}

// ---------------------------------------------------------------------------
// Session Management operations
// ---------------------------------------------------------------------------

export async function getActiveSessions(): Promise<any[]> {
  const { db } = await connectToDatabase();
  return db.collection("sessions").find({ isActive: true }).sort({ lastActiveAt: -1 }).toArray();
}

export async function createSession(session: {
  id: string;
  name: string;
  browser: string;
  os: string;
  ipAddress: string;
}): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection("sessions").insertOne({
    ...session,
    isActive: true,
    createdAt: new Date(),
    lastActiveAt: new Date(),
  });
}

export async function revokeSession(id: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection("sessions").updateOne({ id }, { $set: { isActive: false } });
}

// ---------------------------------------------------------------------------
// Personalization operations
// ---------------------------------------------------------------------------

export type PersonalizationConfig = {
  preferredName: string;
  occupation: string;
  aboutMe: string;
  customInstructions: string;
};

export async function getPersonalization(): Promise<PersonalizationConfig> {
  const { db } = await connectToDatabase();
  const config = await db.collection("personalization").findOne({ id: "global" });
  if (config) {
    return {
      preferredName: config.preferredName || "",
      occupation: config.occupation || "",
      aboutMe: config.aboutMe || "",
      customInstructions: config.customInstructions || "",
    };
  }
  return {
    preferredName: "",
    occupation: "",
    aboutMe: "",
    customInstructions: "",
  };
}

export async function updatePersonalization(data: PersonalizationConfig): Promise<void> {
  const { db } = await connectToDatabase();
  await db.collection("personalization").updateOne(
    { id: "global" },
    {
      $set: {
        preferredName: data.preferredName,
        occupation: data.occupation,
        aboutMe: data.aboutMe,
        customInstructions: data.customInstructions,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
}
