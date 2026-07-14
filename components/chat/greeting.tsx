"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  CheckSquare,
  Cpu,
  Code,
  Database,
  Mail,
  PenTool,
  MessageSquare,
  FileText,
  FileSearch,
  GraduationCap,
  Compass,
  BookOpen
} from "lucide-react";

const ALL_PROMPTS = [
  { text: "Write a to-do list for a personal project or task", icon: CheckSquare },
  { text: "Generate an email to reply to a job offer", icon: Mail },
  { text: "Summarise this article or text for me in one paragraph", icon: FileSearch },
  { text: "How does AI work in a technical capacity", icon: Cpu },
  { text: "Refactor this function to improve performance", icon: Code },
  { text: "Design a database schema for an e-commerce website", icon: Database },
  { text: "Draft a blog post outline about microservices", icon: PenTool },
  { text: "Write a polite message to request a meeting", icon: MessageSquare },
  { text: "Help me polish this cover letter text", icon: FileText },
  { text: "Explain quantum computing in simple terms", icon: GraduationCap },
  { text: "What are the core concepts of React Server Components", icon: Compass },
  { text: "Create a study guide for a technical interview", icon: BookOpen }
];

const SUBTITLES = [
  "What would you like to know?",
  "How can I help you build today?",
  "What are we creating today?",
  "Ready to write some code?",
  "Let's explore some ideas together.",
  "What technical challenge shall we tackle?",
  "How can I assist you with your project?"
];

const getRandomPrompts = (count = 4) => {
  const shuffled = [...ALL_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function Greeting({ onSelectPrompt }: { onSelectPrompt?: (prompt: string) => void }) {
  // Use localStorage cache for instant initial render, avoiding name loading delay/flash
  const [userName, setUserName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("preferred_name");
    }
    return null;
  });

  const [subtitle, setSubtitle] = useState("What would you like to know?");
  const [prompts, setPrompts] = useState<typeof ALL_PROMPTS>([]);

  useEffect(() => {
    // Pick a random subtitle/heading on load
    const randomSub = SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];
    setSubtitle(randomSub);

    // Fetch fresh preferred name from personalization API and update cache
    fetch("/api/settings/personalization")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.config && data.config.preferredName) {
          setUserName(data.config.preferredName);
          localStorage.setItem("preferred_name", data.config.preferredName);
        } else {
          setUserName(null);
          localStorage.removeItem("preferred_name");
        }
      })
      .catch(() => {});

    // Load initial 4 random prompts
    setPrompts(getRandomPrompts());
  }, []);

  const handleRefresh = () => {
    setPrompts(getRandomPrompts());
  };

  return (
    <div className="flex flex-col items-stretch w-full max-w-4xl px-4 py-8 select-text">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-left font-bold text-3xl md:text-4xl tracking-tight text-foreground"
      >
        {userName ? (
          <>
            Hi there,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-extrabold">
              {userName}
            </span>
          </>
        ) : (
          "Hi there"
        )}
      </motion.h1>

      {/* Subtitle */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="text-left font-bold text-2xl md:text-3xl tracking-tight text-purple-600/90 dark:text-purple-400 mt-1"
      >
        {subtitle}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="text-left text-muted-foreground/80 text-sm mt-3"
      >
        Use one of the most common prompts below or use your own to begin
      </motion.p>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 w-full">
        {prompts.map((p, idx) => {
          const IconComponent = p.icon;
          return (
            <motion.button
              key={p.text}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.32 + idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelectPrompt?.(p.text)}
              className="flex flex-col justify-between items-start text-left border border-border/30 rounded-xl bg-card/25 p-4 hover:bg-muted/10 hover:border-border/60 transition-all duration-200 min-h-[135px] w-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <span className="text-[12.5px] leading-relaxed text-foreground/85 font-medium group-hover:text-foreground transition-colors">
                {p.text}
              </span>
              <div className="mt-4 text-muted-foreground/40 group-hover:text-purple-500/75 dark:group-hover:text-purple-400/80 transition-colors shrink-0">
                <IconComponent size={15} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Refresh Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        onClick={handleRefresh}
        className="mt-4.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer select-none self-start bg-transparent border-0 outline-none"
      >
        <RefreshCw size={12} className="text-muted-foreground/50" />
        Refresh Prompts
      </motion.button>
    </div>
  );
}
