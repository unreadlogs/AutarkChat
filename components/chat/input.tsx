"use client";

import { type ChangeEvent, useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, PaperclipIcon, XIcon, Loader2Icon, LockIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn, generateUUID } from "@/lib/utils";
import { StopIcon, ModelIcon } from "./icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Attachment = {
  id: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
};

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  models: Array<{ id: string; name: string; modelId?: string }>;
  compareLocked?: boolean;
};

export function ChatInput({
  input,
  setInput,
  onSubmit,
  onStop,
  isLoading,
  disabled,
  attachments,
  setAttachments,
  selectedModels,
  onModelsChange,
  models,
  compareLocked,
}: ChatInputProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const hotkeySetting = typeof window !== "undefined" ? localStorage.getItem("message_hotkey") || "enter" : "enter";
      const isSendKey = hotkeySetting === "cmd_enter" 
        ? (e.key === "Enter" && (e.metaKey || e.ctrlKey))
        : (e.key === "Enter" && !e.shiftKey);

      if (isSendKey) {
        e.preventDefault();
        if (!input.trim() && attachments.length === 0) return;
        if (isLoading) {
          onStop?.();
        } else {
          onSubmit();
        }
      }
    },
    [input, isLoading, onSubmit, onStop, attachments.length]
  );

  const handleSubmit = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading) {
      onStop?.();
    } else {
      onSubmit();
    }
  }, [input, isLoading, onSubmit, onStop, attachments.length]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    const secret = localStorage.getItem("admin_secret");
    if (!secret) {
      toast.error("Please log in to upload files.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setAttachments((prev) => [
        ...prev,
        {
          id: generateUUID(),
          url: data.url,
          name: data.pathname || file.name,
          contentType: data.contentType || file.type,
          size: file.size,
        },
      ]);
      toast.success("File attached successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to attach file");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedModelObjects = models.filter((m) => selectedModels.includes(m.id));
  const activeName =
    selectedModelObjects.length === 0
      ? "Select model"
      : selectedModelObjects.length === 1
        ? selectedModelObjects[0].name
        : `Compare (${selectedModelObjects.length})`;

  return (
    <div className="relative flex w-full flex-col gap-2">
      {/* File Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-1.5 pr-8 text-xs text-foreground group"
            >
              {file.contentType.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="size-8 rounded object-cover"
                />
              ) : (
                <div className="size-8 rounded bg-muted/60 flex items-center justify-center font-bold text-[10px]">
                  FILE
                </div>
              )}
              <span className="max-w-[120px] truncate font-medium text-[11px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <div className="rounded-2xl border border-border/30 bg-card/70 shadow-[var(--shadow-composer)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-composer-focus)]">
          <textarea
            ref={textareaRef}
            className="min-h-[96px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1.5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/35 outline-none"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={3}
            value={input}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Attachment Actions & Model Selector */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || disabled}
                className="flex size-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                title="Attach Image"
              >
                {isUploading ? (
                  <Loader2Icon size={15} className="animate-spin text-muted-foreground" />
                ) : (
                  <PaperclipIcon size={15} />
                )}
              </button>

              {/* Model selection dropdown inside the chatbox action row! */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => !compareLocked && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={compareLocked}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold transition-all select-none",
                    compareLocked
                      ? "text-foreground/50 cursor-default"
                      : "hover:bg-muted text-foreground/80"
                  )}
                  type="button"
                >
                  <LockIcon size={10} className="text-muted-foreground/60 shrink-0" />
                  <span className="truncate max-w-[100px] md:max-w-[150px] -tracking-[0.16px]">
                    {activeName}
                  </span>
                  {!compareLocked && (
                    <ChevronDownIcon
                      size={11}
                      className={cn(
                        "text-muted-foreground/50 shrink-0 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl border border-border/40 bg-card p-1.5 shadow-lg"
                    >
                      <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {models.length === 0 ? (
                          <div className="px-2.5 py-2 text-xs text-muted-foreground/75 font-semibold text-center">
                            No models configured.{" "}
                            <button
                              onClick={() => {
                                router.push("/settings/models");
                                setIsDropdownOpen(false);
                              }}
                              className="text-primary underline hover:opacity-90 font-bold block mx-auto mt-1"
                              type="button"
                            >
                              Add Model in Settings
                            </button>
                          </div>
                        ) : (
                          models.map((model) => {
                          const isSelected = selectedModels.includes(model.id);
                          return (
                            <button
                              key={model.id}
                              onClick={() => {
                                onModelsChange(
                                  isSelected
                                    ? selectedModels.filter((id) => id !== model.id)
                                    : [...selectedModels, model.id]
                                );
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors",
                                isSelected
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                              type="button"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <ModelIcon name={model.modelId ?? model.name} />
                                {model.name}
                              </span>
                              {isSelected && (
                                <CheckIcon size={12} className="shrink-0 text-foreground" />
                              )}
                            </button>
                          );
                        })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Submit button */}
            {isLoading ? (
              <button
                onClick={onStop}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95"
                type="button"
              >
                <StopIcon size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={(!input.trim() && attachments.length === 0) || isUploading || disabled}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200",
                  input.trim() || attachments.length > 0
                    ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                    : "bg-muted text-muted-foreground/25 cursor-not-allowed"
                )}
                type="button"
              >
                <ArrowUpIcon className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
