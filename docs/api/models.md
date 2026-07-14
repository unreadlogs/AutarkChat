---
title: Models API
description: CRUD for custom LLM model endpoints
sidebar_position: 3
---

# Models API

## GET /api/models

List all configured custom models.

**Response:**
```json
{
  "models": [
    {
      "id": "uuid",
      "name": "My GPT-4o Mini",
      "provider": "openai",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "sk-...",
      "modelId": "gpt-4o-mini",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

Models are sorted by `createdAt` ascending.

**Source:** `app/api/models/route.ts:14-26`

## POST /api/models

Add a new custom model.

**Request Body:**
```json
{
  "name": "My Model",
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "modelId": "gpt-4o-mini"
}
```

| Field | Type | Required | Default | Max Length |
|---|---|---|---|---|
| `name` | string | Yes | — | 100 |
| `provider` | string | No | `"openai"` | 50 |
| `baseUrl` | string\|null | No | `null` | — |
| `apiKey` | string | No | `""` | — |
| `modelId` | string | Yes | — | — |

Models are validated with Zod schema `addModelSchema` (`app/api/models/route.ts:6-12`).

**Response (200):** `{ "success": true, "model": { ... } }`

**Response (400):** `{ "error": "Invalid model configuration data" }`

**Source:** `app/api/models/route.ts:28-53`

## DELETE /api/models?id=

Remove a custom model by its UUID.

**Query params:** `id` — the model UUID

**Response:** `{ "success": true }`

**Source:** `app/api/models/route.ts:55-72`
