"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FileArtifact } from "@/lib/types";
import { XIcon, FileTextIcon, FileCodeIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { getArtifactLabel } from "@/lib/artifacts/registry";

type ArtifactPanelProps = {
  artifact: FileArtifact | null;
  onClose: () => void;
};

function getArtifactIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FileTextIcon size={14} className="text-muted-foreground" />;
  if (mimeType.startsWith('image/')) return <FileTextIcon size={14} className="text-muted-foreground" />;
  if (mimeType.startsWith('text/')) return <FileCodeIcon size={14} className="text-muted-foreground" />;
  return <FileTextIcon size={14} className="text-muted-foreground" />;
}

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
            <div className="flex items-center gap-2 min-w-0">
              {getArtifactIcon(artifact.mimeType)}
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {artifact.title}
              </span>
              <span className="text-[11px] text-muted-foreground capitalize shrink-0">
                {getArtifactLabel(artifact.mimeType)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={artifact.url}
                download={artifact.title}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <DownloadIcon size={14} />
              </a>
              <button
                onClick={onClose}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                type="button"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <ArtifactContent artifact={artifact} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ArtifactContent({ artifact }: { artifact: FileArtifact }) {
  const { mimeType, url, title } = artifact;

  if (mimeType === 'application/pdf') {
    return (
      <iframe
        src={url}
        className="w-full h-full rounded-lg border border-border/30"
        title={title}
      />
    );
  }

  if (mimeType.startsWith('image/')) {
    return (
      <div className="flex items-center justify-center">
        <img
          src={url}
          alt={title}
          className="max-w-full max-h-[80vh] rounded-lg object-contain"
        />
      </div>
    );
  }

  if (mimeType.startsWith('text/')) {
    return <TextFileView url={url} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
      <FileTextIcon size={48} className="opacity-40" />
      <p className="text-sm">{title}</p>
      <p className="text-xs opacity-60">{getArtifactLabel(mimeType)}</p>
      <a
        href={url}
        download={title}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-border/40 px-4 py-2 text-sm hover:bg-muted transition-colors"
      >
        <DownloadIcon size={14} />
        Download File
        <ExternalLinkIcon size={12} className="opacity-60" />
      </a>
    </div>
  );
}

function TextFileView({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      className="w-full h-full rounded-lg border border-border/30"
      title="Text content"
    />
  );
}
