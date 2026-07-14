---
title: Key Types
description: Important TypeScript types and interfaces used across the codebase
sidebar_position: 2
---

# Key Types

All types are defined in `lib/types.ts` unless noted otherwise.

## DB Types

### DBChat
```typescript
type DBChat = {
  id: string;
  userId: string;
  title: string;
  visibility: "public" | "private";
  pinned?: boolean;
  compareModels?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
};
```

### DBMessage
```typescript
type DBMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  responses: MessageResponse[];
  attachments: AttachmentRef[];
  createdAt: Date;
  updatedAt: Date;
};
```

Messages are stored in the standalone `messages` MongoDB collection. Responses are embedded arrays (not separate documents).

### MessageResponse
```typescript
type MessageResponse = {
  id: string;
  provider?: string | null;
  model: string;
  content: string;
  parts?: ResponsePart[];
  status?: string | null;
  error?: string | null;
  usage?: MessageResponseUsage | null;
};
```

### ResponsePart
```typescript
type ResponsePart =
  | { type: "text"; content: string }
  | { type: "action"; id: string; name: string; arguments: any; output?: any };
```

`text` parts are rendered as Markdown via Streamdown. `action` parts represent tool calls (`execute_command`, `skill_view`, `artifact`) and are rendered as collapsible console blocks in `ActionBlock` (`components/chat/message.tsx:27-190`).

### DBModel
```typescript
type DBModel = {
  id: string;        // UUID (unique identifier)
  name: string;       // Display name (e.g. "My GPT-4o")
  provider: string;   // e.g. "openai"
  baseUrl: string | null;
  apiKey: string;
  modelId: string;    // Actual model string sent to API (e.g. "gpt-4o-mini")
  createdAt: Date;
};
```

### FileArtifact / DBArtifact
```typescript
type FileArtifact = {
  id: string;
  chatId: string;
  messageId: string;
  title: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
};

type DBArtifact = FileArtifact & { _id?: ObjectId; createdAt: Date; };
```

### MessageResponseUsage
```typescript
type MessageResponseUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};
```

## Compare Types (`lib/compare/compare-types.ts`)

```typescript
type CompareStreamEvent = {
  modelId: string;
  type: "start" | "delta" | "reasoning" | "tool" | "finish" | "error" | "metadata";
  content?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

type CompareCardData = {
  model: CompareModelConfig;
  status: "idle" | "loading" | "streaming" | "done" | "error";
  content: string;
  startTime: number | null;
  finishTime: number | null;
  errorMessage: string | null;
  tokenCount: number;
};
```

## Skill Types (`lib/skills.ts`)

```typescript
type Skill = {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  files: SkillFile[];
};

type SkillFile = {
  name: string;    // Relative path (e.g. "scripts/solver.py")
  content: string;  // File contents as UTF-8 string
};
```

## Personalization (`lib/queries.ts:413-418`)

```typescript
type PersonalizationConfig = {
  preferredName: string;
  occupation: string;
  aboutMe: string;
  customInstructions: string;
};
```

## ChatItem (Client-side, `components/chat/messages.tsx:17-32`)

```typescript
type ChatItem = {
  key: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AttachmentRef[];
  artifacts?: FileArtifact[];
  model?: string;
  modelLabel?: string;
  isMultiModel?: boolean;
  responseIndex?: number;
  totalResponses?: number;
  usage?: MessageResponseUsage | null;
  parts?: ResponsePart[];
  groupedResponses?: ChatItem[];
};
```

## StreamManager (`lib/stream-manager.ts`)

```typescript
type StreamManagerCallbacks = {
  onTextDelta: (delta: string) => void;
  onToolCall: (toolCall: { id: string; name: string; arguments: string }) => void;
  onWaitingStatus: (phase: string, message: string) => void;
};
```

The `StreamManager` class buffers text and tool call chunks during SSE reading, then `finalize()` returns the complete accumulation.
