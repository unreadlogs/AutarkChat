"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlobeIcon, MonitorIcon, RefreshCwIcon, LogOutIcon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SessionItem = {
  id: string;
  name: string;
  browser: string;
  os: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
};

export default function SessionsSettingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
      } else {
        toast.error(data.error || "Failed to load sessions");
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_secret");
    if (token) {
      setCurrentSessionId(token);
      fetchSessions(token);
    }
  }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    const token = localStorage.getItem("admin_secret");
    if (!token) return;
    const isCurrent = id === currentSessionId;
    if (!confirm(isCurrent
      ? "Terminate your current session? You will be signed out immediately."
      : "Terminate this session? That device will be signed out immediately."
    )) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/sessions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Session terminated.");
        if (isCurrent) {
          localStorage.removeItem("admin_secret");
          router.push("/login");
          return;
        }
        fetchSessions(token);
      } else {
        toast.error(data.error || "Failed to terminate session");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    const token = localStorage.getItem("admin_secret");
    if (!token || !currentSessionId) return;
    if (!confirm("Terminate all other sessions? All other devices will be signed out.")) return;
    setLoading(true);
    try {
      const others = sessions.filter((s) => s.id !== currentSessionId);
      let count = 0;
      for (const s of others) {
        const res = await fetch(`/api/sessions?id=${s.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) count++;
      }
      toast.success(`Terminated ${count} session${count !== 1 ? "s" : ""}.`);
      fetchSessions(token);
    } catch {
      toast.error("Failed to terminate sessions.");
    } finally {
      setLoading(false);
    }
  };

  const otherCount = sessions.filter((s) => s.id !== currentSessionId).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Page heading */}
      <div className="border-b border-border/30 pb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Security</p>
          <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">Sessions</h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-md">
            All active admin login sessions. Terminate any device you don't recognise.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => currentSessionId && fetchSessions(currentSessionId)}
            disabled={loading}
            className="p-2 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCwIcon size={13} className={loading ? "animate-spin" : ""} />
          </button>
          {otherCount > 0 && (
            <button
              type="button"
              onClick={handleRevokeOthers}
              disabled={loading}
              className="px-3 h-8 rounded-md border border-border/40 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors disabled:opacity-40"
            >
              Revoke all others ({otherCount})
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="border border-border/40 rounded-md overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="px-5 py-8 text-[12px] text-muted-foreground/50 animate-pulse">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-8 text-[12px] text-muted-foreground/60 italic">No active sessions found.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {sessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              const isLoading = actionLoadingId === session.id;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-start justify-between gap-4 px-5 py-5 transition-colors duration-150",
                    isCurrent ? "bg-muted/10" : "hover:bg-muted/5"
                  )}
                >
                  {/* Icon + info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-2 rounded-md border border-border/30 text-muted-foreground/60 shrink-0 mt-0.5">
                      <MonitorIcon size={15} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground -tracking-[0.2px] truncate">
                          {session.name || session.browser}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] border border-border/50 text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                            This device
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                          <GlobeIcon size={10} />
                          {session.ipAddress}
                        </span>
                        <span>·</span>
                        <span>Signed in {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span>·</span>
                        <span>Active {new Date(session.lastActiveAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.id)}
                    disabled={isLoading}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-md border text-[11px] font-semibold transition-colors duration-150 disabled:opacity-40",
                      isCurrent
                        ? "border-border/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        : "border-border/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                    title={isCurrent ? "Sign out this device" : "Terminate session"}
                  >
                    {isLoading ? (
                      <RefreshCwIcon size={11} className="animate-spin" />
                    ) : isCurrent ? (
                      <LogOutIcon size={11} />
                    ) : (
                      <XIcon size={11} />
                    )}
                    <span>{isCurrent ? "Sign out" : "Kill"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
