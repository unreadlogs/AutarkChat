---
title: Messages API
description: Retrieve messages and artifacts for a chat
sidebar_position: 5
---

# Messages API

## GET /api/messages?chatId=

Get all messages and artifacts for a specific chat.

**Query params:** `chatId` — the chat UUID

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "role": "user",
      "content": "Hello",
      "responses": [
        {
          "id": "uuid",
          "provider": "openai",
          "model": "gpt-4o-mini",
          "content": "Hi! How can I help?",
          "parts": [
            { "type": "text", "content": "Hi! How can I help?" }
          ],
          "status": "completed",
          "usage": { "promptTokens": 10, "completionTokens": 5, "totalTokens": 15 }
        }
      ],
      "attachments": [],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "artifacts": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "messageId": "uuid",
      "title": "code.py",
      "filePath": "/home/user/cloudbotics/some/code.py",
      "url": "/artifacts/uuid.py",
      "mimeType": "text/x-python",
      "size": 1234
    }
  ]
}
```

Messages are returned sorted by `createdAt` ascending.

This endpoint also handles legacy chats where messages were embedded inside the chat document (pre-migration) — it extracts them from `chat.messages` if the standalone `messages` collection is empty (`app/api/messages/route.ts:22-33`).

**Source:** `app/api/messages/route.ts:5-41`
