"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import type { NavSection } from "@/lib/docs-nav";

function getBreadcrumb(
  nav: NavSection[],
  pathname: string
): { section: string; label: string } | null {
  for (const section of nav) {
    for (const link of section.links) {
      if (pathname === link.href) {
        return { section: section.title || "Docs", label: link.label };
      }
    }
  }
  if (pathname === "/docs") return { section: "AutarkChat", label: "Documentation" };
  return null;
}

export function DocsShell({
  nav,
  children,
}: {
  nav: NavSection[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breadcrumb = getBreadcrumb(nav, pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--canvas)]">
      {/* Sidebar — receives nav from server */}
      <DocsSidebar
        nav={nav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--hairline-soft)] bg-[var(--canvas)] px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex md:hidden size-8 items-center justify-center rounded-md text-[var(--graphite)] hover:bg-[var(--hairline)] hover:text-[var(--ink)] transition-colors"
            type="button"
            aria-label="Open sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          {breadcrumb && (
            <nav className="flex items-center gap-1.5 text-[12.5px] min-w-0 overflow-hidden">
              <span className="text-[var(--stone-t)] shrink-0">{breadcrumb.section}</span>
              {breadcrumb.label !== "Documentation" && (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--stone-t)]">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span className="text-[var(--ink)] font-medium truncate">{breadcrumb.label}</span>
                </>
              )}
            </nav>
          )}

          {/* Back to App */}
          <div className="ml-auto">
            <Link
              href="/chat"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--hairline-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--graphite)] hover:border-[var(--ink)]/25 hover:bg-[var(--hairline)] hover:text-[var(--ink)] transition-all"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to App
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-10 pb-28 lg:px-8">
            <main className="docs-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
