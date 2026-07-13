import type { ArtifactType } from "../types";

export type ArtifactHandler = {
  kind: ArtifactType;
  label: string;
  language?: string;
};

export const artifactHandlers: Record<ArtifactType, ArtifactHandler> = {
  text: {
    kind: "text",
    label: "Document",
  },
  code: {
    kind: "code",
    label: "Code",
    language: "typescript",
  },
  sheet: {
    kind: "sheet",
    label: "Spreadsheet",
  },
  image: {
    kind: "image",
    label: "Image",
  },
};

export function parseCsv(content: string): string[][] {
  return content.split("\n").filter((row) => row.trim()).map((row) => row.split(",").map((cell) => cell.trim()));
}
