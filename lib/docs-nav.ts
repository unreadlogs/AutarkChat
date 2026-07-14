import path from "path";
import { readFileSync, existsSync } from "fs";
import { cache } from "react";

export interface DocItem {
  slug: string;
  filePath: string; // relative to project root, e.g. "docs/architecture/README.md"
  sidebarPath: string; // relative to docs/ folder, e.g. "architecture/README.md"
}

export const DOCS_REGISTRY: DocItem[] = [
  { slug: "getting-started", filePath: "docs/getting-started.md", sidebarPath: "getting-started.md" },
  { slug: "overview", filePath: "docs/architecture/README.md", sidebarPath: "architecture/README.md" },
  { slug: "data-flow", filePath: "docs/architecture/data-flow.md", sidebarPath: "architecture/data-flow.md" },
  { slug: "auth-flow", filePath: "docs/architecture/auth-flow.md", sidebarPath: "architecture/auth-flow.md" },
  { slug: "api", filePath: "docs/api/README.md", sidebarPath: "api/README.md" },
  { slug: "authentication", filePath: "docs/api/authentication.md", sidebarPath: "api/authentication.md" },
  { slug: "chat", filePath: "docs/api/chat.md", sidebarPath: "api/chat.md" },
  { slug: "models", filePath: "docs/api/models.md", sidebarPath: "api/models.md" },
  { slug: "history", filePath: "docs/api/history.md", sidebarPath: "api/history.md" },
  { slug: "messages", filePath: "docs/api/messages.md", sidebarPath: "api/messages.md" },
  { slug: "sessions", filePath: "docs/api/sessions.md", sidebarPath: "api/sessions.md" },
  { slug: "usage", filePath: "docs/api/usage.md", sidebarPath: "api/usage.md" },
  { slug: "skills", filePath: "docs/api/skills.md", sidebarPath: "api/skills.md" },
  { slug: "system", filePath: "docs/api/system.md", sidebarPath: "api/system.md" },
  { slug: "files", filePath: "docs/api/files.md", sidebarPath: "api/files.md" },
  { slug: "configuration", filePath: "docs/guides/configuration.md", sidebarPath: "guides/configuration.md" },
  { slug: "personalization", filePath: "docs/guides/personalization.md", sidebarPath: "guides/personalization.md" },
  { slug: "model-registry", filePath: "docs/guides/model-registry.md", sidebarPath: "guides/model-registry.md" },
  { slug: "deployment", filePath: "docs/guides/deployment.md", sidebarPath: "guides/deployment.md" },
  { slug: "development", filePath: "docs/guides/development.md", sidebarPath: "guides/development.md" },
  { slug: "folder-structure", filePath: "docs/reference/folder-structure.md", sidebarPath: "reference/folder-structure.md" },
  { slug: "types", filePath: "docs/reference/types.md", sidebarPath: "reference/types.md" },
  { slug: "troubleshooting", filePath: "docs/reference/troubleshooting.md", sidebarPath: "reference/troubleshooting.md" },
  { slug: "changelog", filePath: "docs/CHANGELOG.md", sidebarPath: "changelog.md" },
];

export const slugToFile: Record<string, string> = {};
export const fileToRoute: Record<string, string> = {};
export const linkMap: Record<string, string> = {};

// Build lookup tables dynamically
for (const doc of DOCS_REGISTRY) {
  slugToFile[doc.slug] = doc.filePath;
  fileToRoute[doc.sidebarPath] = `/docs/${doc.slug}`;

  const key = doc.sidebarPath.replace(/\.md$/, "");
  linkMap[key] = `/docs/${doc.slug}`;
  if (key.endsWith("/README")) {
    linkMap[key.replace(/\/README$/, "")] = `/docs/${doc.slug}`;
  }
}

// Extra fallback mappings
linkMap["architecture/auth-flow"] = "/docs/auth-flow";
linkMap["architecture/data-flow"] = "/docs/data-flow";
linkMap["architecture/README"] = "/docs/overview";

export type NavLink = { label: string; href: string };
export type NavSection = { title: string; links: NavLink[] };

/** Read files safely using absolute paths */
export function safeReadFile(relativePath: string): string | null {
  try {
    const absolutePath = path.join(process.cwd(), relativePath);
    if (!existsSync(absolutePath)) {
      return null;
    }
    return readFileSync(absolutePath, "utf-8");
  } catch (error) {
    console.error(`[Docs] Failed to read file ${relativePath}:`, error);
    return null;
  }
}

function resolveHref(raw: string): string | null {
  if (raw.startsWith("/")) return raw;
  return fileToRoute[raw] ?? null;
}

/** Parses the sidebar markdown from sidebar.md safely with caching */
export const parseSidebar = cache((): NavSection[] => {
  const content = safeReadFile("docs/sidebar.md");
  if (!content) {
    // Fallback structure in case sidebar.md cannot be loaded
    return [
      {
        title: "Documentation",
        links: [{ label: "Home", href: "/docs" }],
      },
    ];
  }

  const lines = content.split("\n");
  const sections: NavSection[] = [];
  let currentSection: NavSection | null = null;

  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;

    const indented = line.startsWith("  ");
    const linkMatch = line.trim().match(/^\-\s+\[([^\]]+)\]\(([^)]+)\)$/);
    const sectionMatch = !indented && !linkMatch && line.trim().match(/^\-\s+(.+)$/);

    if (linkMatch) {
      const [, label, file] = linkMatch;
      const href = resolveHref(file);
      if (!href) continue;

      if (indented && currentSection) {
        currentSection.links.push({ label, href });
      } else {
        sections.push({ title: "", links: [{ label, href }] });
        currentSection = null;
      }
    } else if (sectionMatch && !indented) {
      currentSection = { title: sectionMatch[1].trim(), links: [] };
      sections.push(currentSection);
    }
  }

  return sections.filter((s) => s.links.length > 0);
});

/** Strip YAML frontmatter from markdown */
export function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\n?/, "");
}

/** Unified rewrite links utility for markdown content */
export function rewriteLinks(markdown: string): string {
  return markdown.replace(/\]\(([^)]+(?:\.md|README))\)/g, (_m, link: string) => {
    const key = link
      .replace(/^(\.\.?\/)+/, "")
      .replace(/\.md$/, "");
    const href = linkMap[key];
    if (href) {
      return `](${href})`;
    }
    const cleanKey = key.replace(/^\.\.?\/+/, "");
    return `](/docs/${cleanKey})`;
  });
}
