import { z } from "zod";
import { regularPrompt, artifactsPrompt, titlePrompt } from "@/lib/ai/prompts";
import { titleModel } from "@/lib/ai/models";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact";
import { editArtifactTool } from "@/lib/ai/tools/edit-artifact";
import { updateArtifactTool } from "@/lib/ai/tools/update-artifact";
import {
  getChatById,
  saveChat,
  updateChatTitleById,
  getCustomModels,
  getMessagesByChatId,
  createMessage,
  createAttachment,
  appendMessageResponse,
  recordTokenUsage,
  getPersonalization,
} from "@/lib/queries";
import type { DBMessage, DBModel, MessageResponse } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { verifyAdminAuth } from "@/lib/auth";
import OpenAI from "openai";

function getOpenAIClient(apiKey?: string, baseUrl?: string | null) {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY || "dummy-key",
    baseURL: baseUrl || undefined,
  });
}

/**
 * Build the model context from previous turns.
 * For a normal chat we use the first response in each turn's `responses` array.
 * `responseIndex` makes it easy to select a different response later for compare mode.
 */
function buildContextFromTurns(
  turns: DBMessage[],
  system: string,
  responseIndex = 0
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: system },
  ];

  for (const turn of turns) {
    messages.push({ role: "user", content: turn.content });

    const response = turn.responses[responseIndex];
    if (response && !response.error && response.content) {
      messages.push({ role: "assistant", content: response.content });
    }
  }

  return messages;
}

const postBodySchema = z.object({
  id: z.string().uuid(),
  message: z
    .object({
      id: z.string().uuid(),
      role: z.literal("user"),
      content: z.string().min(1).max(4000),
      attachments: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            contentType: z.string(),
            size: z.number().optional().default(0),
          })
        )
        .optional(),
    })
    .optional(),
  selectedChatModel: z.string().optional(),
  selectedChatModels: z.array(z.string()).min(1).optional(),
});

export const maxDuration = 60;

