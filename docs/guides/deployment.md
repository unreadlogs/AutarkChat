---
title: Deployment
description: Building and deploying AutarkChat for production
sidebar_position: 4
---

# Deployment

## Production Build

```bash
npm run build    # next build
npm run start    # next start
```

## Environment Variables

You need the same `.env` file in production:

```env
MONGODB_URI=<your_production_mongodb_uri>
ADMIN_PASSWORD=<strong_password>
```

## Deployment Options

### Self-hosted (Node.js)

```bash
npm run build
npm run start
```

The server listens on `http://localhost:3000` by default. Set `PORT` env var and `HOSTNAME` to change:

```bash
PORT=8080 HOSTNAME=0.0.0.0 npm run start
```

### Docker

There is no Dockerfile in the repo. You can create one based on the official Next.js standalone output configuration. The project uses `next.config.ts` which could be extended with `output: "standalone"` for optimized Docker builds.

### Vercel

Since this is a Next.js project, it deploys directly to Vercel. Note that:

- **File uploads** write to the local filesystem (`public/uploads/`), which won't persist across serverless instances
- **Skills** are loaded from the local filesystem (`skills/` directory), which also won't persist
- Use a Vercel Blob or S3-compatible storage adaptor if you need file persistence in production

### Platform Notes

| Aspect | Consideration |
|---|---|
| **File persistence** | Uploads and artifacts land in `public/` — not suitable for multi-instance deployments |
| **Skills persistence** | Skills live on disk — mount a persistent volume or bake them into the image |
| **MongoDB** | Required for all features. No fallback database exists |
| **SSE streaming** | Server-sent events require a long-running connection — works on all platforms |
| **Session cache** | `activeSessionsCache` is in-memory and resets on restart. Sessions survive in MongoDB |
