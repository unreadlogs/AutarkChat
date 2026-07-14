import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/docs/markdown-content";
import { stripFrontmatter, rewriteLinks, safeReadFile } from "@/lib/docs-nav";

export const dynamic = "force-static";

export default function DocsHome() {
  const raw = safeReadFile("docs/README.md");
  if (!raw) {
    notFound();
  }
  const transformed = rewriteLinks(stripFrontmatter(raw));
  return <MarkdownContent markdown={transformed} />;
}
