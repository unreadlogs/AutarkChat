import { ChatShell } from "@/components/chat";
import { getChatById, getMessagesByChatId, getArtifactsByChatId } from "@/lib/queries";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function ChatByIdPage({ params }: ChatPageProps) {
  const { id } = await params;

  let initialTurns: any[] = [];
  let initialArtifacts: any[] = [];
  let initialTitle = "";
  let initialCompareModels: string[] | undefined;

  try {
    const chat = (await getChatById(id)) as any;
    if (chat) {
      const dbMessages = await getMessagesByChatId(id);
      if (dbMessages && dbMessages.length > 0) {
        initialTurns = dbMessages.map(({ _id, ...rest }) => rest);
      } else if (chat.messages && chat.messages.length > 0) {
        initialTurns = convertLegacyMessages(chat.messages);
      }
      initialArtifacts = (await getArtifactsByChatId(id)).map(({ _id, ...rest }) => rest);
      initialTitle = chat.title;
      initialCompareModels = chat.compareModels;
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
