"use client";

import { memo, useCallback, useState } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatItem } from "./messages";
import type { FileArtifact, MessageResponseUsage, ResponsePart } from "@/lib/types";
import { sanitizeText, cn } from "@/lib/utils";
import { SparklesIcon, CopyIcon, CheckIcon, ModelIcon } from "./icons";
import { TerminalIcon, WrenchIcon, FileCodeIcon, ChevronDownIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";

type MessageBubbleProps = {
  item: ChatItem;
  isLoading?: boolean;
  artifacts?: FileArtifact[];
  onSelectArtifact?: (id: string) => void;
  isMultiModel?: boolean;
  responseIndex?: number;
  totalResponses?: number;
  usage?: MessageResponseUsage | null;
};

export function ActionBlock({ action }: { action: Extract<ResponsePart, { type: "action" }> }) {
  const [isOpen, setIsOpen] = useState(false);

  const getActionIcon = () => {
    if (action.name === "execute_command") return <TerminalIcon size={14} className="text-muted-foreground/80" />;
    if (action.name === "skill_view") return <WrenchIcon size={14} className="text-muted-foreground/80" />;
    if (action.name === "artifact") return <FileCodeIcon size={14} className="text-muted-foreground/80" />;
    return <FileCodeIcon size={14} className="text-muted-foreground/80" />;
  };

  const getActionLabel = () => {
    if (action.name === "execute_command") {
      return (
        <span className="font-mono text-[12px] text-foreground font-semibold truncate block">
          $ {action.arguments?.command || "execute command"}
        </span>
      );
    }
    if (action.name === "skill_view") {
      return (
        <span className="text-[12px] text-foreground font-semibold">
          Read Skill: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{action.arguments?.name}</span>
        </span>
      );
    }
    if (action.name === "artifact") {
      const files = action.arguments?.filePaths || [];
      return (
        <span className="text-[12px] text-foreground font-semibold">
          Expose Artifact{files.length > 1 ? 's' : ''}: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{files.length} file{files.length > 1 ? 's' : ''}</span>
        </span>
      );
    }
    return (
      <span className="text-[12px] text-foreground font-semibold">
        Call Tool: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{action.name}</span>
      </span>
    );
  };

  const hasOutput = action.output !== undefined && action.output !== null;
  const isError = hasOutput && (action.output.error || (action.output.stderr && action.output.stderr.trim().length > 0));
  const isExecuting = !hasOutput;

  return (
    <div className="border border-border/30 rounded-md overflow-hidden my-3 bg-muted/5 max-w-full">
      {/* Header bar */}
      <div
        onClick={() => hasOutput && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2.5 select-none",
          hasOutput ? "cursor-pointer hover:bg-muted/10" : "cursor-default"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="shrink-0">
            {isExecuting ? (
              <Loader2Icon size={14} className="animate-spin text-muted-foreground" />
            ) : isError ? (
              <AlertCircleIcon size={14} className="text-destructive" />
            ) : (
              getActionIcon()
            )}
          </div>
          <div className="min-w-0 flex-1 truncate">{getActionLabel()}</div>
        </div>

        {/* Status indicator and toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            isExecuting
              ? "border-border text-muted-foreground bg-muted/10"
              : isError
                ? "border-destructive/30 text-destructive bg-destructive/5"
                : "border-border/30 text-foreground bg-muted/15"
          )}>
            {isExecuting ? "Executing" : isError ? "Failed" : "Done"}
          </span>
          {hasOutput && (
            <ChevronDownIcon
              size={14}
              className={cn("text-muted-foreground/60 transition-transform duration-150", isOpen && "rotate-180")}
            />
          )}
        </div>
      </div>

      {/* Expanded Console Window */}
      <AnimatePresence>
        {isOpen && hasOutput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="border-t border-border/20"
          >
            <div className="p-3 bg-zinc-950 dark:bg-black text-[11px] font-mono text-zinc-100 overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap select-text">
              {action.name === "execute_command" ? (
                <>
                  {action.output.stdout && (
                    <div className="text-zinc-100">{action.output.stdout}</div>
                  )}
                  {action.output.stderr && (
                    <div className="text-red-400 mt-1 font-semibold">{action.output.stderr}</div>
                  )}
                  {action.output.error && (
                    <div className="text-red-400 font-bold border-l-2 border-red-500 pl-2 py-0.5 my-1">
                      {action.output.error}
                    </div>
                  )}
                  {!action.output.stdout && !action.output.stderr && !action.output.error && (
                    <div className="text-zinc-500 italic">Command finished with no output.</div>
                  )}
                </>
              ) : action.name === "skill_view" ? (
                <>
                  {action.output.error ? (
                    <div className="text-red-400">{action.output.error}</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-850 pb-1">
                        Loaded Skill: {action.output.name}
                      </div>
                      <div className="space-y-2">
                        {action.output.files?.map((file: any) => (
                          <div key={file.name} className="border border-zinc-800 rounded bg-zinc-900/50 overflow-hidden">
                            <div className="px-3 py-1 bg-zinc-900 text-zinc-300 font-bold text-[10px] border-b border-zinc-800">
                              {file.name}
                            </div>
                            <pre className="p-3 text-[10px] text-zinc-400 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                              {file.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : action.name === "artifact" ? (
                <>
                  {action.output?.artifacts?.map((art: any, i: number) => (
                    <div key={art.id || `art-${i}`} className="flex items-center gap-2 text-zinc-300 border-b border-zinc-800 pb-2 mb-2 last:border-0 last:mb-0">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{art.mimeType || 'file'}</span>
                      <span className="font-semibold">{art.title || art.filePath}</span>
                      {art.error && <span className="text-red-400 ml-auto">{art.error}</span>}
                      {art.url && <span className="text-zinc-500 ml-auto text-[10px]">Exposed</span>}
                    </div>
                  ))}
                  {(!action.output?.artifacts || action.output.artifacts.length === 0) && (
                    <div className="text-zinc-500 italic">No artifacts exposed.</div>
                  )}
                </>
              ) : (
                <div className="text-zinc-300">{JSON.stringify(action.output, null, 2)}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PureMessageBubble({ item, isLoading, artifacts, onSelectArtifact, isMultiModel, responseIndex, totalResponses, usage }: MessageBubbleProps) {
  const isUser = item.role === "user";
  const textContent = item.content;

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);

  const hasContent = textContent.trim().length > 0 || (item.parts && item.parts.length > 0);
  const isThinking = !isUser && isLoading && !hasContent;
  const showStreamingDot = !isUser && isLoading;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group flex w-full justify-end"
        data-role="user"
      >
        <div className="flex max-w-[min(80%,56ch)] flex-col items-end gap-1">
          <div className="rounded-2xl rounded-br-lg bg-foreground px-4 py-2.5 text-[15px] leading-[1.5] text-background">
            {textContent}
          </div>
        </div>
      </motion.div>
    );
  }

  if (isMultiModel) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
        data-role="assistant"
      >
        <div className="w-full overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-colors">
          {/* Model label header */}
          <div className="flex items-center gap-2.5 border-b border-border/30 bg-card/80 px-4 py-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50">
              <ModelIcon name={item.model ?? item.modelLabel ?? ""} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] font-semibold text-foreground truncate">
                {item.modelLabel || item.model || "Model"}
              </span>
              {showStreamingDot && (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/60 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
                </span>
              )}
            </div>
            {/* Token usage badge */}
            {usage && usage.totalTokens > 0 && !isThinking && (
              <span className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/50 tabular-nums">
                <span>{usage.totalTokens.toLocaleString()} tok</span>
                <span className="text-muted-foreground/30">/</span>
                <span>{usage.promptTokens.toLocaleString()} in</span>
                <span className="text-muted-foreground/30">+</span>
                <span>{usage.completionTokens.toLocaleString()} out</span>
              </span>
            )}
          </div>

          {/* Response content */}
          <div className="px-4 py-3">
            {isThinking ? (
              <div className="flex min-h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65] text-muted-foreground shimmer">
                Thinking...
              </div>
            ) : (
              <>
                {(() => {
                  const parts = item.parts || (textContent ? [{ type: "text" as const, content: textContent }] : []);
                  return parts.map((part, idx) => {
                    if (part.type === "text") {
                      return (
                        <div key={idx} className="sd-content my-2.5 first:mt-0 last:mb-0">
                          <Streamdown
                            animated
                            isAnimating={isLoading}
                            plugins={{ code, mermaid, math, cjk }}
                            shikiTheme={["github-light", "github-dark"]}
                            controls={{ code: { copy: true, download: false } }}
                          >
                            {sanitizeText(part.content)}
                          </Streamdown>
                        </div>
                      );
                    } else if (part.type === "action") {
                      return <ActionBlock key={part.id || idx} action={part as any} />;
                    }
                    return null;
                  });
                })()}

                {artifacts && artifacts.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-3">
                    {artifacts.map((artifact) => {
                      const mt = artifact.mimeType || '';
                      const label =
                        mt.startsWith('image/') ? "Image:" :
                        mt === 'application/pdf' ? "PDF:" :
                        mt.startsWith('text/') ? "File:" : "File:";
                      return (
                        <button
                          key={artifact.id}
                          onClick={() => onSelectArtifact?.(artifact.id)}
                          className="flex items-center gap-2 rounded-lg border border-hairline-soft bg-hairline/50 px-3 py-2 text-[13px] text-graphite hover:bg-hairline hover:text-ink transition-colors cursor-pointer text-left w-full"
                          type="button"
                        >
                          <span className="font-medium text-ink">{label}</span>
                          <span className="underline truncate">{artifact.title || `ID: ${artifact.id}`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {hasContent && (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group flex w-full justify-start"
      data-role="assistant"
    >
      <div className="flex max-w-[min(80%,72ch)] flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50 overflow-hidden">
            {item.model || item.modelLabel ? (
              <ModelIcon name={item.model ?? item.modelLabel ?? ""} size={15} />
            ) : (
              <SparklesIcon size={13} />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {item.modelLabel && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/55">
                  {item.modelLabel}
                </span>
                {usage && usage.totalTokens > 0 && !isThinking && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/45 tabular-nums">
                    <span>·</span>
                    <span>{usage.totalTokens.toLocaleString()} tok</span>
                    <span className="text-muted-foreground/30">/</span>
                    <span>{usage.promptTokens.toLocaleString()} in</span>
                    <span className="text-muted-foreground/30">+</span>
                    <span>{usage.completionTokens.toLocaleString()} out</span>
                  </span>
                )}
              </div>
            )}
            {isThinking ? (
              <div className="flex min-h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65] text-muted-foreground shimmer">
                Thinking...
              </div>
            ) : (
              <>
                {(() => {
                  const parts = item.parts || (textContent ? [{ type: "text" as const, content: textContent }] : []);
                  return parts.map((part, idx) => {
                    if (part.type === "text") {
                      return (
                        <div key={idx} className="sd-content my-2.5 first:mt-0 last:mb-0">
                          <Streamdown
                            animated
                            isAnimating={isLoading}
                            plugins={{ code, mermaid, math, cjk }}
                            shikiTheme={["github-light", "github-dark"]}
                            controls={{ code: { copy: true, download: false } }}
                          >
                            {sanitizeText(part.content)}
                          </Streamdown>
                        </div>
                      );
                    } else if (part.type === "action") {
                      return <ActionBlock key={part.id || idx} action={part as any} />;
                    }
                    return null;
                  });
                })()}

                {artifacts && artifacts.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {artifacts.map((artifact) => {
                      const mt = artifact.mimeType || '';
                      const label =
                        mt.startsWith('image/') ? "Image:" :
                        mt === 'application/pdf' ? "PDF:" :
                        mt.startsWith('text/') ? "File:" : "File:";
                      return (
                        <button
                          key={artifact.id}
                          onClick={() => onSelectArtifact?.(artifact.id)}
                          className="flex items-center gap-2 rounded-lg border border-hairline-soft bg-hairline/50 px-3 py-2 text-[13px] text-graphite hover:bg-hairline hover:text-ink transition-colors cursor-pointer text-left w-full"
                          type="button"
                        >
                          <span className="font-medium text-ink">{label}</span>
                          <span className="underline truncate">{artifact.title || `ID: ${artifact.id}`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {hasContent && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(PureMessageBubble);

export function ThinkingMessage() {
  return (
    <div className="group w-full" data-role="assistant">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50">
          <SparklesIcon size={13} />
        </div>
        <div className="flex min-h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65] text-muted-foreground shimmer">
          Thinking...
        </div>
      </div>
    </div>
  );
}
