export type CompareModelConfig = {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  baseUrl: string | null;
  apiKey: string;
};

export type CompareStreamEvent = {
  modelId: string;
  type: "start" | "delta" | "reasoning" | "tool" | "finish" | "error" | "metadata";
  content?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

export type CompareCardStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "done"
  | "error";

export type CompareCardData = {
  model: CompareModelConfig;
  status: CompareCardStatus;
  content: string;
  startTime: number | null;
  finishTime: number | null;
  errorMessage: string | null;
  tokenCount: number;
};

export type CompareState = {
  cards: CompareCardData[];
  prompt: string;
  isGenerating: boolean;
};

export const MAX_COMPARE_MODELS = 6;
