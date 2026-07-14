---
title: Chat API
description: SSE streaming chat endpoint — the core of AutarkChat
sidebar_position: 2
---

# Chat API

## POST /api/chat

The main chat endpoint. Returns a Server-Sent Events (SSE) stream with token-by-token text deltas, tool calls, and usage data. Supports both single-model and multi-model (compare) modes.

**Headers:** `Authorization: Bearer <admin_secret>`

**Request Body:**

```json
{
  "id": "uuid-chat-id",
  "message": {
    "id": "uuid-message-id",
    "role": "user",
    "content": "Your prompt here",
    "attachments": [
      { "id": "uuid", "name": "image.png", "url": "/uploads/...", "contentType": "image/png", "size": 12345 }
    ]
  },
  "selectedChatModel": "model-uuid",
  "selectedChatModels": ["model-uuid-1", "model-uuid-2"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID string | Yes | Chat ID (new or existing) |
| `message.id` | UUID string | If new chat | Message ID |
| `message.role` | `"user"` | If new chat | Must be `"user"` |
| `message.content` | string (1-4000 chars) | If new chat | The user's prompt |
| `message.attachments` | array | No | Attached files |
| `selectedChatModel` | string | No* | Single model UUID |
| `selectedChatModels` | string[] | No* | Multi-model UUIDs for compare |

_*At least one of `selectedChatModel` or `selectedChatModels` must be provided. If omitted, the first configured model is used._

**Source:** `app/api/chat/route.ts:360-621`

### SSE Event Reference

See [Data Flow](../architecture/data-flow.md#sse-event-types) for the full event reference.

### Tool Execution

The AI has access to three tools during chat:

**`artifact`** — Expose generated files as viewable artifacts in the side panel.
```json
{ "filePaths": ["relative/path/to/file.pdf"] }
```

**`skill_view`** — Read the full manual of a specialized skill/procedure.
```json
{ "name": "math_solver" }
```

**`execute_command`** — Execute a bash shell command on the server.
```json
{ "command": "python3 skills/pdf/scripts/extract_form_structure.py input.pdf" }
```

All commands run in `/home/user/cloudbotics` with a 30-second timeout (`app/api/chat/route.ts:275-279`).

### Tool Loop

The AI runs up to 5 steps per response (text generation → tool call → tool result → next step). Only one tool call per step. After all steps complete, the response is persisted to MongoDB.

### Rate Limits / Duration

- `maxDuration` is set to **60 seconds** (`app/api/chat/route.ts:78`)
- Messages are capped at **4000 characters** (`app/api/chat/route.ts:59`)

## DELETE /api/chat?id=

Delete a chat and all its messages, artifacts, and attachments.

**Query params:** `id` — the chat UUID

**Response:** `{ "success": true }`

**Source:** `app/api/chat/route.ts:623-635`

## PATCH /api/chat?id=

Toggle a chat's pinned status.

**Query params:** `id` — the chat UUID

**Request Body:** `{ "pinned": true }`

**Response:** `{ "success": true }`

**Source:** `app/api/chat/route.ts:637-658`
