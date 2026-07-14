---
title: Troubleshooting
description: Common issues, error messages, and fixes
sidebar_position: 3
---

# Troubleshooting

## Login Issues

### "Invalid password"
- Check your `.env` file has `ADMIN_PASSWORD` set correctly
- Default password is `admin` if not set
- The password comparison is a plain string match in `app/api/auth/login/route.ts:31`

### Redirected back to login after authenticating
- Your session may have been revoked (via Settings → Sessions)
- Clear `localStorage` (`admin_secret` key) and log in again
- Check that MongoDB's `sessions` collection has your session with `isActive: true`

## Chat Issues

### "No models configured"
- You need at least one model in the registry before chatting
- Go to **Settings → Models** and add one
- Or via API: `POST /api/models`

### "Selected model not found"
- The model UUID sent by the client no longer exists in the DB
- This can happen if models were deleted between page loads
- Refetch the models list or re-select one from the dropdown

### Stream stops mid-response
- The `maxDuration` for `/api/chat` is 60 seconds (`app/api/chat/route.ts:78`)
- The tool loop has a maximum of **5 steps** per response (`app/api/chat/route.ts:158`)
- Check the server console for `Stream error:` logs

### Generation cannot be cancelled
- Abort is handled via `AbortController` — if the controller is stale, the cancel button may appear to do nothing
- This is rare — the `abortControllerRef` is updated at the start of each request

## Database Issues

### "Failed to query database" on settings page
- MongoDB connection string in `.env` may be invalid
- Check the `MONGODB_URI` format
- The database name is hardcoded as `autarkchat` — verify this exists in your MongoDB instance
- Firewall/network issues — MongoDB Atlas requires IP whitelisting

### Data not persisting
- The `lib/mongodb.ts` singleton caches the connection — if it fails silently on first call, subsequent calls also fail
- Check server logs for MongoDB connection errors

## Deployment Issues

### File uploads not working
- Files are saved to `public/uploads/` at runtime
- Serverless platforms may not support local file writes
- Consider adapting the upload handler for S3-compatible storage

### Skills not showing
- Skills are loaded from the `skills/` directory at runtime
- Each skill needs a directory with a `SKILL.md` file (and optionally a `skills.json` metadata file)
- The directory must not start with `.` and must not be `node_modules`

## Auth Issues

### 401 on API calls
- Your `admin_secret` may be expired/revoked
- Re-login to get a new session
- Check that `Authorization: Bearer <token>` header is being sent correctly

### `activeSessionsCache` cleared
- The in-memory cache resets when the server restarts
- Sessions remain valid in MongoDB — the first request after restart will re-cache the token

## Known Gaps

- **`GET /api/skills` requires no authentication** — `app/api/skills/route.ts:5` does not call `verifyAdminAuth()`
- **Legacy `/register` route** — the page redirects to `/login` but the API endpoint still works
- **`.env` contains live credentials** — the checked-in `.env` file has real MongoDB credentials and admin password. Rotate them if this is a public repo
