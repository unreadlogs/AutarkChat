"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3Icon, CoinsIcon, HashIcon, LayersIcon } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

type UsageSummary = {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
};

type DailyUsageItem = {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type RecentUsageItem = {
  id: string;
  chatId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
};

export default function UsageSettingsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageItem[]>([]);
  const [recentUsage, setRecentUsage] = useState<RecentUsageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsageData = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_secret");
      if (!token) return;
      const res = await fetch("/api/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setDailyUsage(data.dailyUsage || []);
        setRecentUsage(data.recentUsage || []);
      } else {
        toast.error(data.error || "Failed to load usage metrics");
      }
    } catch {
      toast.error("Failed to load usage metrics");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchUsageData(); }, [fetchUsageData]);

  const [isExpanded, setIsExpanded] = useState(false);
  const visibleUsage = isExpanded ? recentUsage : recentUsage.slice(0, 5);

  const chartHeight = 140;
  const maxTokens = Math.max(...dailyUsage.map((d) => d.totalTokens), 1);

  const statCards = summary ? [
    { icon: CoinsIcon, label: "Est. Cost", value: `$${summary.totalCost.toFixed(4)}`, sub: "at standard pricing" },
    { icon: HashIcon, label: "Total Tokens", value: summary.totalTokens.toLocaleString(), sub: "input + output" },
    { icon: BarChart3Icon, label: "Prompt", value: summary.totalPromptTokens.toLocaleString(), sub: "tokens submitted" },
    { icon: LayersIcon, label: "Completion", value: summary.totalCompletionTokens.toLocaleString(), sub: "tokens generated" },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Page heading */}
      <div className="border-b border-border/30 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Analytics</p>
        <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">Usage</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-md">
          Token consumption, cost estimates, and completion audit logs.
        </p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-[12px] text-muted-foreground/50 animate-pulse">
          Loading usage data…
        </div>
      ) : (
        <>
          {/* Stat row — no shadows, hairline borders */}
          {summary && (
            <div className="grid grid-cols-2 xl:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/30 border border-border/40 rounded-md overflow-hidden">
              {statCards.map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="px-5 py-5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                    <Icon size={11} strokeWidth={1.5} />
                    {label}
                  </div>
                  <span className="block text-2xl font-semibold -tracking-[0.7px] text-foreground leading-none">
                    {value}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/50">{sub}</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily chart */}
          {dailyUsage.length > 0 && (
            <section className="border border-border/40 rounded-md overflow-hidden">
              <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Chart</p>
                  <h3 className="text-[14px] font-semibold -tracking-[0.3px]">Daily Token Distribution</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                  <span className="flex items-center gap-1.5"><span className="size-2 inline-block bg-foreground/20 rounded-sm" />Prompt</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 inline-block bg-foreground rounded-sm" />Completion</span>
                </div>
              </div>
              <div className="px-5 py-6">
                <div className="relative flex items-end justify-between border-b border-border/30 pb-2" style={{ height: `${chartHeight + 20}px` }}>
                  {dailyUsage.map((day, idx) => {
                    const compH = (day.completionTokens / maxTokens) * chartHeight;
                    const promptH = (day.promptTokens / maxTokens) * chartHeight;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] font-mono font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {day.totalTokens.toLocaleString()}
                        </div>
                        <div className="w-5 sm:w-8 flex flex-col justify-end" style={{ height: `${chartHeight}px` }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: compH }}
                            transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full bg-foreground rounded-t"
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: promptH }}
                            transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full bg-foreground/20 mt-px"
                          />
                        </div>
                        <span className="mt-2 text-[9px] font-mono text-muted-foreground/50">
                          {format(new Date(day.date), "MMM d")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Audit log table */}
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Logs</p>
              <h3 className="text-[14px] font-semibold -tracking-[0.3px]">Token Audit Log</h3>
            </div>
            {recentUsage.length === 0 ? (
              <div className="border border-dashed border-border/50 rounded-md px-5 py-8 text-center">
                <p className="text-[12px] text-muted-foreground/50 italic">No completions recorded yet.</p>
              </div>
            ) : (
              <div className="border border-border/40 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-border/30">
                      <tr>
                        {["Timestamp", "Model", "Prompt", "Completion", "Total"].map((col, i) => (
                          <th key={col} className={`px-4 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 ${i > 1 ? "text-right" : ""}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {visibleUsage.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground/60">
                            {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-semibold text-foreground max-w-[200px] truncate">
                            {item.modelId}
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground/60 text-right">
                            {item.promptTokens.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground/60 text-right">
                            {item.completionTokens.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-bold font-mono text-foreground text-right">
                            {item.totalTokens.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {recentUsage.length > 5 && (
                  <div className="border-t border-border/20 px-4 py-3 flex justify-center bg-card">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {isExpanded ? "Show Less" : `Show More (${recentUsage.length - 5} more)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}
