---
title: Chat History API
description: Paginated chat list and bulk delete
sidebar_position: 4
---

# History API

## GET /api/history

Get a paginated list of chats for the admin user.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max results per page (capped at 100) |
| `starting_after` | string | null | Chat ID to paginate forward from |
| `ending_before` | string | null | Chat ID to paginate backward from |

**Response:**
```json
{
  "chats": [
    {
      "id": "uuid",
      "title": "My Chat",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "pinned": false,
      "lastMessageAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "hasMore": false
}
```

Returns `limit + 1` items internally to determine `hasMore`, then trims to `limit`.

**Source:** `app/api/history/route.ts:5-23`

## DELETE /api/history

Delete **all** chats for the admin user. Also removes associated messages, artifacts, and attachments.

**Response:** `{ "deletedCount": number }`

**Source:** `app/api/history/route.ts:25-32`
