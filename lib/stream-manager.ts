import { generateUUID } from "./utils";

export type StreamManagerCallbacks = {
  onTextDelta: (delta: string) => void;
  onToolCall: (toolCall: { id: string; name: string; arguments: string }) => void;
  onWaitingStatus: (phase: string, message: string) => void;
};

const HEALTH_CHECK_DELAY_MS = 9000;

export class StreamManager {
  private textBuffer = "";
  private toolCalls: Map<string, { id: string; name: string; argsBuffer: string }> = new Map();
  private hasModelActivity = false;
  private healthCheckTimer: ReturnType<typeof setTimeout> | undefined;
  private callbacks: StreamManagerCallbacks;

  constructor(callbacks: StreamManagerCallbacks) {
    this.callbacks = callbacks;
  }

  startHealthCheck() {
    this.healthCheckTimer = setTimeout(() => {
      if (!this.hasModelActivity) {
        this.callbacks.onWaitingStatus("still-waiting", "Still waiting...");
      }
    }, HEALTH_CHECK_DELAY_MS);
  }

  processTextDelta(delta: string) {
    this.markActive();
    this.textBuffer += delta;
    this.callbacks.onTextDelta(delta);
  }

  processToolCallChunk(chunk: {
    id?: string;
    name?: string;
    index?: number;
    arguments?: string;
  }) {
    this.markActive();

    const id = chunk.id ?? "";
    if (!this.toolCalls.has(id)) {
      this.toolCalls.set(id, { id, name: chunk.name ?? "", argsBuffer: "" });
    }
    const tc = this.toolCalls.get(id)!;
    if (chunk.name) tc.name = chunk.name;
    if (chunk.arguments) tc.argsBuffer += chunk.arguments;
  }

  private markActive() {
    if (!this.hasModelActivity) {
      this.hasModelActivity = true;
      this.clearHealthCheck();
      this.callbacks.onWaitingStatus("thinking", "Thinking...");
    }
  }

  finalize(): { fullText: string; toolCalls: Array<{ id: string; name: string; arguments: string }> } {
    this.clearHealthCheck();
    return {
      fullText: this.textBuffer,
      toolCalls: Array.from(this.toolCalls.values()).map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.argsBuffer,
      })),
    };
  }

  abort() {
    this.clearHealthCheck();
  }

  private clearHealthCheck() {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
}
