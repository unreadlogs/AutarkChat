"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUpIcon, PlusIcon, LayersIcon, XIcon, StopCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { CompareModelConfig } from "@/lib/compare/compare-types";

type CompareInputProps = {
  prompt: string;
  setPrompt: (val: string) => void;
  selectedModels: CompareModelConfig[];
  onOpenModelPicker: () => void;
  onRemoveModel: (id: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isGenerating: boolean;
};

export function CompareInput({
  prompt,
  setPrompt,
  selectedModels,
  onOpenModelPicker,
  onRemoveModel,
  onSubmit,
  onStop,
  isGenerating,
}: CompareInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const hotkey =
        typeof window !== "undefined"
          ? localStorage.getItem("message_hotkey") || "enter"
          : "enter";
      const isSend =
        hotkey === "cmd_enter"
          ? e.key === "Enter" && (e.metaKey || e.ctrlKey)
          : e.key === "Enter" && !e.shiftKey;

      if (isSend) {
        e.preventDefault();
        if (prompt.trim() && selectedModels.length >= 2 && !isGenerating) {
          onSubmit();
        } else if (isGenerating) {
          onStop();
        }
      }
    },
    [prompt, selectedModels.length, isGenerating, onSubmit, onStop]
  );

  const isReady = prompt.trim().length > 0 && selectedModels.length >= 2 && !isGenerating;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      {/* Model pills */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedModels.map((model) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-foreground/80 select-none"
          >
            <LayersIcon size={10} className="text-muted-foreground/50" />
            <span className="truncate max-w-[100px]">{model.name}</span>
            {!isGenerating && (
              <button
                type="button"
                onClick={() => onRemoveModel(model.id)}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <XIcon size={10} />
              </button>
            )}
          </motion.div>
        ))}

        {!isGenerating && selectedModels.length < 6 && (
          <button
            type="button"
            onClick={onOpenModelPicker}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/50 px-3 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <PlusIcon size={11} />
            Add model
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="relative rounded-2xl border border-border/30 bg-card/70 transition-shadow duration-300 focus-within:shadow-[var(--shadow-composer-focus)]">
        <textarea
          ref={textareaRef}
          className="min-h-[80px] w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/35 outline-none"
          placeholder="Enter a prompt to compare model responses…"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            {/* Generated response count info */}
            {selectedModels.length >= 2 ? (
              <span className="text-[10px] text-muted-foreground/50 font-medium">
                {selectedModels.length} models
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/35 italic">
                Select at least 2 models
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-[11px] font-semibold text-background transition-opacity hover:opacity-85"
              >
                <StopCircleIcon size={14} />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!isReady}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-all",
                  isReady
                    ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                    : "bg-muted text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <ArrowUpIcon size={14} />
                Compare
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
