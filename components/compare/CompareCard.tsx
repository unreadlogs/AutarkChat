"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  StopCircleIcon,
  ClockIcon,
  CpuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompareCardData } from "@/lib/compare/compare-types";

type CompareCardProps = {
  data: CompareCardData;
  isGenerating: boolean;
  onRetry: (modelId: string) => void;
  onStop: () => void;
};

function PureCompareCard({ data, isGenerating, onRetry, onStop }: CompareCardProps) {
  const { model, status, content, startTime, finishTime, errorMessage, tokenCount } = data;
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (status === "streaming" && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, status]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const elapsed =
    startTime
      ? Math.round(((finishTime || Date.now()) - startTime) / 100) / 10
      : null;

  const isStreaming = status === "streaming";
  const isLoading = status === "loading";
  const isDone = status === "done";
  const isError = status === "error";
  const isIdle = status === "idle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border transition-colors",
        isError
          ? "border-destructive/30"
          : isStreaming
            ? "border-foreground/20"
            : "border-border/40"
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card/50 px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CpuIcon size={14} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground truncate -tracking-[0.15px]">
                {model.name}
              </span>
              {isStreaming && (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/60 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
                </span>
              )}
              {isDone && (
                <span className="inline-block size-1.5 rounded-full bg-foreground/30" />
              )}
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50 truncate">
              {model.provider} · {model.modelId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isStreaming && (
            <button
              type="button"
              onClick={onStop}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Stop"
            >
              <StopCircleIcon size={14} />
            </button>
          )}
          {(isDone || isError) && (
            <button
              type="button"
              onClick={() => onRetry(model.id)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Retry"
            >
              <RefreshCwIcon size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div
        ref={contentRef}
        className="overflow-y-auto px-5 py-4 min-h-[120px] max-h-[600px]"
      >
        {(isIdle || isLoading) && (
          <div className="flex h-full min-h-[80px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/25 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-muted-foreground/40 italic">
                {isLoading ? "Generating\u2026" : "Waiting\u2026"}
              </span>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex h-full min-h-[60px] items-center justify-center">
            <p className="text-[12px] text-destructive/80 text-center leading-relaxed">
              {errorMessage || "An error occurred"}
            </p>
          </div>
        )}

        {(isStreaming || isDone) && content && (
          <div className="prose prose-neutral dark:prose-invert max-w-none text-[14px] leading-[1.7] break-words">
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
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code
                      className="rounded bg-muted px-1.5 py-0.5 text-[12px]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {isStreaming && !content && (
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground/40 italic">
            <span className="shimmer inline-block h-4 w-32 rounded" />
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between border-t border-border/20 px-5 py-2.5">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
          {elapsed !== null && (
            <span className="flex items-center gap-1">
              <ClockIcon size={10} />
              {elapsed}s
            </span>
          )}
          {tokenCount > 0 && (
            <span className="font-mono">{tokenCount} tok</span>
          )}
          {isDone && (
            <span className="text-foreground/40">\u2713 Done</span>
          )}
        </div>
        {(isDone || (isStreaming && content.length > 0)) && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            {copied ? (
              <>
                <CheckIcon size={10} /> Copied
              </>
            ) : (
              <>
                <CopyIcon size={10} /> Copy
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export const CompareCard = memo(PureCompareCard);
