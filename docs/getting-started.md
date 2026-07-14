---
title: Getting Started
description: Install, configure, and run AutarkChat for the first time
sidebar_position: 2
---

# Getting Started

## Prerequisites

- **Node.js** 18+ (the project targets ESNext)
- **MongoDB** instance (Atlas, self-hosted, or local)
- **npm** (or pnpm — scripts in `package.json` use `npm run`)

## Clone & Install

```bash
git clone https://github.com/unreadlogs/AutarkChat.git
cd autarkchat
npm install
```

## Configure Environment

Create a `.env` file at the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/Autark
ADMIN_PASSWORD=your_admin_password
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `ADMIN_PASSWORD` | No | `"admin"` | Single admin login password. Falls back to `"admin"` if unset (`lib/auth.ts:29`) |

The database name is hardcoded as `autarkchat` in `lib/mongodb.ts:14`.

## Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000`. You'll be redirected to `/login`.

## First Login

1. Navigate to `http://localhost:3000/login`
2. Enter the `ADMIN_PASSWORD` (default: `admin`)
3. A session token (UUID) is created in MongoDB and stored in `localStorage` as `admin_secret`
4. You're redirected to `/chat`

**Every subsequent API call includes `Authorization: Bearer <admin_secret>`**.

## First Chat

You need at least one model configured before sending messages.

1. Click **Settings** in the sidebar → **Models**
2. Pick a provider preset (e.g. OpenAI), enter your API key
3. The model list auto-fetches — select one and click **Save Model**
4. Navigate back to the chat view and start typing

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run Next.js lint |
| `npm run typecheck` | Run TypeScript type check (`tsc --noEmit`) |

## Next Steps

- Read about [the architecture](./architecture/README.md)
- Understand [configuration options](./guides/configuration.md)
- Learn how to [add custom models](./guides/model-registry.md)
