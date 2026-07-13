"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "./header";
import { Messages } from "./messages";
import { ChatInput } from "./input";
import { ChatSidebar } from "./sidebar";
import { ArtifactPanel } from "./artifact-viewer";
import type { DBMessage, DBArtifact, AttachmentRef, MessageResponse } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { toast } from "sonner";

type ClientAttachment = {
  id: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
};

type ChatShellProps = {
  chatId?: string;
  initialTurns?: DBMessage[];
  initialArtifacts?: DBArtifact[];
  initialTitle?: string;
  initialSelectedModels?: string[];
  compareLocked?: boolean;
};

export function ChatShell({ chatId: initialChatId, initialTurns, initialArtifacts, initialTitle, initialSelectedModels, compareLocked }: ChatShellProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const [turns, setTurns] = useState<DBMessage[]>(initialTurns ?? []);
  const [artifacts, setArtifacts] = useState<DBArtifact[]>(initialArtifacts ?? []);
  const [activeArtifact, setActiveArtifact] = useState<DBArtifact | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const turnsRef = useRef<DBMessage[]>(turns);

  // Unified Sidebar state (always visible, width changes)
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar_expanded");
      if (stored !== null) {
        setSidebarExpanded(stored === "true");
      }
    }
  }, []);

  const [chatTitle, setChatTitle] = useState(initialTitle ?? "");
  const chatIdRef = useRef(initialChatId ?? generateUUID());

  // Model selection state (supports single + compare mode)
  const [customModels, setCustomModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialSelectedModels ?? []);

  // Attachments state
  const [attachments, setAttachments] = useState<ClientAttachment[]>([]);

  // Auth Guard & initialization
  useEffect(() => {
    const adminSecret = localStorage.getItem("admin_secret");
    if (!adminSecret) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${adminSecret}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("admin_secret");
          router.push("/login");
        } else if (res.ok) {
          setSecret(adminSecret);
          setIsAuthorized(true);
        }
      })
      .catch(() => {
        setSecret(adminSecret);
        setIsAuthorized(true);
      });
  }, [router]);

  // Load custom models
  const fetchCustomModels = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/models", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.models) {
        setCustomModels(data.models);
        setSelectedModels((prev) => {
          if (prev.length > 0) return prev;
          if (initialSelectedModels && initialSelectedModels.length > 0) {
            return initialSelectedModels.filter((id) => data.models.some((m: any) => m.id === id));
          }
          return [data.models[0].id];
        });
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    if (isAuthorized && secret) {
      fetchCustomModels(secret);
    }
  }, [isAuthorized, secret, fetchCustomModels]);

  useEffect(() => {
    if (initialTurns) setTurns(initialTurns);
    if (initialArtifacts) setArtifacts(initialArtifacts);
    if (initialTitle) setChatTitle(initialTitle);
  }, [initialTurns, initialArtifacts, initialTitle]);

  const chatTitleRef = useRef(chatTitle);
  useEffect(() => {
    chatTitleRef.current = chatTitle;
  }, [chatTitle]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !secret) return;

    if (selectedModels.length === 0) {
      toast.error("Please add a model in Settings before chatting.");
      router.push("/settings");
      return;
    }

    const messageId = generateUUID();
    const userTurn: DBMessage = {
      id: messageId,
      chatId: chatIdRef.current,
      role: "user",
      content: input,
      responses: [],
      attachments: attachments.map<AttachmentRef>((att) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        contentType: att.contentType,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const originalInput = input;
    const originalAttachments = attachments;

    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    setAttachments([]); // Clear preview attachment queue
    setIsLoading(true);
    setStatus("submitted");

    // Navigate to chat URL if on home
    if (!window.location.pathname.includes("/chat/")) {
      window.history.pushState({}, "", `/chat/${chatIdRef.current}`);
    }

    const responseTexts = new Map<string, string>();

    const applyMeta = (slots: Array<{ id: string; model: string; provider?: string | null }>) => {
      responseTexts.clear();
      setTurns((prev) =>
        prev.map((t) =>
          t.id === messageId
            ? {
                ...t,
                responses: slots.map<MessageResponse>((s) => ({
                  id: s.id,
                  provider: s.provider ?? null,
                  model: s.model,
                  content: "",
                  status: "streaming",
                  usage: null,
                })),
              }
            : t
        )
      );
    };

    const applyText = (responseId: string, delta: string) => {
      const next = (responseTexts.get(responseId) ?? "") + delta;
      responseTexts.set(responseId, next);
      setTurns((prev) =>
        prev.map((t) => {
          if (t.id !== messageId) return t;
          const responses = t.responses.length
            ? t.responses.map((r) => (r.id === responseId ? { ...r, content: next } : r))
            : [
                {
                  id: responseId,
                  provider: null,
                  model: "",
                  content: next,
                  status: "streaming",
                  usage: null,
                } as MessageResponse,
              ];
          return { ...t, responses };
        })
      );
    };

    // Cancel any previous active request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          id: chatIdRef.current,
          message: {
            id: messageId,
            role: "user",
            content: originalInput,
            attachments: originalAttachments.map((att) => ({
              id: att.id,
              name: att.name,
              url: att.url,
              contentType: att.contentType,
              size: att.size,
            })),
          },
          selectedChatModels: selectedModels,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();

      setStatus("streaming");

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Announce response slots (one per selected model)
              if (parsed.type === "response-meta" && parsed.responses) {
                applyMeta(parsed.responses);
              }

              // Handle text deltas (tagged by responseId)
              if (parsed.type === "text" && parsed.text) {
                const responseId = parsed.responseId ?? turnsRef.current.find((t) => t.id === messageId)?.responses[0]?.id;
                if (responseId) applyText(responseId, parsed.text);
              }

              // Handle tool results (artifact creation/update)
              if (parsed.type === "tool-result" && parsed.output) {
                const output = parsed.output;
                if (output && output.id) {
                  const updatedArtifact: DBArtifact = {
                    id: output.id,
                    chatId: chatIdRef.current,
                    messageId: messageId,
                    title: output.title || "Untitled",
                    type: output.type || "text",
                    content: output.content || "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  setArtifacts((prev) => {
                    const idx = prev.findIndex((a) => a.id === updatedArtifact.id);
                    if (idx > -1) {
                      const copy = [...prev];
                      copy[idx] = updatedArtifact;
                      return copy;
                    }
                    return [...prev, updatedArtifact];
                  });
                  setActiveArtifact(updatedArtifact);
                }
              }

              // Handle chat title
              if (parsed.type === "chat-title" && parsed.data) {
                setChatTitle(parsed.data);
              }

              // Handle usage data (token counts per model response)
              if (parsed.type === "usage" && parsed.responseId && parsed.usage) {
                setTurns((prev) =>
                  prev.map((t) => {
                    if (t.id !== messageId) return t;
                    return {
                      ...t,
                      responses: t.responses.map((r) =>
                        r.id === parsed.responseId ? { ...r, usage: parsed.usage } : r
                      ),
                    };
                  })
                );
              }
            } catch {}
          }
        }
      }

      // Reload artifacts after response
      try {
        const chatRes = await fetch(`/api/messages?chatId=${chatIdRef.current}`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const chatData = await chatRes.json();
        if (chatData.artifacts) {
          setArtifacts(chatData.artifacts);
        }
      } catch {}
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        toast.info("Generation stopped.");
      } else {
        console.error("Chat error:", error);
        toast.error("Failed to send message. Please try again.");
        setInput(originalInput);
        setAttachments(originalAttachments);
        setTurns((prev) => prev.filter((t) => t.id !== messageId));
      }
    } finally {
      setIsLoading(false);
      setStatus("ready");
      abortControllerRef.current = null;
    }
  }, [input, isLoading, secret, selectedModels, customModels, attachments, router, status]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStatus("ready");
  }, []);

  const handleSelectArtifact = useCallback((id: string) => {
    const art = artifacts.find((a) => a.id === id);
    if (art) setActiveArtifact(art);
  }, [artifacts]);

  if (!isAuthorized) {
    return null;
  }

  const allModels = customModels;
  const activeModelConfig = allModels.find((m) => m.id === selectedModels[0]);

  return (
    <div className="flex h-dvh w-full flex-row overflow-hidden">
      <ChatSidebar
        isExpanded={sidebarExpanded}
        onToggleExpand={() => {
          const next = !sidebarExpanded;
          setSidebarExpanded(next);
          localStorage.setItem("sidebar_expanded", String(next));
        }}
        currentChatId={chatIdRef.current}
        currentChatTitle={chatTitle}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ChatHeader title={chatTitle} />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <Messages
            artifacts={artifacts}
            isLoading={isLoading}
            turns={turns}
            status={status}
            models={allModels}
            onSelectArtifact={handleSelectArtifact}
          />

          <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 bg-background px-4 pb-4 flex-col">
            <ChatInput
              disabled={false}
              input={input}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onStop={handleStop}
              setInput={setInput}
              attachments={attachments}
              setAttachments={setAttachments}
              selectedModels={selectedModels}
              onModelsChange={setSelectedModels}
              models={allModels}
              compareLocked={compareLocked}
            />
          </div>
        </div>
      </div>

      <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
    </div>
  );
}
// Force Next.js dev server rebuild
