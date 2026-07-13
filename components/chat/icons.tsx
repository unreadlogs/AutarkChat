"use client";

import { getCompanySvg } from "@/lib/utils";
import {
  ArrowUpIcon,
  PaperclipIcon,
  LoaderIcon,
  SparklesIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
  XIcon,
  MessageSquareIcon,
  BrainCircuitIcon,
  FileTextIcon,
  CodeIcon,
  TableIcon,
} from "lucide-react";

export {
  ArrowUpIcon,
  PaperclipIcon,
  LoaderIcon,
  SparklesIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
  XIcon,
  MessageSquareIcon,
  BrainCircuitIcon,
  FileTextIcon,
  CodeIcon,
  TableIcon,
};

export function StopIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      height={size}
      viewBox="0 0 16 16"
      width={size}
      fill="currentColor"
      style={{ width: size, height: size }}
    >
      <rect x="3" y="3" width="10" height="10" rx="2" />
    </svg>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ModelIcon({ name, size = 12 }: { name: string; size?: number }) {
  const svg = getCompanySvg(name);

  // No dedicated icon available (or missing asset) — render a neutral monogram.
  if (svg === "fallback.svg" || !name) {
    const letter = (name || "?").trim().charAt(0).toUpperCase();
    return (
      <span
        className="flex size-3 items-center justify-center rounded-full bg-muted text-[7px] font-semibold text-muted-foreground"
        style={{ width: size, height: size }}
        title={name}
      >
        {letter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/models/${svg}`}
      alt={name}
      title={name}
      width={size}
      height={size}
      className="size-3 rounded-full bg-background object-contain"
      style={{ width: size, height: size }}
    />
  );
}
