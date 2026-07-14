---
title: Sessions API
description: List and revoke active admin sessions
sidebar_position: 6
---

# Sessions API

## GET /api/sessions

List all active sessions, sorted by `lastActiveAt` descending.

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "name": "Chrome on macOS",
      "browser": "Chrome",
      "os": "macOS",
      "ipAddress": "203.0.113.1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastActiveAt": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

**Source:** `app/api/sessions/route.ts:5-17`

## DELETE /api/sessions?id=

Revoke a session. Removes it from both MongoDB and the in-memory hot cache.

**Query params:** `id` — the session UUID (also the bearer token)

**Response:** `{ "success": true }`

If you revoke your own current session, the client will be signed out on the next API call (401 response).

**Source:** `app/api/sessions/route.ts:19-42`
