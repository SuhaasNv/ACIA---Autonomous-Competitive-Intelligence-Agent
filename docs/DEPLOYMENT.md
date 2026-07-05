# Deployment Guide — Railway (Full Stack)

Both the frontend and backend deploy as separate Railway services in the same project, backed by a Railway Postgres plugin.

## 1. Postgres

In your Railway project, add a **Postgres** plugin. Railway auto-injects `DATABASE_URL` into any service in the same project that references it.

Run the schema once against it:

```bash
railway run --service <backend-service> psql $DATABASE_URL -f db/schema.sql
```

(Or paste the contents of `db/schema.sql` into a local `psql` session connected to the Railway Postgres instance.)

## 2. Backend service (root directory: `server/`)

**Railway Dashboard → Backend Service → Variables:**

| Variable | Required | Description |
|----------|----------|--------------|
| `DATABASE_URL` | ✅ | Provided automatically if the Postgres plugin is referenced |
| `JWT_SECRET` | ✅ | Long random string used to sign auth tokens |
| `OPENAI_API_KEY` | ✅ | For AI insight generation |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-4o-mini` |
| `FRONTEND_URL` | ✅ | Your frontend service's Railway URL, for CORS |
| `BRIGHTDATA_MCP_TOKEN` | Optional | For scraping (falls back to direct fetch) |

Build/start commands (Nixpacks auto-detects via `server/package.json`): `npm install` then `npm start`.

## 3. Frontend service (root directory: `/`)

**Railway Dashboard → Frontend Service → Variables:**

| Variable | Required | Description |
|----------|----------|--------------|
| `VITE_API_URL` | ✅ | Backend service's Railway URL + `/api`, e.g. `https://acia-backend-production.up.railway.app/api` |

Build command: `npm run build`. Start command: `npm start` (runs `serve.js`, a small Express server that serves the Vite `dist/` build with SPA fallback).

**Important:** `VITE_API_URL` must point to your Railway backend URL + `/api`, no trailing slash.

## Troubleshooting

- **401s on every request after deploy:** Check `JWT_SECRET` is set identically across backend restarts — if it changes, all previously issued tokens become invalid and users are logged out.
- **500 on `/api/*` routes:** Check Railway backend logs for `[Error]`; usually `DATABASE_URL` isn't set or the schema hasn't been applied yet (run step 1).
- **CORS errors in the browser console:** Confirm `FRONTEND_URL` on the backend service exactly matches the frontend's Railway URL (scheme + host, no trailing slash).
