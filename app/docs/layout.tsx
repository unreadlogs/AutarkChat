import { parseSidebar } from "@/lib/docs-nav";
import { DocsShell } from "@/components/docs/docs-shell";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  // Parsed from docs/sidebar.md at request time — single source of truth
  const nav = parseSidebar();

  return <DocsShell nav={nav}>{children}</DocsShell>;
}
