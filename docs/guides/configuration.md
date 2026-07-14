---
title: Configuration
description: All environment variables, settings options, and localStorage keys
sidebar_position: 1
---

# Configuration

## Environment Variables

| Variable | Required | Default | Description | Source |
|---|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB connection string | `.env` |
| `ADMIN_PASSWORD` | No | `"admin"` | Admin login password | `app/api/auth/login/route.ts:29` |

The database name is hardcoded as `autarkchat` in `lib/mongodb.ts:14`.

## Frontend Settings (localStorage)

All user preferences are stored in the browser's `localStorage`. None are synced across devices.

| Key | Values | Default | Description | Set In |
|---|---|---|---|---|
| `admin_secret` | UUID string | — | Bearer token for API auth | `components/login/page.tsx:32` |
| `sidebar_expanded` | `"true"` / `"false"` | `"true"` | Sidebar expanded state | `components/chat/shell.tsx:50` |
| `theme` | `"light"` / `"dark"` / `"system"` | `"system"` | Color theme | `app/settings/page.tsx:78` |
| `message_hotkey` | `"enter"` / `"cmd_enter"` | `"enter"` | Send message shortcut | `app/settings/page.tsx:79` |
| `ui_density` | `"default"` / `"comfortable"` | `"default"` | Text density/zoom | `app/settings/page.tsx:80` |
| `ui_scale` | `"default"` / `"large"` | `"default"` | Font size scale | `app/settings/page.tsx:81` |
| `preferred_name` | string | — | Cached preferred name from personalization | `components/chat/greeting.tsx:55` |
| `compare_selected_models` | string[] JSON | `[]` | Persisted compare model selections | `components/compare/CompareLayout.tsx:13` |
| `compare_favorite_models` | string[] JSON | `[]` | Favorite model IDs for compare picker | `components/compare/CompareLayout.tsx:14` |
| `compare_recent_models` | string[] JSON | `[]` | Recently used model IDs for compare | `components/compare/CompareLayout.tsx:15` |
| `github_stars` | number string | — | Cached GitHub star count (30 min TTL) | `components/chat/sidebar.tsx:126` |

## Personalization (Server-side)

Stored in MongoDB `personalization` collection as a single document with `id: "global"`.

| Field | Max Length | Description |
|---|---|---|
| `preferredName` | 100 | How the assistant addresses the user |
| `occupation` | 150 | User's work role or focus |
| `aboutMe` | 1000 | Free-form context (interests, stack, etc.) |
| `customInstructions` | 5000 | Global system prompt additions |

These are injected into every chat's system prompt dynamically. See `lib/chat/route.ts:478-496`.

## UI Density

The density setting controls the base font size. In "comfortable" mode, `document.documentElement.style.fontSize` is set to `17px` (`app/settings/page.tsx:82`). This is a simple CSS zoom applied to the root element.
