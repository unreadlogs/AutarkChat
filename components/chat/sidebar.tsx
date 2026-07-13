"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, TrashIcon, MessageSquareIcon, SettingsIcon, MoonIcon, SunIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftIcon, BarChart3Icon, Pin, GitCompareIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ChatHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
};

type GroupedChats = {
  today: ChatHistoryItem[];
  yesterday: ChatHistoryItem[];
  lastWeek: ChatHistoryItem[];
  lastMonth: ChatHistoryItem[];
  older: ChatHistoryItem[];
};

function groupChatsByDate(chats: ChatHistoryItem[]): GroupedChats {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  const unpinned = chats.filter((c) => !c.pinned);

  return unpinned.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);
      if (isToday(chatDate)) groups.today.push(chat);
      else if (isYesterday(chatDate)) groups.yesterday.push(chat);
      else if (chatDate > oneWeekAgo) groups.lastWeek.push(chat);
      else if (chatDate > oneMonthAgo) groups.lastMonth.push(chat);
      else groups.older.push(chat);
      return groups;
    },
    { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] } as GroupedChats
  );
}

type ChatSidebarProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
  currentChatId?: string;
  currentChatTitle?: string;
};

export function ChatSidebar({ isExpanded, onToggleExpand, currentChatId, currentChatTitle }: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsActive = pathname ? pathname.startsWith("/settings") : false;
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { setTheme, resolvedTheme } = useTheme();

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_secret") : null;
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/history?limit=50", {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [router, getAuthHeaders]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Sync the generated title back into the local chat list
  useEffect(() => {
    if (currentChatId && currentChatTitle) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId && c.title !== currentChatTitle
            ? { ...c, title: currentChatTitle }
            : c
        )
      );
    }
  }, [currentChatId, currentChatTitle]);

  const handleDelete = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat?id=${chatId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error();
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        setDeleteId(null);
        if (currentChatId === chatId) router.push("/");
      } catch {
        toast.error("Failed to delete chat");
        setDeleteId(null);
      }
    },
    [currentChatId, router, getAuthHeaders]
  );

  const handleNewChat = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      router.push(`/chat/${chatId}`);
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_secret");
    router.push("/login");
  }, [router]);

  const handleThemeToggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const grouped = groupChatsByDate(chats);

  const handleTogglePin = useCallback(
    async (chatId: string, pinned: boolean) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinned } : c))
      );

      try {
        const res = await fetch(`/api/chat?id=${chatId}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ pinned }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, pinned: !pinned } : c))
        );
        toast.error("Failed to update pin status");
      }
    },
    [getAuthHeaders]
  );

  const renderGroup = (label: string, items: ChatHistoryItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="mb-2 px-2.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground/50 select-none">
          {label}
        </div>
        {items.map((chat) => (
          <div key={chat.id}>
            <div
              onClick={() => handleSelectChat(chat.id)}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] transition-all duration-150 cursor-pointer select-none",
                chat.id === currentChatId
                  ? "bg-sidebar-accent text-black dark:text-white font-semibold"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-foreground"
              )}
            >
              <span className="flex-1 truncate">{chat.title ? chat.title.slice(0, 40) : "New Chat"}</span>

              {/* Pin button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(chat.id, !chat.pinned);
                }}
                className={cn(
                  "flex size-5 items-center justify-center rounded transition-all duration-150 hover:bg-muted shrink-0",
                  chat.pinned 
                    ? "opacity-100 text-foreground" 
                    : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                )}
                type="button"
                title={chat.pinned ? "Unpin chat" : "Pin chat"}
              >
                <Pin size={11} className={chat.pinned ? "fill-current rotate-45" : ""} />
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(chat.id);
                }}
                className="flex size-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 shrink-0"
                type="button"
                title="Delete chat"
              >
                <TrashIcon size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/40 bg-sidebar transition-all duration-300 h-dvh shrink-0 overflow-hidden",
          isExpanded ? "w-[260px]" : "w-[60px] items-center"
        )}
      >
        {/* Top Header */}
        <div className={cn("flex h-16 items-center shrink-0 w-full px-4 justify-between", !isExpanded && "justify-center")}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/autark.svg" alt="Autark Logo" className="size-5 shrink-0 dark:invert" />
                <span className="text-[14px] font-semibold text-foreground truncate -tracking-[0.2px]">AutarkChat</span>
              </div>
              <button
                onClick={onToggleExpand}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Collapse Sidebar"
                type="button"
              >
                <PanelLeftCloseIcon size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleExpand}
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
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className={cn(
                "flex items-center bg-sidebar-accent border border-border/30 hover:opacity-90 transition-all duration-200 shadow-sm shrink-0",
                isExpanded 
                  ? "w-full px-3.5 py-2.5 gap-2.5 rounded-xl text-[13px] font-semibold text-foreground" 
                  : "size-9 justify-center rounded-xl mx-auto text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title="New Chat"
              type="button"
            >
              <PlusIcon size={isExpanded ? 15 : 18} className="shrink-0" />
              {isExpanded && <span>New chat</span>}
            </button>

            {/* Chats list / Collapsed Icon */}
            {isExpanded ? (
              <div className="space-y-1">
                <h4 className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Chats</h4>
                {isLoading ? (
                  <div className="flex flex-col gap-0.5 px-1 pt-1">
                    {[44, 32, 28, 64, 52].map((w) => (
                      <div className="flex h-8 items-center gap-2 rounded-lg px-2" key={w}>
                        <div
                          className="h-3 flex-1 animate-pulse rounded-md bg-muted"
                          style={{ maxWidth: `${w}%` }}
                        />
                      </div>
                    ))}
                  </div>
                ) : chats.length === 0 ? (
                  <div className="px-2.5 py-4 text-xs text-muted-foreground/50 italic">
                    No conversations yet
                  </div>
                ) : (
                  <>
                    {renderGroup("Pinned", chats.filter((c) => c.pinned))}
                    {renderGroup("Today", grouped.today)}
                    {renderGroup("Yesterday", grouped.yesterday)}
                    {renderGroup("Last 7 days", grouped.lastWeek)}
                    {renderGroup("Last 30 days", grouped.lastMonth)}
                    {renderGroup("Older", grouped.older)}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onToggleExpand}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all hover:scale-105 active:scale-95 shrink-0 mx-auto"
                title="Expand Chat History"
                type="button"
              >
                <MessageSquareIcon size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Footer Area: Matches image copy 2.png */}
        <div className="border-t border-border/40 p-3 w-full bg-sidebar shrink-0">
          <div className="flex flex-col gap-1.5 w-full">
            {/* Compare Link */}
            <button
              onClick={() => router.push("/compare")}
              className={cn(
                "flex items-center hover:bg-sidebar-accent/50 hover:text-foreground transition-all duration-200 rounded-lg text-left text-sidebar-foreground/75",
                isExpanded
                  ? "w-full py-2 px-2.5 gap-3 text-[13px] font-medium"
                  : "size-9 justify-center mx-auto"
              )}
              type="button"
              title="Compare Models"
            >
              <GitCompareIcon size={isExpanded ? 14 : 18} className={cn("shrink-0", "opacity-60")} />
              {isExpanded && <span>Compare</span>}
            </button>

            {/* Settings Link */}
            <button
              onClick={() => router.push("/settings")}
              className={cn(
                "flex items-center hover:bg-sidebar-accent/50 hover:text-foreground transition-all duration-200 rounded-lg text-left text-sidebar-foreground/75",
                isExpanded
                  ? "w-full py-2 px-2.5 gap-3 text-[13px] font-medium"
                  : "size-9 justify-center mx-auto"
              )}
              type="button"
              title="Settings"
            >
              <SettingsIcon size={isExpanded ? 14 : 18} className={cn("shrink-0", isSettingsActive ? "opacity-100" : "opacity-60")} />
              {isExpanded && <span>Settings</span>}
            </button>

            {/* GitHub Link */}
            {isExpanded && (
              <a
                href="https://github.com/unreadlogs/autarkchat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full py-2 px-2.5 rounded-lg hover:bg-sidebar-accent/50 hover:text-foreground transition-colors text-[13px] font-medium text-sidebar-foreground/75"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 fill-current opacity-60 shrink-0"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.08 6.839 9.404.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.077 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span>GitHub Repository</span>
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold">Delete chat?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteId && handleDelete(deleteId)}
                  className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
