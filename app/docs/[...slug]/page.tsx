import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/docs/markdown-content";
import { stripFrontmatter, rewriteLinks, safeReadFile, slugToFile } from "@/lib/docs-nav";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return Object.keys(slugToFile).map((slug) => ({
    slug: slug.split("/"),
  }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  const filePath = slugToFile[slugStr];
  if (!filePath) {
    notFound();
  }

  const raw = safeReadFile(filePath);
  if (!raw) {
    notFound();
  }

  const transformed = rewriteLinks(stripFrontmatter(raw));
  return <MarkdownContent markdown={transformed} />;
}
