"use client";

import { useCallback, useRef, useState } from "react";
import type {
  CompareModelConfig,
  CompareCardData,
  CompareCardStatus,
  CompareStreamEvent,
} from "@/lib/compare/compare-types";

export type CompareStreamState = {
  cards: CompareCardData[];
  isGenerating: boolean;
};

function createCard(model: CompareModelConfig): CompareCardData {
  return {
    model,
    status: "idle",
    content: "",
    startTime: null,
    finishTime: null,
    errorMessage: null,
    tokenCount: 0,
  };
}

export function useCompareStream() {
  const [state, setState] = useState<CompareStreamState>({
    cards: [],
    isGenerating: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  // Refs for card content accumulation (avoid stale closures)
  const cardAccumRef = useRef<Map<string, string>>(new Map());
  const cardStartRef = useRef<Map<string, number>>(new Map());
  const cardTokenRef = useRef<Map<string, number>>(new Map());

  const setCardById = useCallback(
    (modelId: string, updater: (card: CompareCardData) => CompareCardData) => {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.model.id === modelId ? updater(c) : c
        ),
      }));
    },
    []
  );

  const startCompare = useCallback(
    async (prompt: string, models: CompareModelConfig[]) => {
      const secret =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_secret")
          : null;
      if (!secret) return;

      // Reset accumulators
      cardAccumRef.current = new Map();
      cardStartRef.current = new Map();
      cardTokenRef.current = new Map();

      // Build initial cards
      const initialCards = models.map(createCard);
      setState({ cards: initialCards, isGenerating: true });

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({ prompt, modelIds: models.map((m) => m.id) }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // Mark all cards as error
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            cards: prev.cards.map((c) => ({
              ...c,
              status: "error" as CompareCardStatus,
              errorMessage:
                errData.error || `HTTP ${res.status}: Request failed`,
            })),
          }));
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (!raw.trim()) continue;

            try {
              const event: CompareStreamEvent = JSON.parse(raw);
              const { modelId, type, content } = event;

              switch (type) {
                case "start": {
                  cardStartRef.current.set(modelId, Date.now());
                  setCardById(modelId, (c) => ({
                    ...c,
                    status: "streaming",
                    startTime: Date.now(),
                    content: "",
                    errorMessage: null,
                  }));
                  break;
                }
                case "delta": {
                  const prev = cardAccumRef.current.get(modelId) || "";
                  const next = prev + (content || "");
                  cardAccumRef.current.set(modelId, next);
                  const tokens = cardTokenRef.current.get(modelId) || 0;
                  cardTokenRef.current.set(modelId, tokens + 1);
                  setCardById(modelId, (c) => ({
                    ...c,
                    status: "streaming",
                    content: next,
                    tokenCount: tokens + 1,
                  }));
                  break;
                }
                case "reasoning": {
                  // Reasoning/thinking traces — update content if received
                  if (content) {
                    cardAccumRef.current.set(
                      modelId,
                      (cardAccumRef.current.get(modelId) || "") + content
                    );
                  }
                  break;
                }
                case "finish": {
                  const finalContent =
                    content || cardAccumRef.current.get(modelId) || "";
                  const finalTokens =
                    event.metadata?.tokenCount ||
                    cardTokenRef.current.get(modelId) ||
                    finalContent.split(/\s+/).filter(Boolean).length;
                  setCardById(modelId, (c) => ({
                    ...c,
                    status: "done",
                    content: finalContent,
                    finishTime: Date.now(),
                    tokenCount: finalTokens as number,
                  }));
                  break;
                }
                case "error": {
                  setCardById(modelId, (c) => ({
                    ...c,
                    status: "error",
                    errorMessage: content || "Unknown error",
                    finishTime: Date.now(),
                  }));
                  break;
                }
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // User cancelled - mark unfinished cards
          setState((prev) => ({
            ...prev,
            cards: prev.cards.map((c) =>
              c.status === "streaming" || c.status === "loading"
                ? { ...c, status: "done" as CompareCardStatus, finishTime: Date.now() }
                : c
            ),
          }));
        }
      } finally {
        setState((prev) => ({ ...prev, isGenerating: false }));
        abortRef.current = null;
      }
    },
    [setCardById]
  );

  const retryModel = useCallback(
    async (modelId: string, prompt: string, allModels: CompareModelConfig[]) => {
      const model = allModels.find((m) => m.id === modelId);
      if (!model || !prompt.trim()) return;

      // Reset just this card
      setCardById(modelId, (c) => ({
        ...c,
        status: "loading",
        content: "",
        errorMessage: null,
        startTime: Date.now(),
        finishTime: null,
        tokenCount: 0,
      }));

      const secret =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_secret")
          : null;
      if (!secret) return;

      cardAccumRef.current.set(modelId, "");
      cardTokenRef.current.set(modelId, 0);

      // Single-model retry — backend now accepts 1 model for retry scenarios
      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            prompt,
            modelIds: [modelId],
          }),
        });

        if (!res.ok) throw new Error("Retry failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (!raw.trim()) continue;

            try {
              const event: CompareStreamEvent = JSON.parse(raw);
              if (event.modelId !== modelId) continue;

              if (event.type === "delta" && event.content) {
                fullContent += event.content;
                const tokens = (cardTokenRef.current.get(modelId) || 0) + 1;
                cardTokenRef.current.set(modelId, tokens);
                setCardById(modelId, (c) => ({
                  ...c,
                  status: "streaming",
                  content: fullContent,
                  tokenCount: tokens,
                }));
              } else if (event.type === "finish") {
                setCardById(modelId, (c) => ({
                  ...c,
                  status: "done",
                  content: fullContent,
                  finishTime: Date.now(),
                }));
              } else if (event.type === "error") {
                setCardById(modelId, (c) => ({
                  ...c,
                  status: "error",
                  errorMessage: event.content || "Unknown error",
                  finishTime: Date.now(),
                }));
              }
            } catch {
              // skip
            }
          }
        }
      } catch {
        setCardById(modelId, (c) => ({
          ...c,
          status: "error",
          errorMessage: "Retry failed",
          finishTime: Date.now(),
        }));
      }
    },
    [setCardById]
  );

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      cards: prev.cards.map((c) =>
        c.status === "streaming" || c.status === "loading"
          ? { ...c, status: "done" as CompareCardStatus, finishTime: Date.now() }
          : c
      ),
    }));
  }, []);

  const clearCards = useCallback(() => {
    setState({ cards: [], isGenerating: false });
  }, []);

  return {
    ...state,
    startCompare,
    retryModel,
    cancelGeneration,
    clearCards,
  };
}