const openaiTools = [
  {
    type: "function" as const,
    function: {
      name: "createArtifact",
      description: "Create a new document, code file, or spreadsheet artifact",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          kind: { type: "string", enum: ["text", "code", "sheet"] },
          content: { type: "string" },
        },
        required: ["title", "kind", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "editArtifact",
      description: "Edit an existing artifact using find-and-replace",
      parameters: {
        type: "object",
        properties: {
          artifactId: { type: "string" },
          find: { type: "string" },
          replace: { type: "string" },
          replaceAll: { type: "boolean" },
        },
        required: ["artifactId", "find", "replace"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateArtifact",
      description: "Completely rewrite an existing artifact with new content",
      parameters: {
        type: "object",
        properties: {
          artifactId: { type: "string" },
          content: { type: "string" },
        },
        required: ["artifactId", "content"],
      },
    },
  },
];

type RunModelArgs = {
  send: (type: string, data: any) => void;
  modelConfig: DBModel;
  baseContext: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseId: string;
  withTools: boolean;
  chatId: string;
  messageId: string;
};

async function runModel({
  send,
  modelConfig,
  baseContext,
  responseId,
  withTools,
  chatId,
  messageId,
}: RunModelArgs): Promise<{ content: string; usage: MessageResponse["usage"]; error: string | null }> {
  const client = getOpenAIClient(modelConfig.apiKey, modelConfig.baseUrl);
  const msgs = baseContext.map((m) => ({ ...m }));

  let steps = 0;
  const maxSteps = 5;
  let keepRunning = true;
  let assistantText = "";
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    while (keepRunning && steps < maxSteps) {
      steps++;

      const stream = await client.chat.completions.create({
        model: modelConfig.modelId,
        messages: msgs as any,
        tools: withTools ? openaiTools : undefined,
        stream: true,
        stream_options: { include_usage: true },
      });

      const toolCallsAcc: Array<{ id: string; name: string; arguments: string }> = [];

      for await (const chunk of stream) {
        if (chunk.usage) {
          const promptTokens = chunk.usage.prompt_tokens;
          const completionTokens = chunk.usage.completion_tokens;
          totalPromptTokens += promptTokens;
          totalCompletionTokens += completionTokens;
          if (promptTokens || completionTokens) {
            await recordTokenUsage(chatId, modelConfig.modelId, promptTokens, completionTokens);
          }
        }

        const choice = chunk.choices[0];
        if (!choice) continue;

        const delta = choice.delta;

        if (delta.content) {
          assistantText += delta.content;
          send("text", { text: delta.content, responseId });
        }

        if (delta.tool_calls && withTools) {
          for (const tcChunk of delta.tool_calls) {
            const index = tcChunk.index;
            if (index === undefined) continue;

            if (!toolCallsAcc[index]) {
              toolCallsAcc[index] = { id: "", name: "", arguments: "" };
            }

            const acc = toolCallsAcc[index];
            if (tcChunk.id) acc.id = tcChunk.id;
            if (tcChunk.function) {
              if (tcChunk.function.name) acc.name = tcChunk.function.name;
              if (tcChunk.function.arguments) acc.arguments += tcChunk.function.arguments;
            }
          }
        }
      }

      const validToolCalls = toolCallsAcc.filter((tc) => tc.id && tc.name);

      if (assistantText) {
        msgs.push({ role: "assistant", content: assistantText });
      }

      if (validToolCalls.length > 0 && withTools) {
        const apiToolCalls = validToolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        }));

        msgs.push({
          role: "assistant",
          content: null,
          tool_calls: apiToolCalls,
        } as any);

        const toolExecPromises = validToolCalls.map(async (tc) => {
          let args: any = {};
          try {
            args = JSON.parse(tc.arguments);
          } catch {
            console.warn("Failed to parse tool arguments:", tc.arguments);
          }

          let output: any = {};
          try {
            if (tc.name === "createArtifact") {
              output = await createArtifactTool(chatId, messageId).execute(args);
            } else if (tc.name === "editArtifact") {
              output = await editArtifactTool(chatId).execute(args);
            } else if (tc.name === "updateArtifact") {
              output = await updateArtifactTool(chatId).execute(args);
            } else {
              output = { error: `Tool ${tc.name} not found` };
            }
          } catch (err: any) {
            output = { error: err.message || "Failed to execute tool" };
          }

          send("tool-result", { toolCallId: tc.id, output });

          return {
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(output),
          };
        });

        const toolMessages = await Promise.all(toolExecPromises);
        msgs.push(...(toolMessages as any));

        assistantText = "";
        keepRunning = true;
      } else {
        keepRunning = false;
      }
    }

    return {
      content: assistantText,
      usage: totalPromptTokens > 0 || totalCompletionTokens > 0
        ? {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: totalPromptTokens + totalCompletionTokens,
          }
        : null,
      error: null,
    };
  } catch (err: any) {
    return {
      content: assistantText,
      usage: totalPromptTokens > 0 || totalCompletionTokens > 0
        ? {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: totalPromptTokens + totalCompletionTokens,
          }
        : null,
      error: err?.message || "Model failed",
    };
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminAuth()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof postBodySchema>;

  try {
    const json = await request.json();
    body = postBodySchema.parse(json);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { id, message } = body;

    const customModels = await getCustomModels();
    if (customModels.length === 0) {
      return Response.json({ error: "No models configured. Please configure a custom model in settings." }, { status: 400 });
    }

    // Resolve the selected model(s). Compare mode = more than one selected.
    const requestedIds = body.selectedChatModels && body.selectedChatModels.length > 0
      ? body.selectedChatModels
      : body.selectedChatModel
        ? [body.selectedChatModel]
        : [];

    let selectedModels = requestedIds.length > 0
      ? requestedIds.map((mid) => customModels.find((m) => m.id === mid)).filter((m): m is DBModel => Boolean(m))
      : [customModels[0]];

    if (selectedModels.length === 0) {
      return Response.json({ error: "Selected model not found." }, { status: 400 });
    }

    const isCompare = selectedModels.length > 1;
    const titleClient = getOpenAIClient(selectedModels[0].apiKey, selectedModels[0].baseUrl);
    const titleModelId = selectedModels[0].modelId;

    const user = { id: "admin" };

    const chat = await getChatById(id);
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== user.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      // Enforce locked compare models from the chat document
      if (chat.compareModels && chat.compareModels.length > 1) {
        const lockedModels = chat.compareModels
          .map((mid) => customModels.find((m) => m.id === mid))
          .filter((m): m is DBModel => Boolean(m));
        if (lockedModels.length > 1) {
          selectedModels = lockedModels;
        }
      }
    } else if (message?.role === "user") {
      const derivedTitle = message.content.length > 30
        ? message.content.slice(0, 30).trim() + "..."
        : message.content.trim();

      await saveChat({
        id,
        title: derivedTitle,
        userId: user.id,
        visibility: "private",
        compareModels: selectedModels.length > 1 ? selectedModels.map((m) => m.id) : undefined,
      });
      titlePromise = Promise.resolve(derivedTitle);
    }

    // Persist the user turn as a standalone message document
    let currentMessageId: string | null = null;
    if (message?.role === "user") {
      currentMessageId = message.id;
      const now = new Date();
      const userMessage: DBMessage = {
        id: message.id,
        chatId: id,
        role: "user",
        content: message.content,
        responses: [],
        attachments: (message.attachments ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          contentType: a.contentType,
        })),
        createdAt: now,
        updatedAt: now,
      };
      await createMessage(userMessage);

      // Persist standalone attachment documents
      for (const a of message.attachments ?? []) {
        await createAttachment({
          id: a.id,
          chatId: id,
          messageId: message.id,
          filename: a.name,
          mimeType: a.contentType,
          size: a.size ?? 0,
          url: a.url,
          createdAt: now,
        });
      }
    }

    // Build conversation history from the messages collection.
    // The current user turn is included (it has no responses yet, so it only
    // contributes its prompt to the context).
    const history = await getMessagesByChatId(id);
    
    // Fetch and construct dynamic system prompt from user personalization settings
    const personalization = await getPersonalization();
    let systemContent = regularPrompt;

    if (personalization.preferredName || personalization.occupation || personalization.aboutMe) {
      systemContent += `\n\nUser Profile & Context:`;
      if (personalization.preferredName) {
        systemContent += `\n- What you should call the user: "${personalization.preferredName}"`;
      }
      if (personalization.occupation) {
        systemContent += `\n- User's occupation: ${personalization.occupation}`;
      }
      if (personalization.aboutMe) {
        systemContent += `\n- More about the user: ${personalization.aboutMe}`;
      }
    }

    if (personalization.customInstructions) {
      systemContent += `\n\nCustom Instructions / Guidelines:\n${personalization.customInstructions}`;
    }

    console.log("=== SYSTEM PROMPT ===");
    console.log(systemContent);
    console.log("=====================");

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(type: string, dataObj: any) {
          const payload = JSON.stringify({ type, ...dataObj });
          controller.enqueue(encoder.encode(`data: ${payload}\n`));
        }

        try {
          // Announce the response slots so the client can render one bubble per model.
          const responseSlots = selectedModels.map((m) => ({
            id: generateUUID(),
            model: m.modelId,
            provider: m.provider,
          }));
          send("response-meta", { responses: responseSlots, compare: isCompare });

          const tasks = selectedModels.map(async (modelConfig, idx) => {
            const modelContext = buildContextFromTurns(history, systemContent, idx);
            const responseId = responseSlots[idx].id;

            try {
              const r = await runModel({
                send,
                modelConfig,
                baseContext: modelContext,
                responseId,
                withTools: false,
                chatId: id,
                messageId: currentMessageId!,
              });

              const response: MessageResponse = {
                id: responseId,
                provider: modelConfig.provider,
                model: modelConfig.modelId,
                content: r.content,
                status: r.error ? "error" : "completed",
                error: r.error,
                usage: r.usage,
              };
              await appendMessageResponse(id, currentMessageId!, response);

              if (r.usage) {
                send("usage", { responseId, usage: r.usage });
              }
            } catch (err: any) {
              const response: MessageResponse = {
                id: responseId,
                provider: modelConfig.provider,
                model: modelConfig.modelId,
                content: "",
                status: "error",
                error: err?.message || "Model failed",
                usage: null,
              };
              await appendMessageResponse(id, currentMessageId!, response);
            }
          });

          await Promise.allSettled(tasks);

          // Async title generation
          if (titlePromise) {
            try {
              const title = await titlePromise;
              await updateChatTitleById(id, title);
              send("chat-title", { data: title });
            } catch {}
          }
        } catch (error) {
          console.error("Stream error:", error);
          send("error", { error: "An error occurred during streaming." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await verifyAdminAuth()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const { deleteChatById } = await import("@/lib/queries");
  await deleteChatById(id);
  return Response.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!await verifyAdminAuth()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const { pinned } = z.object({ pinned: z.boolean() }).parse(body);

    const { toggleChatPinned } = await import("@/lib/queries");
    await toggleChatPinned(id, pinned);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Chat PATCH error:", error);
    return Response.json({ error: "Invalid request or server error" }, { status: 400 });
  }
}

async function generateTitle(
  message: { content: string },
  client: OpenAI,
  model: string
): Promise<string> {
  const text = message.content;

  try {
    const res = await client.chat.completions.create({
      model: model === "gpt-4o" || model === "gpt-4o-mini" ? model : titleModel.id,
      messages: [
        { role: "system", content: titlePrompt },
        { role: "user", content: text },
      ],
      max_tokens: 50,
    });
    return (res.choices[0]?.message?.content ?? "New Chat")
      .replace(/^[#*"\s]+/, "")
      .replace(/["]+$/, "")
      .trim();
  } catch {
    return "New Chat";
  }
}
