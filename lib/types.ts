export type ArtifactType = "text" | "code" | "sheet" | "image";

export type AttachmentRef = {
  id: string;
  name: string;
  url: string;
  contentType: string;
};

export type MessageResponseUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type MessageResponse = {
  id: string;
  provider?: string | null;
  model: string;
  content: string;
  status?: string | null;
  error?: string | null;
  usage?: MessageResponseUsage | null;
};

export type DBMessage = {
  _id?: import("mongodb").ObjectId;
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  responses: MessageResponse[];
  attachments: AttachmentRef[];
  createdAt: Date;
  updatedAt: Date;
};

export type DBArtifact = {
  _id?: import("mongodb").ObjectId;
  id: string;
  chatId: string;
  messageId: string;
  title: string;
  type: ArtifactType;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DBAttachment = {
  _id?: import("mongodb").ObjectId;
  id: string;
  chatId: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
};

export type DBChat = {
  _id?: import("mongodb").ObjectId;
  id: string;
  userId: string;
  title: string;
  visibility: "public" | "private";
  pinned?: boolean;
  compareModels?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
};

export type DBUser = {
  _id?: import("mongodb").ObjectId;
  id: string;
  email: string;
  name: string | null;
  password: string;
  isAnonymous: boolean;
  ipAddress: {
    v4: string | null;
    v6: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type VisibilityType = "public" | "private";

export type DBModel = {
  _id?: import("mongodb").ObjectId;
  id: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  apiKey: string;
  modelId: string;
  createdAt: Date;
};

export type WaitingStatusData = {
  phase: "waiting" | "still-waiting" | "health" | "thinking";
  message: string;
};
