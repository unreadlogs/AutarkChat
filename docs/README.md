---
title: AutarkChat Documentation
description: Developer-first AI chat workspace for multi-model interaction, comparison, and evaluation
sidebar_position: 1
---

# AutarkChat

AutarkChat is a developer-first AI chat workspace for interacting with, comparing, and evaluating multiple language models from a single interface. It replaces the original multi-user SaaS model with a single-admin, password-protected console.

**Stack**: Next.js 15 (App Router) · TypeScript · MongoDB (native driver) · Tailwind CSS v4 · Radix UI · Framer Motion · OpenAI SDK (OpenAI-compatible) · SSE streaming · Streamdown

## Quick Start

```bash
git clone https://github.com/unreadlogs/AutarkChat.git
cd autarkchat
npm install
# Edit .env with your MONGODB_URI and ADMIN_PASSWORD
npm run dev
```

See [Getting Started](./getting-started.md) for the full setup guide.

## Key Features

- **Multi-Model Chat** — Send a prompt to multiple models simultaneously, with independent streaming per model
- **Model Comparison** — Dedicated compare workflow at `/compare` — pick models, lock them in, and see side-by-side responses
- **Custom Model Registry** — Add any OpenAI-compatible provider (23 presets built-in) via the settings UI or API
- **Streaming SSE** — Real-time token-by-token streaming with cancellation, input recovery, and per-model response tracking
- **Artifacts** — AI-generated code, text, or PDFs displayed in a side panel via the `artifact` tool
- **Skills System** — Filesystem-based skill registry (`skills/` directory) exposing multi-file scripts and manuals to the AI
- **Token Analytics** — Track prompt/completion tokens per chat, with daily charts and cost estimates
- **Personalization** — Name, occupation, and custom system instructions injected into every session
- **Session Management** — View active admin sessions and revoke devices
- **Monochrome Design System** — Editorial layout with hairline borders, no shadows, full-rounded CTAs, light/dark/system theme

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Next.js 15 App Router (server + client)             │
│                                                       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Chat UI  │  │ Compare UI   │  │ Settings UI    │ │
│  │ (SPA)    │  │ (SPA)        │  │ (multi-tab)    │ │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘ │
│       │               │                  │           │
│  ┌────▼───────────────▼──────────────────▼────────┐ │
│  │  API Routes (13 endpoints)                     │ │
│  │  /api/auth/*  /api/chat  /api/models  ...      │ │
│  └────┬───────────────┬──────────────────┬────────┘ │
│       │               │                  │           │
│  ┌────▼────┐    ┌─────▼──────┐    ┌─────▼──────┐   │
│  │ OpenAI  │    │  MongoDB   │    │ Filesystem  │   │
│  │ SDK     │    │ (native    │    │ (skills/,   │   │
│  │         │    │  driver)   │    │  uploads/)  │   │
│  └─────────┘    └────────────┘    └────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Documentation Sections

| Section | Description |
|---|---|
| [Getting Started](./getting-started.md) | Installation, environment variables, first login |
| [Architecture](./architecture/README.md) | System design, data flow, authentication flow |
| [API](./api/README.md) | All REST endpoints and SSE streaming |
| [Guides: Configuration](./guides/configuration.md) | Environment variables and settings explained |
| [Guides: Personalization](./guides/personalization.md) | User profile and custom instructions |
| [Guides: Model Registry](./guides/model-registry.md) | Adding providers and models |
| [Guides: Deployment](./guides/deployment.md) | Production build and deploy |
| [Guides: Development](./guides/development.md) | Local dev workflow and scripts |
| [Reference: Folder Structure](./reference/folder-structure.md) | Annotated directory tree |
| [Reference: Types](./reference/types.md) | Key TypeScript types |
| [Reference: Troubleshooting](./reference/troubleshooting.md) | Common issues and fixes |

## Needs Review

The following items could not be fully verified from the codebase and should be reviewed by a maintainer:

1. **MongoDB connection string in `.env`** — The file checked into the repo contains a live connection string with credentials. Consider using `.env.example` instead and `.gitignore`-ing the real `.env`.

3. **`/api/skills` GET does not require auth** — Unlike other API routes, `GET /api/skills` (`app/api/skills/route.ts:5`) does not call `verifyAdminAuth()`.
4. **Legacy `/api/auth/register`** — Route still exists but the frontend register page just redirects to `/login`. The route may be dead code.
5. **CHANGELOG** — No CHANGELOG file found in the repository.
6. **`.env` contains real credentials** — The admin password and MongoDB URI in `.env` are live values. Rotate these if this repo is public.
