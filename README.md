<p align="center">
  <img src="https://img.shields.io/badge/Signal-ACIA-6366f1?style=for-the-badge" alt="Signal" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

<h1 align="center">Signal</h1>
<p align="center">
  <strong>Autonomous Competitive Intelligence for SaaS Teams</strong>
</p>
<p align="center">
  Detect strategic pricing and feature shifts before your competitors do.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#environment">Environment</a> •
  <a href="#api">API</a>
</p>

---

## Overview

**Signal** (ACIA) is a user-triggered competitive intelligence platform that monitors competitor pricing pages and delivers AI-powered strategic insights. Add a competitor URL, click Scan, and receive actionable intelligence—only when material changes (≥5% delta) are detected, keeping API costs minimal.

Built for **SaaS founders** and **product managers** who need to stay ahead of competitive moves without manual monitoring.

---

## Features

- **Manual Scan Only** — User-initiated scans. No background polling or scheduling.
- **Single Competitor** — MVP scope: one competitor, one pricing page.
- **Cost-First Design** — Gemini called only when delta ≥5%. Bright Data called once per scan.
- **Instant Insights** — Strategic recommendations powered by Google Gemini.
- **Auth & Onboarding** — Supabase Auth with email/password. Profile creation required.
- **Protected Dashboard** — Full route protection with onboarding enforcement.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **Supabase** account
- **Bright Data** credentials (optional; falls back to direct fetch)
- **Gemini API key** (optional; returns placeholder if missing)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ACIA.git
cd ACIA
npm install
cd server && npm install && cd ..
```

### 2. Configure Environment

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for required keys.

### 3. Run Development Servers

**Terminal 1 — Frontend (port 3000):**
```bash
npm run dev
```

**Terminal 2 — Backend API (port 3001):**
```bash
cd server && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

---

## Architecture

```
┌─────────────┐     POST /api/scan      ┌─────────────────┐
│   React     │ ─────────────────────► │   Express API   │
│   (Vite)    │     + JWT Auth          │   (Node.js)     │
└─────────────┘                         └────────┬────────┘
                                                │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
            │  Bright Data  │          │   Supabase    │          │    Gemini     │
            │  (Scraping)   │          │  (DB + Auth)  │          │  (Insights)   │
            └───────────────┘          └───────────────┘          └───────────────┘
                    │                          │                          │
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               │
                                               ▼
                                    ┌───────────────────┐
                                    │  Delta Engine     │
                                    │  (≥5% → Gemini)   │
                                    └───────────────────┘
```

### Scan Flow

1. **Trigger** — User clicks Scan → `POST /api/scan`
2. **Fetch** — Bright Data scrapes competitor pricing URL
3. **Parse** — HTML → structured JSON (tiers, prices)
4. **Compare** — Delta engine vs. last snapshot (Acontext)
5. **Conditional AI** — Gemini only if delta ≥5%
6. **Store** — Report saved to Supabase

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, React Router |
| **Backend** | Node.js, Express |
| **Database & Auth** | Supabase (PostgreSQL, Auth) |
| **Scraping** | Bright Data (proxy), ActionBook (fallback) |
| **AI** | Google Gemini 2.5 Flash |
| **Memory** | Acontext (latest snapshot) |

---

## Project Structure

```
ACIA/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # UI components
│   ├── contexts/           # Auth context
│   ├── pages/              # Route pages
│   └── lib/                # Supabase client, utils
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Scan controller
│   │   ├── middleware/     # JWT auth
│   │   ├── routes/         # API routes
│   │   └── services/       # Bright Data, Gemini, etc.
│   └── server.js
├── docs/                   # Architecture, user flow, API
└── .env                    # Environment variables
```

---

## Environment Variables

### Frontend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

### Backend (`.env` in project root)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Yes | Same as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend admin access |
| `BRIGHTDATA_PROXY_HOST` | No | Bright Data proxy host |
| `BRIGHTDATA_PROXY_PORT` | No | Default: `22225` |
| `BRIGHTDATA_USERNAME` | No | Proxy username |
| `BRIGHTDATA_PASSWORD` | No | Proxy password |
| `GEMINI_API_KEY` | No | Returns placeholder if missing |
| `ACONTEXT_API_URL` | No | Memory layer |
| `ACONTEXT_API_KEY` | No | Falls back to in-memory |
| `ACTIONBOOK_API_URL` | No | Fallback scraper |
| `ACTIONBOOK_API_KEY` | No | Fallback scraper |
| `PORT` | No | Backend port (default: `3001`) |

---

## API

### `POST /api/scan`

Runs a competitive intelligence scan. Requires JWT in `Authorization: Bearer <token>`.

**Response (success):**
```json
{
  "status": "completed",
  "isFirstRun": false,
  "hasSignificantChange": true,
  "delta": { "changes": [...] },
  "insight": "Strategic insight text...",
  "classification": "Critical"
}
```

**Errors:**
- `401` — Missing or invalid JWT
- `404` — No competitor configured for user

---

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `--watch` (from `server/`) |
| `npm start` | Start production server |

---

## Documentation

- [Architecture](docs/architecture.md) — System design, data flow
- [User Flow](docs/userflow.md) — User journey, scan flow
- [UI Flow](docs/ui-flow.md) — Page states, interactions
- [Scope Audit](docs/SCOPE_AUDIT_REPORT.md) — Implementation vs. MVP scope

---

## License

MIT
