---
title: Files API
description: Image upload endpoint
sidebar_position: 10
---

# Files API

## POST /api/files/upload

Upload an image file (JPEG, PNG, GIF, or WebP). Max 5MB.

**Request:** `multipart/form-data` with a `file` field.

**Response (200):**
```json
{
  "url": "/uploads/1234567890-image.png",
  "pathname": "image.png",
  "contentType": "image/png"
}
```

Files are saved to `public/uploads/` with a timestamp prefix to avoid collisions.

**Validation:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp` (`app/api/files/upload/route.ts:18`)
- Max file size: 5MB (`app/api/files/upload/route.ts:23`)

**Source:** `app/api/files/upload/route.ts:5-47`
