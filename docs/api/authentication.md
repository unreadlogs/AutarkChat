---
title: Authentication API
description: Login, session verification, and logout endpoints
sidebar_position: 1
---

# Authentication API

## POST /api/auth/login

Validate the admin password and create a session.

**Request Body:**
```json
{ "password": "your_admin_password" }
```

**Response (200):**
```json
{
  "success": true,
  "secret": "uuid-session-token"
}
```

The `secret` should be stored in `localStorage` as `admin_secret` and sent as `Authorization: Bearer <secret>` on all subsequent requests.

The admin password is read from `ADMIN_PASSWORD` env var, falling back to `"admin"` (`app/api/auth/login/route.ts:29`).

**Response (401):**
```json
{ "error": "Invalid password" }
```

**Source:** `app/api/auth/login/route.ts:26-65`

## GET /api/auth/session

Check if the current bearer token is authorized.

**Headers:** `Authorization: Bearer <admin_secret>`

**Response (200):** `{ "authorized": true }`

**Response (401):** `{ "authorized": false }`

**Source:** `app/api/auth/session/route.ts:4-10`

## GET /api/auth/verify

Same as session check — used by frontend auth guards.

**Headers:** `Authorization: Bearer <admin_secret>`

**Response (200):** `{ "success": true }`

**Response (401):** `{ "error": "Unauthorized" }`

**Source:** `app/api/auth/verify/route.ts:4-9`

## POST /api/auth/logout

Legacy endpoint that clears a session cookie. This is **not used** by the bearer-token auth system — clients should simply remove `admin_secret` from `localStorage`.

**Source:** `app/api/auth/logout/route.ts:4-8`

## POST /api/auth/register

Legacy user registration endpoint. Still functional but the frontend register page (`/register`) redirects to `/login`. The admin system does not use this.

**Source:** `app/api/auth/register/route.ts:6-45`
