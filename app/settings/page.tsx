"use client";

import { useEffect, useState, useCallback } from "react";
import { SunIcon, MoonIcon, LaptopIcon, DatabaseIcon, FileTextIcon, MessageSquareIcon, CpuIcon, CheckIcon, KeyboardIcon, MonitorIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SystemMetrics = {
  databaseStatus: string;
  totalChats: number;
  totalMessages: number;
  totalModels: number;
  nodeVersion: string;
  platform: string;
};

// Reusable option row component
function OptionRow({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 border-b border-border/20 last:border-0 text-left transition-colors duration-150",
        active ? "bg-muted/20" : "hover:bg-muted/10"
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <span className={cn("block text-[13px] font-medium leading-none", active ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </span>
        {description && (
          <span className="block text-[11px] text-muted-foreground/60 leading-snug">{description}</span>
        )}
      </div>
      <div className={cn(
        "size-4 rounded-full border-2 shrink-0 ml-4 flex items-center justify-center transition-colors duration-150",
        active ? "border-foreground bg-foreground" : "border-border"
      )}>
        {active && <CheckIcon size={9} className="text-background" strokeWidth={3} />}
      </div>
    </button>
  );
}

// Section wrapper following DESIGN.md editorial cards (hairline border, no shadow)
function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border border-border/40 rounded-md overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">{eyebrow}</p>
        <h3 className="text-[15px] font-semibold -tracking-[0.4px] text-foreground">{title}</h3>
      </div>
      <div className="bg-card">{children}</div>
    </section>
  );
}

export default function GeneralSettingsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState("system");
  const [messageHotkey, setMessageHotkey] = useState("enter");
  const [uiDensity, setUiDensity] = useState("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveTheme(localStorage.getItem("theme") || "system");
    setMessageHotkey(localStorage.getItem("message_hotkey") || "enter");
    setUiDensity(localStorage.getItem("ui_density") || "default");
    const scale = localStorage.getItem("ui_scale");
    if (scale === "large") document.documentElement.style.fontSize = "17px";
  }, []);

  const changeTheme = (mode: string) => {
    setActiveTheme(mode);
    localStorage.setItem("theme", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const changeHotkey = (hotkey: string) => {
    setMessageHotkey(hotkey);
    localStorage.setItem("message_hotkey", hotkey);
  };

  const changeDensity = (density: string) => {
    setUiDensity(density);
    localStorage.setItem("ui_density", density);
    localStorage.setItem("ui_scale", density === "comfortable" ? "large" : "default");
    document.documentElement.style.fontSize = density === "comfortable" ? "17px" : "";
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const secret = localStorage.getItem("admin_secret");
      if (!secret) return;
      const res = await fetch("/api/system/metrics", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (res.ok) setMetrics(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Page heading — editorial eyebrow + title lockup per DESIGN.md */}
      <div className="border-b border-border/30 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Configuration</p>
        <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">General</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-md">
          Appearance, keyboard shortcuts, and interface density for the chat console.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT — Appearance & Behaviour */}
        <div className="space-y-6">

          {/* Theme */}
          <Section eyebrow="Appearance" title="Colour Theme">
            <div className="grid grid-cols-3 divide-x divide-border/30">
              {(["light", "dark", "system"] as const).map((mode) => {
                const Icon = mode === "light" ? SunIcon : mode === "dark" ? MoonIcon : LaptopIcon;
                const labels = { light: "Light", dark: "Dark", system: "System" };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => changeTheme(mode)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-5 text-[11px] font-semibold transition-colors duration-150",
                      activeTheme === mode
                        ? "bg-muted/30 text-foreground"
                        : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                    )}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{labels[mode]}</span>
                    {activeTheme === mode && (
                      <span className="block size-1.5 rounded-full bg-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Send hotkey */}
          <Section eyebrow="Chat Behaviour" title="Send Message Shortcut">
            <OptionRow
              label="Enter"
              description="Press Enter alone to submit a message."
              active={messageHotkey === "enter"}
              onClick={() => changeHotkey("enter")}
            />
            <OptionRow
              label="Cmd / Ctrl + Enter"
              description="Hold Cmd or Ctrl and press Enter to submit."
              active={messageHotkey === "cmd_enter"}
              onClick={() => changeHotkey("cmd_enter")}
            />
          </Section>

          {/* Interface density */}
          <Section eyebrow="Interface" title="Text Density">
            <OptionRow
              label="Compact"
              description="Smaller base font — fits more content on screen."
              active={uiDensity === "default"}
              onClick={() => changeDensity("default")}
            />
            <OptionRow
              label="Comfortable"
              description="Slightly larger base font — easier on the eyes."
              active={uiDensity === "comfortable"}
              onClick={() => changeDensity("comfortable")}
            />
          </Section>

        </div>

        {/* RIGHT — System info */}
        <div className="space-y-6">

          {/* DB status */}
          <Section eyebrow="Infrastructure" title="Database Connection">
            {loading ? (
              <div className="px-5 py-6 text-[12px] text-muted-foreground/50 animate-pulse">Checking connection…</div>
            ) : metrics ? (
              <>
                <div className="px-5 py-4 flex items-center justify-between border-b border-border/20">
                  <span className="text-[12px] text-muted-foreground font-medium">MongoDB</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                    metrics.databaseStatus === "Connected" ? "text-foreground" : "text-destructive"
                  )}>
                    <span className={cn("size-1.5 rounded-full", metrics.databaseStatus === "Connected" ? "bg-foreground animate-pulse" : "bg-destructive")} />
                    {metrics.databaseStatus}
                  </span>
                </div>
                <div className="divide-y divide-border/20">
                  {[
                    ["Platform", metrics.platform],
                    ["Runtime", `Node ${metrics.nodeVersion}`],
                    ["Status", "Online"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-[11px] text-muted-foreground/70">{k}</span>
                      <span className="text-[11px] text-foreground font-medium capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-5 py-4 text-[12px] text-destructive">Failed to query database.</div>
            )}
          </Section>

          {/* Counts */}
          <Section eyebrow="Data Audit" title="Document Counts">
            {loading ? (
              <div className="px-5 py-6 text-[12px] text-muted-foreground/50 animate-pulse">Counting documents…</div>
            ) : metrics ? (
              <div className="grid grid-cols-3 divide-x divide-border/30">
                {[
                  { icon: MessageSquareIcon, value: metrics.totalChats, label: "Chats" },
                  { icon: FileTextIcon, value: metrics.totalMessages, label: "Messages" },
                  { icon: CpuIcon, value: metrics.totalModels, label: "Models" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex flex-col items-center justify-center gap-1 py-6">
                    <Icon size={14} className="text-muted-foreground/60" strokeWidth={1.5} />
                    <span className="text-xl font-semibold -tracking-[0.5px]">{value}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">{label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-[12px] text-destructive">Failed to fetch counts.</div>
            )}
          </Section>

          {/* Environment note */}
          <section className="border border-border/40 rounded-md px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Note</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Theme, hotkey, and density preferences are stored in your browser's local storage
              and apply only to this device. They are not synced across sessions.
            </p>
          </section>

        </div>
      </div>
    </motion.div>
  );
}
