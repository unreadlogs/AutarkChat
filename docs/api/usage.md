---
title: Usage API
description: Token usage analytics, daily breakdown, and cost estimates
sidebar_position: 7
---

# Usage API

## GET /api/usage

Get token usage summary, daily breakdown (last 7 days), and recent usage log.

**Response:**
```json
{
  "summary": {
    "totalPromptTokens": 15000,
    "totalCompletionTokens": 32000,
    "totalTokens": 47000,
    "totalCost": 0.02175
  },
  "dailyUsage": [
    { "date": "2025-01-01", "promptTokens": 2000, "completionTokens": 5000, "totalTokens": 7000 }
  ],
  "recentUsage": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "modelId": "gpt-4o-mini",
      "promptTokens": 150,
      "completionTokens": 320,
      "totalTokens": 470,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Cost Estimation

Cost is calculated using approximate pricing:
- **Prompt**: $0.15 per 1M tokens
- **Completion**: $0.60 per 1M tokens

(`app/api/usage/route.ts:24-25`)

### Daily Aggregation

The last 7 days are pre-aggregated server-side. Days with no usage return zero-filled entries.

### Recent Log

The `recentUsage` array contains the most recent 50 usage records.

**Source:** `app/api/usage/route.ts:6-73`
