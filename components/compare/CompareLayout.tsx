"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayersIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatShell } from "@/components/chat/shell";
import { ChatSidebar } from "@/components/chat/sidebar";
import { ModelPicker } from "./ModelPicker";
import type { CompareModelConfig } from "@/lib/compare/compare-types";

const STORAGE_KEY_SELECTED = "compare_selected_models";
const STORAGE_KEY_FAVORITES = "compare_favorite_models";
const STORAGE_KEY_RECENT = "compare_recent_models";

function loadArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveArray(key: string, arr: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

export function CompareLayout() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [allModels, setAllModels] = useState<CompareModelConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    loadArray(STORAGE_KEY_SELECTED)
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    loadArray(STORAGE_KEY_FAVORITES)
  );
  const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(() =>
    loadArray(STORAGE_KEY_RECENT)
  );
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [startChat, setStartChat] = useState(false);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar_expanded");
      if (stored !== null) {
        setSidebarExpanded(stored === "true");
      }
    }
  }, []);

  // Auth guard
  useEffect(() => {
    const adminSecret = localStorage.getItem("admin_secret");
    if (!adminSecret) {
      router.push("/login");
      return;
    }
    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${adminSecret}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("admin_secret");
          router.push("/login");
        } else if (res.ok) {
          setSecret(adminSecret);
          setIsAuthorized(true);
        }
      })
      .catch(() => {
        setSecret(adminSecret);
        setIsAuthorized(true);
      });
  }, [router]);

  // Load models
  useEffect(() => {
    if (!secret) return;
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models", {
          headers: { Authorization: `Bearer ${secret}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllModels(data.models || []);
        }
      } catch {}
    };
    fetchModels();
  }, [secret]);

  useEffect(() => {
    saveArray(STORAGE_KEY_SELECTED, selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    saveArray(STORAGE_KEY_FAVORITES, favoriteIds);
  }, [favoriteIds]);

  const toggleModel = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  }, []);

  const removeModel = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleStart = useCallback(() => {
    if (selectedIds.length < 2) return;
    setStartChat(true);
  }, [selectedIds]);

  const handleNewCompare = useCallback(() => {
    setStartChat(false);
    setSelectedIds([]);
  }, []);

  const selectedModels = allModels.filter((m) => selectedIds.includes(m.id));

  if (!isAuthorized) return null;

  // Once user clicks "Start Compare", render the full ChatShell with selected models
  if (startChat && selectedIds.length >= 2) {
    return (
      <ChatShell
        initialSelectedModels={selectedIds}
        compareLocked={true}
      />
    );
  }

  return (
    <div className="flex h-dvh w-full flex-row overflow-hidden">
      <ChatSidebar
        isExpanded={sidebarExpanded}
        onToggleExpand={() => {
          const next = !sidebarExpanded;
          setSidebarExpanded(next);
          localStorage.setItem("sidebar_expanded", String(next));
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur px-4 justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <LayersIcon size={15} className="text-muted-foreground/60 shrink-0" />
            <span className="text-[13px] font-medium text-foreground/80 truncate">
              Compare
            </span>
            {selectedIds.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50 font-medium">
                {selectedIds.length} models
              </span>
            )}
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center px-4 max-w-md w-full"
          >
            {/* Model avatars */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="size-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[12px] font-bold text-muted-foreground/60"
                  >
                    {["A", "B", "C"][i]}
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-xl font-semibold -tracking-[0.5px] text-foreground text-center">
              Compare model responses
            </h2>
            <p className="mt-2.5 text-[13px] text-muted-foreground/70 text-center leading-relaxed">
              Pick models below, then start a chat where every prompt is sent to all selected models at once.
            </p>

            {/* Selected model pills */}
            <div className="flex flex-wrap items-center gap-2 mt-6 w-full justify-center">
              {selectedModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 pl-3 pr-1.5 py-1 text-[11px] font-medium text-foreground/80 select-none"
                >
                  <span className="truncate max-w-[120px]">{model.name}</span>
                  <button
                    type="button"
                    onClick={() => removeModel(model.id)}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <PlusIcon size={10} className="rotate-45" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsModelPickerOpen(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-border/50 px-3 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <PlusIcon size={11} />
                Add model
              </button>
            </div>

            {/* Start button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={selectedIds.length < 2}
              className={cn(
                "mt-6 flex h-9 items-center gap-2 rounded-full px-6 text-[12px] font-semibold transition-all duration-200",
                selectedIds.length >= 2
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <LayersIcon size={13} />
              Start compare ({selectedIds.length} models)
            </button>
          </motion.div>
        </div>
      </div>

      <ModelPicker
        isOpen={isModelPickerOpen}
        onClose={() => setIsModelPickerOpen(false)}
        models={allModels}
        selectedIds={selectedIds}
        onToggleModel={toggleModel}
        recentlyUsedIds={recentlyUsedIds}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
