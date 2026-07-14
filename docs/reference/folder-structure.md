---
title: Folder Structure
description: Annotated directory tree of the entire project
sidebar_position: 1
---

# Folder Structure

```
autarkchat/
├── .env                      # Environment variables (MONGODB_URI, ADMIN_PASSWORD)

├── README.md                 # Project README
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript config (ESNext, strict, @/ path alias)
├── next.config.ts            # Next.js config (reactStrictMode, poweredByHeader: false)
├── postcss.config.mjs        # PostCSS with @tailwindcss/postcss
│
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout: ThemeProvider, TooltipProvider, Toaster, Inter font
│   ├── globals.css           # Global styles, @theme tokens, dark mode, animations
│   ├── page.tsx              # Root → redirects to /chat
│   ├── favicon.ico
│   │
│   ├── login/page.tsx        # Single-password login form
│   ├── register/page.tsx     # Redirects to /login (legacy)
│   │
│   ├── chat/
│   │   ├── page.tsx          # New chat page → renders ChatShell (no props)
│   │   └── [id]/page.tsx     # Existing chat → SSR loads messages from DB
│   │
│   ├── compare/page.tsx      # Model comparison setup page
│   │
│   ├── settings/
│   │   ├── layout.tsx        # Settings sidebar + auth guard
│   │   ├── page.tsx          # General: theme, hotkey, density, system metrics
│   │   ├── personalization/page.tsx  # Name, occupation, about, custom instructions
│   │   ├── models/page.tsx   # Model registry CRUD with 23 provider presets
│   │   ├── sessions/page.tsx # Active session list + revocation
│   │   ├── skills/page.tsx   # Skills console (install/enable/disable files)
│   │   └── usage/page.tsx    # Token usage analytics with daily chart
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts      # POST — password → session UUID
│       │   ├── session/route.ts    # GET — check auth status
│       │   ├── verify/route.ts     # GET — verify bearer token
│       │   ├── logout/route.ts     # POST — clear legacy cookie
│       │   └── register/route.ts   # POST — legacy user registration
│       ├── chat/route.ts           # POST — SSE streaming (core), DELETE, PATCH
│       ├── messages/route.ts       # GET — messages + artifacts by chatId
│       ├── history/route.ts        # GET — paginated chat list, DELETE — bulk delete
│       ├── models/route.ts         # GET/POST/DELETE — custom model CRUD
│       ├── sessions/route.ts       # GET/DELETE — session management
│       ├── usage/route.ts          # GET — token usage analytics
│       ├── system/metrics/route.ts # GET — DB health + counts
│       ├── files/upload/route.ts   # POST — image upload
│       ├── skills/route.ts         # GET/POST/PATCH/DELETE — skills registry
│       ├── compare/route.ts        # POST — SSE streaming comparison
│       └── settings/personalization/route.ts  # GET/POST — personalization CRUD
│
├── components/
│   ├── chat/
│   │   ├── index.tsx          # Re-exports ChatShell
│   │   ├── shell.tsx          # MAIN: ChatShell — orchestrates all state, streaming, artifacts
│   │   ├── header.tsx         # Sticky header with title + new-chat button
│   │   ├── sidebar.tsx        # Collapsible sidebar: history, pin/delete, theme toggle, GitHub link
│   │   ├── messages.tsx       # Message list: flattenTurns, auto-scroll, MultiModelGrid
│   │   ├── message.tsx        # MessageBubble: Streamdown rendering, ActionBlock for tools
│   │   ├── input.tsx          # ChatInput: textarea, file attach, model selector dropdown
│   │   ├── greeting.tsx       # Empty-state greeting with random prompt cards
│   │   ├── artifact-viewer.tsx # ArtifactPanel: PDF/image/text preview in side panel
│   │   └── icons.tsx          # Icon exports: StopIcon, LogoIcon, ModelIcon (company SVGs)
│   │
│   ├── compare/
│   │   ├── CompareLayout.tsx  # Compare setup page UI + model picker integration
│   │   ├── CompareGrid.tsx    # Side-by-side response cards
│   │   ├── CompareCard.tsx    # Individual model response card
│   │   ├── CompareInput.tsx   # Prompt input for compare
│   │   └── ModelPicker.tsx    # Model selection dialog (favorites, recent, search)
│   │
│   └── ui/                    # shadcn-style primitives (Radix-based)
│       ├── button.tsx         # cva button with variants
│       ├── badge.tsx
│       ├── dropdown-menu.tsx
│       ├── scroll-area.tsx
│       ├── alert-dialog.tsx
│       ├── dialog.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       └── tooltip.tsx
│
├── lib/
│   ├── mongodb.ts           # MongoDB singleton connection (cached client + db)
│   ├── types.ts             # All TypeScript types: DBMessage, DBChat, DBArtifact, DBModel, etc.
│   ├── auth.ts              # verifyAdminAuth() — bearer token verification with in-memory cache
│   ├── queries.ts           # ALL database operations: chats, messages, artifacts, models, sessions, usage, personalization
│   ├── utils.ts             # cn(), generateUUID(), sanitizeText(), stripHtml(), getCompanySvg()
│   ├── stream-manager.ts    # StreamManager class — SSE event buffering, tool call tracking, health checks
│   ├── skills.ts            # Skills filesystem loader: loadSkills(), createOrUpdateSkill(), toggleSkillState(), deleteSkill()
│   │
│   ├── ai/
│   │   ├── models.ts        # ChatModel type + default model definitions (gpt-4o-mini, etc.)
│   │   ├── prompts.ts       # System prompts: regularPrompt, artifactsPrompt, titlePrompt
│   │   └── tools/
│   │       └── artifact.ts  # artifactTool — copies generated files to public/artifacts/ and creates DB records
│   │
│   ├── artifacts/
│   │   └── registry.ts      # Artifact label/icon helpers by MIME type
│   │
│   └── compare/
│       └── compare-types.ts # CompareStreamEvent, CompareCardData, CompareModelConfig, CompareState
│
├── hooks/
│   └── useCompareStream.ts  # useCompareStream custom hook — SSE reader, card state, retry, cancel
│
├── skills/                   # Filesystem-based skills registry
│   ├── pdf/                  # PDF Form Filler skill (extract, fill, convert PDFs)
│   ├── frontend-design/      # Frontend design skill
│   ├── skill-creator/        # Skill creation/evaluation tools
│   └── theme-factory/        # Theme generation skill
│
├── public/
│   ├── autark.svg            # App logo
│   ├── assets/               # README screenshots (chat.png, compare.png, etc.)
│   ├── models/               # Company SVG icons (openai.svg, claude.svg, deepseek.svg, etc.)
│   ├── uploads/              # Uploaded images (created at runtime)
│   └── artifacts/            # Generated artifacts (created at runtime)
│
├── node_modules/             # (gitignored)
├── .next/                    # (gitignored)
├── .venv/                    # (gitignored — Python virtual env for skill scripts?)
└── .idx/                     # IDX dev environment config
    └── dev.nix
```

## Key Files

| File | Role |
|---|---|
| `lib/mongodb.ts` | MongoDB singleton — cached `MongoClient` and `Db` |
| `lib/auth.ts` | `verifyAdminAuth()` — two-tier session verification |
| `lib/queries.ts` | All database operations in one file (~454 lines) |
| `lib/types.ts` | All TypeScript interfaces and types |
| `lib/skills.ts` | Filesystem registry — reads `skills/` directory |
| `lib/chat/route.ts` | Core SSE streaming endpoint (~683 lines) |
| `components/chat/shell.tsx` | Main client-side orchestrator (~495 lines) |
