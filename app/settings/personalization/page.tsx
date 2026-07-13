"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { UserIcon, SparklesIcon, CheckIcon, SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Field({ id, label, children, description }: { id: string; label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">
        {label}
      </label>
      {children}
      {description && (
        <span className="block text-[10px] text-muted-foreground/50 leading-relaxed">{description}</span>
      )}
    </div>
  );
}

export default function PersonalizationPage() {
  const [preferredName, setPreferredName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPersonalization = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_secret");
      if (!token) return;

      const res = await fetch("/api/settings/personalization", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setPreferredName(data.config.preferredName || "");
          setOccupation(data.config.occupation || "");
          setAboutMe(data.config.aboutMe || "");
          setCustomInstructions(data.config.customInstructions || "");
        }
      } else {
        toast.error("Failed to load personalization settings");
      }
    } catch {
      toast.error("Failed to load personalization settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalization();
  }, [fetchPersonalization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("admin_secret");
      if (!token) return;

      const res = await fetch("/api/settings/personalization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferredName,
          occupation,
          aboutMe,
          customInstructions,
        }),
      });

      if (res.ok) {
        toast.success("Personalization saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 border-b border-border/50 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 py-2 outline-none transition-colors focus:border-foreground";
  const textareaCls = "w-full min-h-[100px] border border-border/40 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 p-3 outline-none transition-colors focus:border-foreground resize-y";

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-[12px] text-muted-foreground/50 animate-pulse">
        Loading personalization settings…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-2xl"
    >
      {/* Heading */}
      <div className="border-b border-border/30 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Context</p>
        <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">Personalization</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
          Provide profile context and custom system instructions. These are appended to the system prompt dynamically to personalize model replies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card Section */}
        <section className="border border-border/40 rounded-md overflow-hidden bg-card">
          <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
            <UserIcon size={14} className="text-muted-foreground" />
            <h3 className="text-[14px] font-semibold -tracking-[0.3px]">User Profile Context</h3>
          </div>
          <div className="p-5 space-y-5">
            <Field id="preferredName" label="Preferred Name" description="How the assistant should address you in conversations.">
              <input
                id="preferredName"
                type="text"
                placeholder="e.g. Alex"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field id="occupation" label="Occupation / Role" description="Your current work role, studies, or primary focus.">
              <input
                id="occupation"
                type="text"
                placeholder="e.g. Software Engineer, Student"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field id="aboutMe" label="More About You" description="General context, interests, hobbies, or coding stack that helps tailor responses.">
              <textarea
                id="aboutMe"
                placeholder="e.g. I work mostly with React, TypeScript, and Python. I like writing clean, well-tested code."
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                className={textareaCls}
              />
            </Field>
          </div>
        </section>

        {/* Custom Instructions Section */}
        <section className="border border-border/40 rounded-md overflow-hidden bg-card">
          <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
            <SparklesIcon size={14} className="text-muted-foreground" />
            <h3 className="text-[14px] font-semibold -tracking-[0.3px]">Custom System Instructions</h3>
          </div>
          <div className="p-5">
            <Field id="customInstructions" label="Instructions Guidelines" description="Guidelines, rules, tone preferences, or constraints models must follow.">
              <textarea
                id="customInstructions"
                placeholder="e.g. Always respond in bullet points. Use emojis sparingly. When writing code, provide explanations only if requested."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className={cn(textareaCls, "min-h-[160px]")}
              />
            </Field>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-11 rounded-full bg-foreground text-background text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {saving ? "Saving Settings…" : (
            <>
              <SaveIcon size={14} />
              Save Personalization
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
