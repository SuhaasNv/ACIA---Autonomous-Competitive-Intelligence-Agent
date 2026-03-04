# Signal — Demo Lock (Architecture Snapshot)

**Locked for demo.** This document captures the production-ready architecture as of the demo date.

---

## Architecture Summary

```
[ React (Vite) ]  ←→  [ Express API ]  ←→  [ Supabase ]
       |                     |                    |
       |              Bright Data MCP             |
       |              JSON API fallback           |
       |              Acontext (memory)           |
       |              Gemini 2.5 Flash            |
```

### Scan Pipeline (Deterministic)

1. **Fetch** — Bright Data MCP scrapes URL → HTML
2. **Parse** — Parser extracts pricing tiers from HTML
3. **JSON API fallback** — If HTML has no pricing (client-rendered), try `/api/pricing`, `/api/prices`, `/api/plans`
4. **ActionBook** — Fallback only if <2 tiers (currently returns 405; synthetic used)
5. **Delta** — Compare new snapshot vs Acontext baseline
6. **Gemini** — Only if ≥5% change
7. **Store** — Save report to Supabase, update Acontext

**Demo site (Acme AI):** `https://demowebsite-blush.vercel.app` — uses `/api/pricing` JSON endpoint for live prices.

---

## Pre-Demo Checklist

- [ ] `npm run dev:full` – frontend (3000) + backend (3001)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env` (required for competitors/reports)
- [ ] `BRIGHTDATA_MCP_TOKEN` in `.env` or `server/.env`
- [ ] `GEMINI_API_KEY` in `.env`
- [ ] Competitor: Acme AI → `https://demowebsite-blush.vercel.app` (or `/pricing`)

---

## Key Files (Do Not Modify)

| File | Purpose |
|------|---------|
| `server/src/controllers/scan.controller.js` | Scan pipeline, JSON API fallback |
| `server/src/services/brightdata.service.js` | Bright Data MCP |
| `server/src/services/parser.service.js` | HTML → pricing parsing |
| `server/src/services/supabase.service.js` | DB operations |
| `server/src/services/gemini.service.js` | LLM insights |

---

## Env Vars Required

```bash
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Required for backend
GEMINI_API_KEY=

# Optional (for scraping)
BRIGHTDATA_MCP_TOKEN=
```

---

## Start Commands

```bash
npm install && cd server && npm install && cd ..
npm run dev:full
```

Open: http://localhost:3000
