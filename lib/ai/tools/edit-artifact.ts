import { z } from "zod";

export const editArtifactSchema = z.object({
  artifactId: z.string(),
  find: z.string().min(1),
  replace: z.string(),
  replaceAll: z.boolean().optional().default(false),
});

export type EditArtifactInput = z.infer<typeof editArtifactSchema>;

export function editArtifactTool(chatId: string) {
  return {
    description: "Edit an existing artifact using find-and-replace",
    parameters: editArtifactSchema,
    execute: async (input: EditArtifactInput) => {
      const { getArtifactsByChatId, updateArtifactContent } = await import("../../queries");
      const artifacts = await getArtifactsByChatId(chatId);
      const artifact = artifacts.find((a) => a.id === input.artifactId);
      if (!artifact || !artifact.content) {
        return { error: "Artifact not found or has no content" };
      }

      let newContent: string;
      if (input.replaceAll) {
        newContent = artifact.content.split(input.find).join(input.replace);
      } else {
        const idx = artifact.content.indexOf(input.find);
        if (idx === -1) {
          return { error: "Find string not found in artifact content" };
        }
        newContent = artifact.content.slice(0, idx) + input.replace + artifact.content.slice(idx + input.find.length);
      }

      await updateArtifactContent(input.artifactId, newContent);
      return {
        id: artifact.id,
        title: artifact.title,
        type: artifact.type,
        content: newContent,
      };
    },
  };
}
