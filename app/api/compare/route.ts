import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { verifyAdminAuth } from "@/lib/auth";
import { getCustomModels } from "@/lib/queries";
import { regularPrompt } from "@/lib/ai/prompts";

const compareBodySchema = z.object({
  prompt: z.string().min(1).max(8000),
  modelIds: z.array(z.string().uuid()).min(1).max(6),
});

function getClient(model: { apiKey: string; baseUrl: string | null }) {
  return new OpenAI({
    apiKey: model.apiKey || process.env.OPENAI_API_KEY || "dummy-key",
    baseURL: model.baseUrl || undefined,
  });
}

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof compareBodySchema>;
  try {
    const json = await request.json();
    body = compareBodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, modelIds } = body;

  // Resolve custom model configs from DB
  const allModels = await getCustomModels();
  const selectedModels = allModels.filter((m) => modelIds.includes(m.id));

  // Allow 1 model for retry scenarios; frontend enforces 2+ for initial compare
  if (selectedModels.length === 0) {
    return NextResponse.json(
      { error: "At least 1 valid model is required" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (
        modelId: string,
        event: { type: string; content?: string; metadata?: Record<string, unknown> }
      ) => {
        const data = JSON.stringify({
          modelId,
          ...event,
          timestamp: Date.now(),
        });
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Stream closed
        }
      };

      const runModel = async (model: (typeof selectedModels)[0]) => {
        try {
          send(model.id, { type: "start" });

          const client = getClient(model);
          const response = await client.chat.completions.create({
            model: model.modelId,
            messages: [
              { role: "system", content: regularPrompt },
              { role: "user", content: prompt },
            ],
            stream: true,
          });

          let fullContent = "";
          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              fullContent += delta;
              send(model.id, { type: "delta", content: delta });
            }
          }

          send(model.id, {
            type: "finish",
            content: fullContent,
            metadata: { tokenCount: fullContent.split(/\s+/).filter(Boolean).length },
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          send(model.id, { type: "error", content: message });
        }
      };

      // Launch all models concurrently — never block one model waiting for another
      const promises = selectedModels.map((m) => runModel(m));

      // Wait for all to complete; Promise.allSettled ensures every model finishes
      await Promise.allSettled(promises);

      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
