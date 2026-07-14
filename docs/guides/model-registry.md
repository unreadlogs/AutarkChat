---
title: Model Registry
description: Adding custom LLM providers and models
sidebar_position: 3
---

# Model Registry

AutarkChat supports any OpenAI-compatible API endpoint. You can add models via the Settings UI or directly through the API.

## Built-in Provider Presets

The settings UI includes 23 provider presets (`app/settings/models/page.tsx:24-48`):

OpenAI · OpenRouter · Groq · Together AI · Fireworks AI · DeepSeek · DeepInfra · Cerebras · Mistral AI · Nebius AI Studio · xAI (Grok) · Perplexity · Baseten · Hugging Face Router · NVIDIA NIM · DashScope (Intl) · DashScope (China) · SiliconFlow · Moonshot AI (Kimi) · Z.AI (GLM) · Requesty · GitHub Models · Custom

## Adding a Model Via UI

1. Go to **Settings → Models**
2. Select a provider preset (auto-fills the base URL)
3. Enter your API key
4. The model list auto-fetches from the provider — select one, or enter the model ID manually
5. Give it a display name and click **Save Model**

## Adding a Model Via API

```bash
curl -X POST http://localhost:3000/api/models \
  -H "Authorization: Bearer <admin_secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DeepSeek Coder",
    "provider": "deepseek",
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": "sk-...",
    "modelId": "deepseek-chat"
  }'
```

See [Models API](../api/models.md) for the full reference.

## Model Resolution

When a chat request comes in (`lib/chat/route.ts:382-395`):

1. The client sends `selectedChatModel` (single) or `selectedChatModels` (compare mode)
2. The server matches these UUIDs against custom models from MongoDB
3. Falls back to the first configured model if nothing is selected
4. For existing chats with locked compare models, the chat document's `compareModels` array overrides the request
5. Each model's `modelId` field (not the UUID) is sent to the OpenAI API as the model name

## Default Model IDs

The codebase defines four built-in model references (`lib/ai/models.ts:10-35`):

| ID | Name | Provider |
|---|---|---|
| `gpt-4o-mini` | GPT-4o Mini | openai |
| `gpt-4o` | GPT-4o | openai |
| `gpt-4.1-mini` | GPT-4.1 Mini | openai |
| `gpt-4.1-nano` | GPT-4.1 Nano | openai |

These are fallback references only — actual model configs must be added via the model registry.
