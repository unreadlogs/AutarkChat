---
title: API Reference
description: All REST API endpoints, authentication, and SSE streaming protocol
sidebar_position: 3
---

# API Reference

All API routes live under `/app/api/` following Next.js App Router conventions. Every route file exports named HTTP method functions (`GET`, `POST`, `DELETE`, `PATCH`).

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except `GET /api/skills` require a bearer token:

```
Authorization: Bearer <admin_secret>
```

The token is a UUID stored in `localStorage` as `admin_secret` after successful login. See [Authentication](../architecture/auth-flow.md) for the full flow.

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Validate password, create session |
| GET | `/api/auth/session` | Check auth status |
| GET | `/api/auth/verify` | Verify bearer token validity |
| POST | `/api/auth/logout` | Legacy cookie clear (no-op) |
| POST | `/api/auth/register` | Legacy registration (dead route) |
| POST | `/api/chat` | SSE streaming chat (main endpoint) |
| DELETE | `/api/chat?id=` | Delete a chat |
| PATCH | `/api/chat?id=` | Toggle chat pin |
| GET | `/api/messages?chatId=` | Get messages + artifacts for a chat |
| GET | `/api/history` | Paginated chat list |
| DELETE | `/api/history` | Delete all chats |
| GET | `/api/models` | List custom models |
| POST | `/api/models` | Add a custom model |
| DELETE | `/api/models?id=` | Remove a custom model |
| GET | `/api/sessions` | List active sessions |
| DELETE | `/api/sessions?id=` | Revoke a session |
| GET | `/api/usage` | Token usage summary + daily breakdown |
| GET | `/api/system/metrics` | DB status, counts, node info |
| POST | `/api/files/upload` | Upload image (max 5MB) |
| GET | `/api/skills` | List installed skills (no auth required) |
| POST | `/api/skills` | Install/update a skill |
| PATCH | `/api/skills` | Toggle skill enabled state |
| DELETE | `/api/skills?id=` | Uninstall a skill |
| POST | `/api/compare` | SSE streaming comparison |
| GET | `/api/settings/personalization` | Get personalization config |
| POST | `/api/settings/personalization` | Save personalization config |

## Pages

- [Authentication](./authentication.md) — Login, session, verify, logout routes
- [Chat](./chat.md) — SSE streaming, delete, pin
- [Models](./models.md) — Custom model CRUD
- [History](./history.md) — Chat history listing and bulk delete
- [Messages](./messages.md) — Message retrieval with artifacts
- [Sessions](./sessions.md) — Active session management
- [Usage](./usage.md) — Token usage analytics
- [Skills](./skills.md) — Skills registry CRUD
- [System](./system.md) — System health metrics
- [Files](./files.md) — File upload endpoint
