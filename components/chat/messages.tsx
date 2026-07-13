"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownIcon, CopyIcon, CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DBMessage, DBArtifact, AttachmentRef, MessageResponseUsage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { Greeting } from "./greeting";
import { MessageBubble, ThinkingMessage } from "./message";
import { ModelIcon } from "./icons";

export type ChatItem = {
  key: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AttachmentRef[];
  artifacts?: DBArtifact[];
  model?: string;
  modelLabel?: string;
  isMultiModel?: boolean;
  responseIndex?: number;
  totalResponses?: number;
  usage?: MessageResponseUsage | null;
  // For grouped multi-model rendering
  groupedResponses?: ChatItem[];
};

function flattenTurns(
  turns: DBMessage[],
  artifacts: DBArtifact[],
  models: Array<{ id: string; name: string; modelId: string }>
): ChatItem[] {
  // Build two lookup maps: by modelId (e.g. "gpt-4o") AND by UUID id
  const nameByModelId = new Map<string, string>();
  const nameById = new Map<string, string>();
  for (const m of models) {
    nameByModelId.set(m.modelId, m.name);
    nameById.set(m.id, m.name);
  }

  const resolveLabel = (model: string) =>
    nameByModelId.get(model) ?? nameById.get(model) ?? model;

  const items: ChatItem[] = [];
  const seenIds = new Set<string>();

  for (const turn of turns) {
    // Skip non-user turns (assistant/system rows that may exist in legacy data)
    if (turn.role !== "user") continue;

    // Guard against duplicate turn IDs to prevent React key conflicts
    if (seenIds.has(turn.id)) continue;
    seenIds.add(turn.id);

    items.push({
      key: `user-${turn.id}`,
      role: "user",
      content: turn.content,
      attachments: turn.attachments,
    });

    const responses = turn.responses ?? [];
    const turnArtifacts = artifacts.filter((a) => a.messageId === turn.id);

    if (responses.length === 0) continue;

    if (responses.length > 1) {
      // Multi-model: group into a single grid item
      const groupedResponses: ChatItem[] = responses.map((response, index) => ({
        key: `assistant-${turn.id}-${index}`,
        role: "assistant",
        content: response.content ?? "",
        artifacts: index === 0 ? turnArtifacts : undefined,
        model: response.model,
        modelLabel: resolveLabel(response.model),
        isMultiModel: true,
        responseIndex: index,
        totalResponses: responses.length,
        usage: response.usage ?? null,
      }));

      items.push({
        key: `group-${turn.id}`,
        role: "assistant",
        content: "",
        isMultiModel: true,
        groupedResponses,
      });
    } else {
      // Single model: normal message bubble
      const response = responses[0];
      items.push({
        key: `assistant-${turn.id}-0`,
        role: "assistant",
        content: response.content ?? "",
        artifacts: turnArtifacts,
        model: response.model,
        modelLabel: resolveLabel(response.model),
        isMultiModel: false,
        responseIndex: 0,
        totalResponses: 1,
        usage: response.usage ?? null,
      });
    }
  }

  return items;
}

// ── Side-by-side multi-model response grid ────────────────────────────────────

