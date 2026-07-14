import { ChatShell } from "@/components/chat";
import { getChatById, getMessagesByChatId, getArtifactsByChatId } from "@/lib/queries";
import type { FileArtifact } from "@/lib/types";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatByIdPage({ params }: ChatPageProps) {
  const { id } = await params;

  let initialTurns: any[] = [];
  let initialArtifacts: FileArtifact[] = [];
  let initialTitle = "";
  let initialCompareModels: string[] | undefined;

  try {
    const chat = (await getChatById(id)) as any;
    if (chat) {
      initialTitle = chat.title;
      initialCompareModels = chat.compareModels;

      const dbMessages = await getMessagesByChatId(id);
      if (dbMessages && dbMessages.length > 0) {
        initialTurns = dbMessages.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          role: m.role,
          content: m.content,
          responses: JSON.parse(JSON.stringify(m.responses)),
          attachments: JSON.parse(JSON.stringify(m.attachments)),
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
          updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
        }));
      } else if (chat.messages && chat.messages.length > 0) {
        initialTurns = chat.messages.map((msg: any) => ({
          id: msg.id,
          chatId: id,
          role: msg.role,
          content: msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n") || msg.content || "",
          responses: msg.responses || [],
          attachments: msg.attachments || [],
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt?.toISOString?.() || msg.createdAt,
          updatedAt: typeof msg.updatedAt === 'string' ? msg.updatedAt : msg.updatedAt?.toISOString?.() || msg.updatedAt,
        }));
      }

      const dbArtifacts = await getArtifactsByChatId(id);
      initialArtifacts = dbArtifacts.filter(Boolean).map((a) => ({
        id: String(a.id || ''),
        chatId: String(a.chatId || ''),
        messageId: String(a.messageId || ''),
        title: String(a.title || ''),
        filePath: String(a.filePath || ''),
        url: String(a.url || ''),
        mimeType: String(a.mimeType || ''),
        size: Number(a.size || 0),
      }));
    }
  } catch {
    // If DB not available, render empty chat
  }

  return (
    <ChatShell
      chatId={id}
      initialTurns={initialTurns}
      initialArtifacts={initialArtifacts}
      initialTitle={initialTitle}
      initialSelectedModels={initialCompareModels}
      compareLocked={!!initialCompareModels && initialCompareModels.length > 1}
    />
  );
}
