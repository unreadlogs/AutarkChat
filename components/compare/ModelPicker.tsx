"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchIcon,
  XIcon,
  CheckIcon,
  StarIcon,
  CpuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompareModelConfig } from "@/lib/compare/compare-types";
import { ModelIcon } from "@/components/chat/icons";

type ModelPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  models: CompareModelConfig[];
  selectedIds: string[];
  onToggleModel: (id: string) => void;
  recentlyUsedIds: string[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
};

export function ModelPicker({
  isOpen,
  onClose,
  models,
  selectedIds,
  onToggleModel,
  recentlyUsedIds,
  favoriteIds,
  onToggleFavorite,
}: ModelPickerProps) {
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen]);

  const providers = useMemo(
    () => [...new Set(models.map((m) => m.provider))].sort(),
    [models]
  );

  const filtered = useMemo(() => {
    let list = models;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.modelId.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      );
    }
    if (filterProvider) {
      list = list.filter((m) => m.provider === filterProvider);
    }
    // Sort: favorites first, then recently used, then rest
    return [...list].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      const aRecent = recentlyUsedIds.includes(a.id) ? 0.5 : 0;
      const bRecent = recentlyUsedIds.includes(b.id) ? 0.5 : 0;
      return bRecent - aRecent;
    });
  }, [models, search, filterProvider, favoriteIds, recentlyUsedIds]);

  const handleToggle = useCallback(
    (id: string) => {
      onToggleModel(id);
    },
    [onToggleModel]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Selection
                </p>
                <h2 className="text-[16px] font-semibold -tracking-[0.4px] text-foreground">
                  Choose Models
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2 border-b border-border/20 px-5 py-3">
              <div className="relative flex-1">
                <SearchIcon
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-border/30 bg-transparent pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/35 outline-none transition-colors focus:border-foreground"
                  autoFocus
                />
              </div>
              <div className="flex gap-1">
                {providers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setFilterProvider(filterProvider === p ? null : p)
                    }
                    className={cn(
                      "h-7 rounded-md border px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors",
                      filterProvider === p
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/40 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Model list */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-[12px] italic text-muted-foreground/50">
                  No models match your search.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((model) => {
                    const isSelected = selectedIds.includes(model.id);
                    const isFav = favoriteIds.includes(model.id);
                    const isRecent = recentlyUsedIds.includes(model.id);
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleToggle(model.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-colors cursor-pointer",
                          isSelected
                            ? "bg-muted/30"
                            : "hover:bg-muted/10"
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            isSelected
                              ? "border-foreground bg-foreground"
                              : "border-border"
                          )}
                        >
                          {isSelected && (
                            <CheckIcon
                              size={11}
                              className="text-background"
                              strokeWidth={3}
                            />
                          )}
                        </div>

                        {/* Icon */}
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50 overflow-hidden">
                          <ModelIcon name={model.modelId} size={16} />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-foreground truncate">
                              {model.name}
                            </span>
                            {isRecent && (
                              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5 leading-none">
                                Recent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                            <span className="font-medium">{model.provider}</span>
                            <span>·</span>
                            <span className="font-mono">{model.modelId}</span>
                          </div>
                        </div>

                        {/* Favorite */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(model.id);
                          }}
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                            isFav
                              ? "text-foreground"
                              : "text-muted-foreground/30 hover:text-muted-foreground/60"
                          )}
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <StarIcon
                            size={13}
                            className={cn(isFav && "fill-current")}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
              <span className="text-[11px] text-muted-foreground/60">
                {selectedIds.length} selected · {filtered.length} models
              </span>
              <button
                type="button"
                onClick={onClose}
                className="h-8 rounded-full bg-foreground px-4 text-[11px] font-semibold text-background transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
