---
title: Skills API
description: Install, list, toggle, and uninstall skills
sidebar_position: 8
---

# Skills API

## GET /api/skills

List all installed skills. **This endpoint does NOT require authentication.**

**Response:**
```json
{
  "skills": [
    {
      "id": "pdf-form-filler",
      "name": "PDF Form Filler",
      "description": "Extracts form fields from fillable PDFs and fills them automatically",
      "isEnabled": true,
      "files": [
        { "name": "SKILL.md", "content": "# PDF Form Filler..." },
        { "name": "scripts/extract.py", "content": "..." }
      ]
    }
  ]
}
```

Skills are loaded from the `skills/` directory at runtime. Each subdirectory is a skill, with metadata in `skill.json` (optional) and file contents loaded recursively. See [Skills System](../reference/folder-structure.md#skills).

**Source:** `app/api/skills/route.ts:5-12`

## POST /api/skills

Install or update a skill. Creates/overwrites a skill directory under `skills/`.

**Request Body:**
```json
{
  "id": "math_solver",
  "name": "Math Proof Solver",
  "description": "Generates step-by-step mathematical proofs",
  "files": [
    { "name": "SKILL.md", "content": "# Manual..." },
    { "name": "scripts/solver.py", "content": "..." }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Lowercase alphanumeric ID (spaces → underscores) |
| `name` | string | Yes | Display name |
| `description` | string | No | Shown to AI to trigger this skill |
| `files` | array | No* | Array of `{ name, content }` objects |
| `manual` | string | No* | If provided instead of `files`, creates a single `SKILL.md` |

_*Either `files` or `manual` must be provided._

**Source:** `app/api/skills/route.ts:14-40`

## PATCH /api/skills

Toggle a skill's enabled state.

**Request Body:**
```json
{ "id": "math_solver", "isEnabled": false }
```

**Response:** `{ "success": true, "skill": { ... } }`

**Source:** `app/api/skills/route.ts:42-60`

## DELETE /api/skills?id=

Uninstall a skill — removes the entire skill directory from disk.

**Query params:** `id` — the skill directory name

**Response:** `{ "success": true }`

**Source:** `app/api/skills/route.ts:62-81`
