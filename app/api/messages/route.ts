import { NextResponse } from "next/server";
import { getChatById, getMessagesByChatId, getArtifactsByChatId } from "@/lib/queries";
import { verifyAdminAuth } from "@/lib/auth";

function convertLegacyMessages(legacyMessages: any[]): any[] {
  const turns: any[] = [];
  let currentTurn: any = null;

  for (const msg of legacyMessages) {
    const textContent =
      msg.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n") ||
      msg.content ||
      "";

    if (msg.role === "user") {
      currentTurn = {
        id: msg.id,
        chatId: msg.chatId,
        role: "user",
        content: textContent,
        responses: [],
        attachments: msg.attachments || [],
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        updatedAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      };
      turns.push(currentTurn);
    } else if (msg.role === "assistant") {
      if (currentTurn) {
        currentTurn.responses.push({
          id: msg.id,
          model: msg.model || "assistant",
          content: textContent,
          status: "completed",
          usage: msg.usage || null,
        });
      } else {
        turns.push({
          id: msg.id,
          chatId: msg.chatId,
          role: "assistant",
          content: textContent,
          responses: [],
          attachments: msg.attachments || [],
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          updatedAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        });
      }
    }
  }
  return turns;
}

export async function GET(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
  }

  const chat = (await getChatById(chatId)) as any;
  if (!chat || chat.userId !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [dbMessages, artifacts] = await Promise.all([
    getMessagesByChatId(chatId),
    getArtifactsByChatId(chatId),
  ]);

  let messages = dbMessages;
  if ((!messages || messages.length === 0) && chat.messages && chat.messages.length > 0) {
    messages = convertLegacyMessages(chat.messages);
  }

  return Response.json({
    messages,
    artifacts,
  });
}
