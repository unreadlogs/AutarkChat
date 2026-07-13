import { z } from "zod";
import { generateUUID } from "../../utils";
import type { DBArtifact } from "../../types";

export const createArtifactSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.enum(["text", "code", "sheet"]),
  content: z.string(),
});

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

export function createArtifactTool(chatId: string, messageId: string) {
  return {
    description: "Create a new document, code file, or spreadsheet artifact",
    parameters: createArtifactSchema,
    execute: async (input: CreateArtifactInput) => {
      const { createArtifact } = await import("../../queries");
      const now = new Date();
      const artifact: DBArtifact = {
        id: generateUUID(),
        chatId,
        messageId,
        title: input.title,
        type: input.kind,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      };
      await createArtifact(artifact);
      return {
        id: artifact.id,
        title: artifact.title,
        type: artifact.type,
        content: artifact.content,
        messageId,
      };
    },
  };
}
