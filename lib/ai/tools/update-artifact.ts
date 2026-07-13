import { z } from "zod";

export const updateArtifactSchema = z.object({
  artifactId: z.string(),
  content: z.string(),
});

export type UpdateArtifactInput = z.infer<typeof updateArtifactSchema>;

export function updateArtifactTool(chatId: string) {
  return {
    description: "Completely rewrite an existing artifact with new content",
    parameters: updateArtifactSchema,
    execute: async (input: UpdateArtifactInput) => {
      const { getArtifactsByChatId, updateArtifactContent } = await import("../../queries");
      const artifacts = await getArtifactsByChatId(chatId);
      const artifact = artifacts.find((a) => a.id === input.artifactId);
      if (!artifact) {
        return { error: "Artifact not found" };
      }

      await updateArtifactContent(input.artifactId, input.content);
      return {
        id: artifact.id,
        title: artifact.title,
        type: artifact.type,
        content: input.content,
      };
    },
  };
}
