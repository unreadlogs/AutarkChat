---
title: System API
description: Database health, counts, and node information
sidebar_position: 9
---

# System API

## GET /api/system/metrics

Get system health information: database connection status, document counts, and Node.js runtime details.

**Response:**
```json
{
  "databaseStatus": "Connected",
  "totalChats": 42,
  "totalMessages": 512,
  "totalModels": 5,
  "nodeVersion": "v22.0.0",
  "platform": "linux"
}
```

On DB failure, all counts return 0 and `databaseStatus` returns `"Disconnected"`.

**Source:** `app/api/system/metrics/route.ts:6-41`
