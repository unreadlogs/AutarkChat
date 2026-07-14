import { z } from "zod";
import { generateUUID } from "../../utils";
import fs from "fs/promises";
import path from "path";

export const artifactSchema = z.object({
  filePaths: z.array(z.string().min(1)).min(1),
});

export type ArtifactInput = z.infer<typeof artifactSchema>;

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.py': 'text/x-python',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.xml': 'text/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
};

function getMimeType(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] || 'application/octet-stream';
}

export function artifactTool(chatId: string, messageId: string) {
  return {
    description: "Expose generated files (PDFs, images, code, etc.) as viewable artifacts in the chat side panel. Call this after generating files with execute_command.",
    parameters: artifactSchema,
    execute: async (input: ArtifactInput) => {
      const { createArtifact } = await import("../../queries");
      const artifactsDir = path.join(process.cwd(), "public", "artifacts");
      await fs.mkdir(artifactsDir, { recursive: true });

      const results = [];
      for (const fp of input.filePaths) {
        const absPath = path.resolve(process.cwd(), fp);
        if (!absPath.startsWith(process.cwd())) {
          results.push({ title: fp, error: "File must be within workspace" });
          continue;
        }

        try {
          const stat = await fs.stat(absPath);
          if (!stat.isFile()) {
            results.push({ title: fp, error: "Not a file" });
            continue;
          }

          const ext = path.extname(absPath);
          const id = generateUUID();
          const destName = `${id}${ext}`;
          await fs.copyFile(absPath, path.join(artifactsDir, destName));

          const now = new Date();
          const artifact = {
            id,
            chatId,
            messageId,
            title: path.basename(fp),
            filePath: fp,
            url: `/artifacts/${destName}`,
            mimeType: getMimeType(ext),
            size: stat.size,
            createdAt: now,
          };

          await createArtifact(artifact);

          results.push(artifact);
        } catch (err: any) {
          results.push({ title: fp, error: err.message });
        }
      }

      return { artifacts: results };
    },
  };
}
