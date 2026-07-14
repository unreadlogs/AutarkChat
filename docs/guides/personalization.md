---
title: Personalization
description: Setting up user profiles and custom instructions
sidebar_position: 2
---

# Personalization

Personalization lets you inject context about yourself into every AI conversation. It's stored in MongoDB and appended to the system prompt on every chat request.

## Setting Up

1. Navigate to **Settings → Personalization**
2. Fill in the fields:

| Field | Example | Effect |
|---|---|---|
| Preferred Name | "Alex" | AI addresses you by name in responses |
| Occupation | "Software Engineer" | Added to system context |
| About Me | "I work with React and Python" | Free-form background context |
| Custom Instructions | "Always respond in bullet points" | Added as guidelines to every system prompt |

## How It Works

During every chat request (`lib/chat/route.ts:478-496`), the server fetches the personalization config and appends it to the base system prompt:

```typescript
// From lib/chat/route.ts:481-496
if (personalization.preferredName || personalization.occupation || personalization.aboutMe) {
  systemContent += `\n\nUser Profile & Context:`;
  if (personalization.preferredName)
    systemContent += `\n- What you should call the user: "${personalization.preferredName}"`;
  if (personalization.occupation)
    systemContent += `\n- User's occupation: ${personalization.occupation}`;
  if (personalization.aboutMe)
    systemContent += `\n- More about the user: ${personalization.aboutMe}`;
}
if (personalization.customInstructions) {
  systemContent += `\n\nCustom Instructions / Guidelines:\n${personalization.customInstructions}`;
}
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/settings/personalization` | Fetch current config |
| POST | `/api/settings/personalization` | Save config |

**Source:** `app/api/settings/personalization/route.ts:13-51`

## Caching

The preferred name is also cached in `localStorage` as `preferred_name` for instant display on the greeting screen (`components/chat/greeting.tsx:53-58`).
