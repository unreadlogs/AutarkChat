---
title: Development
description: Local development workflow, code conventions, and project structure
sidebar_position: 5
---

# Development

## Commands

```bash
npm run dev        # next dev --turbopack
npm run build      # next build
npm run start      # next start
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

## Project Structure

```
app/                  — Next.js App Router (pages + API routes)
lib/                  — Server-side logic (DB, auth, AI, types)
components/           — React components (chat, UI primitives, compare)
hooks/                — Custom React hooks (useCompareStream)
skills/               — Filesystem-based skills registry
public/               — Static assets (models, uploads, artifacts)
```

## Code Conventions

- **API routes**: Named exports (`GET`, `POST`, `DELETE`, `PATCH`) in `app/api/[resource]/route.ts`
- **DB types**: Prefix with `DB` (`DBMessage`, `DBChat`, `DBArtifact`)
- **Components**: CamelCase files in `components/`
- **Props**: PascalCase types for component props
- **State**: `useState` + `localStorage` — no global state library
- **CSS**: Tailwind CSS v4 with `@theme` tokens and `@utility` classes in `globals.css`
- **Auth guard**: `verifyAdminAuth()` at the top of every API route handler

## Design System

Key rules:

- **Monochrome only** — Black through greys, no accent colors
- **Buttons**: `rounded-full` pills, black background on light, white on dark
- **Borders**: `border-border/40` or `border-border/30` — hairline-thin
- **Cards**: No shadows — use hairline borders and tonal surface steps
- **Typography**: Tight letter-spacing on headings (`-0.025em`), generous line-height on body
- **Sections**: Editorial eyebrow (uppercase, small) + heading + body lockup pattern

## Adding a New API Route

```typescript
import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // route logic
}
```

## Client Auth Pattern

```typescript
const getAuthHeaders = useCallback(() => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_secret") : null;
  return { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" };
}, []);
```

## Adding a New Component

1. Check existing components in `components/` for conventions
2. Use `cn()` from `@/lib/utils` for conditional class merging
3. Use `useCallback`/`useMemo` for callbacks passed to children
4. Use `AnimatePresence` from framer-motion for mount/unmount animations
5. Use design tokens from `globals.css` (`--ink`, `--graphite`, `--hairline`, etc.)

## Styling

The project uses Tailwind CSS v4 with the PostCSS plugin (`@tailwindcss/postcss`). The `@theme inline` directive in `globals.css` defines custom color tokens. The `@source` directive points to Streamdown packages so Tailwind detects classes from the library.

```css
@source "../node_modules/streamdown";
@source "../node_modules/@streamdown/code";
```

Custom animations are defined as `@utility` classes (e.g., `fade-up`, `shimmer`, `message-fade-in`).
