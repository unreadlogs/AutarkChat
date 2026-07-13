"use client";

import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DBArtifact } from "@/lib/types";
import { XIcon, FileTextIcon, CodeIcon, TableIcon } from "./icons";

type ArtifactPanelProps = {
  artifact: DBArtifact | null;
  onClose: () => void;
};

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  return (
    <AnimatePresence>
      {artifact && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "40%", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex h-full flex-col overflow-hidden border-l border-border/40 bg-background"
        >
          {/* Header */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-4">
            <div className="flex items-center gap-2">
              {artifact.type === "code" ? (
                <CodeIcon size={14} className="text-muted-foreground" />
              ) : artifact.type === "sheet" ? (
                <TableIcon size={14} className="text-muted-foreground" />
              ) : (
                <FileTextIcon size={14} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {artifact.title}
              </span>
              <span className="text-[11px] text-muted-foreground capitalize">
                {artifact.type}
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              type="button"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {artifact.type === "code" ? (
              <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-[13px] leading-[1.6] text-background">
                <code>{artifact.content}</code>
              </pre>
            ) : artifact.type === "sheet" ? (
              <SheetView content={artifact.content ?? ""} />
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none text-[14px] leading-[1.6]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {artifact.content ?? ""}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetView({ content }: { content: string }) {
  const rows = content.split("\n").filter((r) => r.trim());
  const data = rows.map((r) => r.split(",").map((c) => c.trim()));

  if (data.length === 0) return null;

  const headers = data[0];
  const body = data.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-border/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
