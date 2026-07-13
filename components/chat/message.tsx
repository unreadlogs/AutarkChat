"use client";

import { memo, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { ChatItem } from "./messages";
import type { DBArtifact, MessageResponseUsage } from "@/lib/types";
import { sanitizeText } from "@/lib/utils";
import { SparklesIcon, CopyIcon, CheckIcon, ModelIcon } from "./icons";

type MessageBubbleProps = {
  item: ChatItem;
  isLoading?: boolean;
  artifacts?: DBArtifact[];
  onSelectArtifact?: (id: string) => void;
  isMultiModel?: boolean;
  responseIndex?: number;
  totalResponses?: number;
  usage?: MessageResponseUsage | null;
};

function PureMessageBubble({ item, isLoading, artifacts, onSelectArtifact, isMultiModel, responseIndex, totalResponses, usage }: MessageBubbleProps) {
  const isUser = item.role === "user";
  const textContent = item.content;

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);

  const hasContent = textContent.trim().length > 0;
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
                {textContent && (
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-[14px] leading-[1.65] break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-[12px] leading-[1.6] text-background">
                            {children}
                          </pre>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isBlock = className?.includes("language-");
                          return isBlock ? (
                            <code className={className} {...props}>{children}</code>
                          ) : (
                            <code className="rounded bg-muted px-1.5 py-0.5 text-[12px]" {...props}>{children}</code>
                          );
                        },
                      }}
                    >
                      {sanitizeText(textContent)}
                    </ReactMarkdown>
                  </div>
                )}

                {artifacts && artifacts.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-3">
                    {artifacts.map((artifact) => {
                      const label =
                        artifact.type === "code"
                          ? "Code created:"
                          : artifact.type === "sheet"
                            ? "Spreadsheet created:"
                            : "Document created:";
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
                {textContent && (
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-[1.6] break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-background text-[13px] leading-[1.6]">
                            {children}
                          </pre>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isBlock = className?.includes("language-");
                          return isBlock ? (
                            <code className={className} {...props}>{children}</code>
                          ) : (
                            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]" {...props}>{children}</code>
                          );
                        },
                      }}
                    >
                      {sanitizeText(textContent)}
                    </ReactMarkdown>
                  </div>
                )}

                {artifacts && artifacts.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {artifacts.map((artifact) => {
                      const label =
                        artifact.type === "code"
                          ? "Code created:"
                          : artifact.type === "sheet"
                            ? "Spreadsheet created:"
                            : "Document created:";
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
