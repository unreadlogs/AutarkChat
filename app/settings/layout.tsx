"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CpuIcon, BarChart3Icon, SettingsIcon, ShieldIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftIcon, ArrowLeftIcon, UserIcon, WrenchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const adminSecret = localStorage.getItem("admin_secret");
    if (!adminSecret) {
      router.push("/login");
      return;
    }

    // Validate token against backend database session
    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${adminSecret}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("admin_secret");
          router.push("/login");
        } else if (res.ok) {
          setIsAuthorized(true);
        }
      })
      .catch(() => {
        // Fallback for offline/network issues
        setIsAuthorized(true);
      });
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar_expanded");
      if (stored !== null) {
        setSidebarExpanded(stored === "true");
      }
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_expanded", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_secret");
    router.push("/login");
  };

  if (!isAuthorized) {
    return null;
  }

  const tabs = [
    { name: "General", href: "/settings", icon: SettingsIcon, active: pathname === "/settings" },
    { name: "Personalization", href: "/settings/personalization", icon: UserIcon, active: pathname === "/settings/personalization" },
    { name: "Skills", href: "/settings/skills", icon: WrenchIcon, active: pathname === "/settings/skills" },
    { name: "Models", href: "/settings/models", icon: CpuIcon, active: pathname === "/settings/models" },
    { name: "Sessions", href: "/settings/sessions", icon: ShieldIcon, active: pathname === "/settings/sessions" },
    { name: "Usage Stats", href: "/settings/usage", icon: BarChart3Icon, active: pathname === "/settings/usage" },
  ];

  const activeTab = tabs.find((t) => t.active);
  const activeTabName = activeTab ? activeTab.name : "Settings";

  return (
    <div className="flex h-dvh w-full flex-row overflow-hidden bg-background">
      {/* Settings Left Sidebar (Matching ChatSidebar design precisely) */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/40 bg-sidebar transition-all duration-300 h-dvh shrink-0 overflow-hidden",
          sidebarExpanded ? "w-[260px]" : "w-[60px] items-center"
        )}
      >
        {/* Top Header */}
        <div className={cn("flex h-16 items-center shrink-0 w-full px-4 justify-between", !sidebarExpanded && "justify-center")}>
          {sidebarExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/autark.svg" alt="Autark Logo" className="size-5 shrink-0 dark:invert" />
                <span className="text-[14px] font-semibold text-foreground truncate -tracking-[0.2px]">Settings Console</span>
              </div>
              <button
                onClick={handleToggleSidebar}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Collapse Sidebar"
                type="button"
              >
                <PanelLeftCloseIcon size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleSidebar}
              className="relative flex size-9 items-center justify-center rounded-xl hover:bg-muted transition-all duration-200 group"
              title="Expand Sidebar"
              type="button"
            >
              <img 
                src="/autark.svg" 
                alt="Autark Logo" 
                className="size-5.5 shrink-0 transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 dark:invert" 
              />
              <PanelLeftIcon 
                size={18} 
                className="absolute shrink-0 transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-muted-foreground" 
              />
            </button>
          )}
        </div>

        {/* Middle Content */}
        <div className="flex-1 overflow-y-auto w-full px-3.5 pb-4">
          <div className="flex flex-col gap-6 pt-4">
            {/* Back to Chat Button */}
            <button
              onClick={() => router.push("/")}
              className={cn(
                "flex items-center bg-sidebar-accent border border-border/30 hover:opacity-90 transition-all duration-200 shadow-sm shrink-0",
                sidebarExpanded 
                  ? "w-full px-3.5 py-2.5 gap-2.5 rounded-xl text-[13px] font-semibold text-foreground" 
                  : "size-9 justify-center rounded-xl mx-auto text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title="Back to chat"
              type="button"
            >
              <ArrowLeftIcon size={sidebarExpanded ? 15 : 18} className="shrink-0" />
              {sidebarExpanded && <span>Back to chat</span>}
            </button>

            {/* Settings tabs list */}
            <div className="flex flex-col gap-1 w-full">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    "group flex items-center transition-all duration-200 rounded-lg shrink-0",
                    sidebarExpanded
                      ? "w-full px-2.5 py-2 gap-2.5 text-[13px] font-medium"
                      : "size-9 justify-center mx-auto",
                    tab.active
                      ? "bg-sidebar-accent text-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                  title={tab.name}
                >
                  <tab.icon size={sidebarExpanded ? 14 : 18} className={cn("shrink-0", tab.active ? "opacity-100" : "opacity-60")} />
                  {sidebarExpanded && <span className="truncate">{tab.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="border-t border-border/40 p-3 w-full bg-sidebar shrink-0">
          <div className="flex flex-col gap-1.5 w-full">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center hover:bg-sidebar-accent/50 hover:text-foreground transition-all duration-200 rounded-lg text-left text-sidebar-foreground/75",
                sidebarExpanded
                  ? "w-full py-2 px-2.5 gap-3 text-[13px] font-medium"
                  : "size-9 justify-center mx-auto"
              )}
              title="Sign out"
              type="button"
            >
              <LogOutIcon size={sidebarExpanded ? 14 : 18} className="opacity-60 shrink-0" />
              {sidebarExpanded && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main settings panel */}
      <div className="flex min-w-0 flex-1 flex-col bg-background overflow-hidden">
        {/* Header matching ChatHeader style precisely */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground -tracking-[0.2px]">{activeTabName} Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/60 hidden sm:inline">Admin Mode</span>
          </div>
        </header>

        {/* Scrollable Container for Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-6 py-8 pb-16">
            <main className="min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
