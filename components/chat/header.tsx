"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type ChatHeaderProps = {
  title?: string;
};

export function ChatHeader({ title }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur px-4 justify-between"
    >
      {/* Left section: chat title */}
      <div className="min-w-0 flex-1">
        {title && (
          <span className="truncate text-sm font-semibold text-foreground/80 block">
            {title}
          </span>
        )}
      </div>

      {/* Right section: plus button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/")}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
          title="New Chat"
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </motion.header>
  );
}
