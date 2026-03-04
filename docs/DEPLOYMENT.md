# Deployment Guide — Railway (Backend) + Vercel (Frontend)

## Railway Backend — Required Environment Variables

Set these in **Railway Dashboard → Your Project → Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Or use `VITE_SUPABASE_URL` — Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | From Supabase Dashboard → Settings → API → service_role |
| `SUPABASE_ANON_KEY` | ✅ | Or use `VITE_SUPABASE_ANON_KEY` — for auth validation |
| `GEMINI_API_KEY` | ✅ | For AI insights |
| `BRIGHTDATA_MCP_TOKEN` | Optional | For scraping (falls back to direct fetch) |

**Copy from your local `.env`:**
- `VITE_SUPABASE_URL` → set as `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY` → set as `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `BRIGHTDATA_MCP_TOKEN`

## Vercel Frontend — Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `VITE_API_URL` | ✅ | Backend API URL, e.g. `https://acia-autonomous-competitive-intelligence-agent-production.up.railway.app/api` |

**Important:** `VITE_API_URL` must point to your Railway backend URL + `/api`.

## 500 Error on POST /api/competitors — Checklist

1. **Railway Variables** — Add these in Railway Dashboard → Variables:
   - `VITE_SUPABASE_URL` (or `SUPABASE_URL`) = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = from Supabase → Settings → API → service_role
   - `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY`) = from Supabase → Settings → API → anon
   - `GEMINI_API_KEY`
   - `BRIGHTDATA_MCP_TOKEN` (optional)
2. **Redeploy** — After adding variables, trigger a redeploy (Railway → Deployments → Redeploy)
3. **Railway Logs** — Check logs for `[Supabase Error]` or `[Error]` to see the actual failure
4. **Supabase Tables** — Ensure `competitors` and `reports` tables exist (run `sql_init.sql` in Supabase SQL Editor)
5. **Vercel VITE_API_URL** — Must be `https://YOUR-RAILWAY-APP.up.railway.app/api` (no trailing slash)
