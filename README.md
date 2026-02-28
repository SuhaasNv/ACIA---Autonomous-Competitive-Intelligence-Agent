<div align="center">

# 🎯 Signal — ACIA

### *Autonomous Competitive Intelligence for SaaS Teams*

**Detect strategic pricing and feature shifts before your competitors do.**

<br />

[![Built by Suhaas](https://img.shields.io/badge/Built%20by-Suhaas-6366f1?style=for-the-badge&labelColor=1e1b4b)](https://github.com/SuhaasNv)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

<br />

**A full-stack competitive intelligence platform — built from scratch by one developer.**

[Demo](#-see-it-in-action) • [Quick Start](#-quick-start) • [Architecture](#-how-it-works) • [Tech Stack](#-tech-stack)

</div>

---

## 🚀 What is Signal?

**Signal** (ACIA) is a user-triggered competitive intelligence platform that monitors competitor pricing pages and delivers **AI-powered strategic insights** — only when it matters.

> Add a competitor URL → Click Scan → Get actionable intelligence.  
> **No background polling. No wasted API calls. Just smart, cost-efficient monitoring.**

Built for **SaaS founders** and **product managers** who need to stay ahead of competitive moves without manual research or expensive tools.

---

## ✨ Why Judges Will Love This

| What makes it stand out | The technical story |
|-------------------------|---------------------|
| **Cost-first AI design** | Gemini is called *only* when delta ≥5% — raw HTML never hits the LLM |
| **Delta engine** | Custom diff engine compares structured JSON snapshots before waking up AI |
| **Full-stack solo build** | React + Express + Supabase + Bright Data + Gemini — one developer, end-to-end |
| **Production-ready auth** | Supabase Auth, JWT middleware, protected routes, onboarding flow |
| **Smart scraping** | Bright Data proxy with ActionBook fallback for anti-bot resilience |

---

## 🎬 See It In Action

```
Landing → Register → Add Competitor → Scan → AI-Powered Report
```

- **Empty state** → Add your first competitor (pricing page URL)
- **Scan** → Scrapes page, parses structure, compares to last snapshot
- **Material change?** → Gemini generates strategic insight
- **No change?** → Returns instantly, zero AI cost

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+
- **Supabase** account (free tier works)
- **Gemini API key** (optional — returns placeholder if missing)
- **Bright Data** credentials (optional — falls back to direct fetch)

### Run locally

```bash
# Clone
git clone https://github.com/SuhaasNv/ACIA.git
cd ACIA

# Install
npm install
cd server && npm install && cd ..

# Configure (copy .env.example to .env and fill in keys)
cp .env.example .env

# Run
npm run dev          # Frontend → http://localhost:3000
cd server && npm run dev   # Backend → http://localhost:3001
```

---

## 🏗 How It Works

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
                    └──────────────────────────┼──────────────────────────┘
                                               │
                                               ▼
                                    ┌───────────────────┐
                                    │  Delta Engine     │
                                    │  (≥5% → Gemini)   │
                                    └───────────────────┘
```

### Scan flow

1. **Trigger** — User clicks Scan → `POST /api/scan`
2. **Fetch** — Bright Data scrapes competitor pricing URL
3. **Parse** — HTML → structured JSON (tiers, prices)
4. **Compare** — Delta engine vs. last snapshot
5. **Conditional AI** — Gemini only if delta ≥5%
6. **Store** — Report saved to Supabase

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, React Router |
| **Backend** | Node.js, Express |
| **Database & Auth** | Supabase (PostgreSQL, Auth) |
| **Scraping** | Bright Data (proxy), ActionBook (fallback) |
| **AI** | Google Gemini 2.5 Flash |
| **Memory** | Acontext (latest snapshot) |

---

## 📁 Project Structure

```
ACIA/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # UI (shadcn, custom)
│   ├── contexts/           # Auth context
│   ├── pages/              # Landing, Dashboard, Report, etc.
│   └── lib/                # Supabase, API client
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Scan controller
│   │   ├── middleware/     # JWT auth
│   │   ├── routes/         # API routes
│   │   └── services/       # Bright Data, Gemini, diff engine
│   └── server.js
├── docs/                   # Architecture, user flow, API
└── .env                    # Environment variables
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend admin access |
| `GEMINI_API_KEY` | No | Returns placeholder if missing |
| `BRIGHTDATA_*` | No | Proxy credentials (falls back to direct fetch) |
| `ACONTEXT_*` | No | Memory layer (falls back to in-memory) |

See `.env.example` for the full list.

---

## 📜 API

### `POST /api/scan`

Runs a competitive intelligence scan. Requires JWT in `Authorization: Bearer <token>`.

**Success response:**
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

---

## 📚 Documentation

- [Architecture](docs/architecture.md) — System design, data flow
- [User Flow](docs/userflow.md) — User journey, scan flow
- [UI Flow](docs/ui-flow.md) — Page states, interactions

---

<div align="center">

### 👤 Built with ❤️ by [Suhaas](https://github.com/SuhaasNv)

*One developer. Full stack. Hackathon-ready.*

**[⭐ Star this repo](https://github.com/SuhaasNv/ACIA)** if you found it useful!

</div>