function ModelCard({
  resp,
  isStreaming,
  onSelectArtifact,
}: {
  resp: ChatItem;
  isStreaming: boolean;
  onSelectArtifact?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const textContent = resp.content ?? "";
  const hasContent = textContent.trim().length > 0;
  const isThinking = isStreaming && !hasContent;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);

  return (
    <div className="group flex flex-col min-w-0 flex-1 overflow-hidden rounded-xl border border-border/40 bg-card/50">
      {/* Card header */}
      <div className="flex items-center gap-2 border-b border-border/30 bg-card/80 px-3 py-2.5 shrink-0">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ModelIcon name={resp.model ?? resp.modelLabel ?? ""} size={11} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] font-semibold text-foreground truncate leading-tight">
            {resp.modelLabel || resp.model || "Model"}
          </span>
        </div>
        {/* Streaming dot */}
        {isStreaming && (
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/60 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
          </span>
        )}
        {/* Token badge */}
        {resp.usage && resp.usage.totalTokens > 0 && !isStreaming && (
          <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-muted-foreground/45 tabular-nums shrink-0">
            <span>{resp.usage.totalTokens.toLocaleString()} tok</span>
            <span className="text-muted-foreground/30">/</span>
            <span>{resp.usage.promptTokens.toLocaleString()} in</span>
            <span className="text-muted-foreground/30">+</span>
            <span>{resp.usage.completionTokens.toLocaleString()} out</span>
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[80px]">
        {isThinking ? (
          <div className="flex min-h-[60px] items-center">
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-muted-foreground/40 italic">Generating…</span>
            </div>
          </div>
        ) : (
          <>
            {hasContent && (
              <div className="prose prose-neutral dark:prose-invert max-w-none text-[13px] leading-[1.65] break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ children }) => (
                      <pre className="overflow-x-auto rounded-lg bg-foreground p-3 text-[11px] leading-[1.6] text-background">
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <code className={className} {...props}>{children}</code>
                      ) : (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]" {...props}>{children}</code>
                      );
                    },
                  }}
                >
                  {sanitizeText(textContent)}
                </ReactMarkdown>
              </div>
            )}

            {resp.artifacts && resp.artifacts.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-3">
                {resp.artifacts.map((artifact) => {
                  const label =
                    artifact.type === "code" ? "Code:" :
                    artifact.type === "sheet" ? "Sheet:" : "Doc:";
                  return (
                    <button
                      key={artifact.id}
                      onClick={() => onSelectArtifact?.(artifact.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-muted/40 px-2.5 py-1.5 text-[11px] hover:bg-muted transition-colors cursor-pointer text-left w-full"
                      type="button"
                    >
                      <span className="font-medium text-foreground/80 shrink-0">{label}</span>
                      <span className="underline truncate text-muted-foreground">{artifact.title || artifact.id}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Card footer */}
      {hasContent && (
        <div className="flex items-center border-t border-border/20 px-4 py-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

function MultiModelGrid({
  responses,
  isStreaming,
  onSelectArtifact,
}: {
  responses: ChatItem[];
  isStreaming: boolean;
  onSelectArtifact?: (id: string) => void;
}) {
  const count = responses.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
      data-role="assistant"
    >
      {count > 3 ? (
        /* 4+ models: scrollable horizontal row */
        <div
          className="overflow-x-auto pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="flex gap-3" style={{ width: "max-content", minWidth: "100%" }}>
            {responses.map((resp) => (
              <div
                key={resp.key}
                style={{
                  scrollSnapAlign: "start",
                  width: "280px",
                  flexShrink: 0,
                }}
              >
                <ModelCard
                  resp={resp}
                  isStreaming={isStreaming}
                  onSelectArtifact={onSelectArtifact}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 1, 2, or 3 models: grid columns so they all fit on screen together */
        <div
          className={cn(
            "grid gap-3 w-full",
            count === 1 ? "grid-cols-1" :
            count === 2 ? "grid-cols-2" :
            "grid-cols-3"
          )}
        >
          {responses.map((resp) => (
            <div key={resp.key} className="w-full min-w-0">
              <ModelCard
                resp={resp}
                isStreaming={isStreaming}
                onSelectArtifact={onSelectArtifact}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type MessagesProps = {
  turns: DBMessage[];
  isLoading: boolean;
  artifacts?: DBArtifact[];
  models?: Array<{ id: string; name: string; modelId: string }>;
  status?: "ready" | "submitted" | "streaming" | "error";
  onSelectArtifact?: (id: string) => void;
};

export function Messages({ turns, isLoading, artifacts, models = [], status, onSelectArtifact }: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const items = flattenTurns(turns, artifacts ?? [], models);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [items.length, scrollToBottom]);

  // Auto-scroll during streaming content updates
  useEffect(() => {
    if (isAtBottomRef.current && (status === "streaming" || status === "submitted")) {
      scrollToBottom("auto");
    }
  }, [items, status, scrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const lastItem = items[items.length - 1];

  return (
    <div className="relative flex-1 bg-background">
      {items.length === 0 && !isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Greeting />
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 touch-pan-y overflow-y-auto overflow-x-hidden",
          items.length > 0 ? "bg-background" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-4xl flex-col gap-6 px-4 py-8 md:px-6">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              // Tabbed multi-model response
              if (item.isMultiModel && item.groupedResponses) {
                return (
                  <MultiModelGrid
                    key={item.key}
                    responses={item.groupedResponses}
                    isStreaming={status === "streaming"}
                    onSelectArtifact={onSelectArtifact}
                  />
                );
              }

              return (
                <MessageBubble
                  artifacts={item.artifacts}
                  isLoading={status === "streaming"}
                  key={item.key}
                  item={item}
                  onSelectArtifact={onSelectArtifact}
                  isMultiModel={item.isMultiModel}
                  responseIndex={item.responseIndex}
                  totalResponses={item.totalResponses}
                  usage={item.usage}
                />
              );
            })}
          </AnimatePresence>

          {status === "submitted" && lastItem?.role !== "assistant" && (
            <ThinkingMessage />
          )}

          <div className="min-h-[24px] min-w-[24px] shrink-0" ref={endRef} />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        onClick={() => scrollToBottom("smooth")}
        className={cn(
          "absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/50 bg-card/90 px-3 py-1.5 text-[10px] text-muted-foreground shadow-md backdrop-blur-lg transition-all duration-200",
          isAtBottomRef.current
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        )}
        type="button"
      >
        <ArrowDownIcon className="size-3" />
      </button>
    </div>
  );
}
