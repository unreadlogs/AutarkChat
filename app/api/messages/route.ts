import { NextResponse } from "next/server";
import { getChatById, getMessagesByChatId, getArtifactsByChatId } from "@/lib/queries";
import { verifyAdminAuth } from "@/lib/auth";

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

  let messages = await getMessagesByChatId(chatId);
  if ((!messages || messages.length === 0) && chat.messages && chat.messages.length > 0) {
    messages = chat.messages.map((msg: any) => ({
      id: msg.id,
      chatId,
      role: msg.role,
      content: msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n") || msg.content || "",
      responses: msg.responses || [],
      attachments: msg.attachments || [],
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      updatedAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    }));
  }

  const artifacts = await getArtifactsByChatId(chatId);

  return Response.json({
    messages,
    artifacts,
  });
}
