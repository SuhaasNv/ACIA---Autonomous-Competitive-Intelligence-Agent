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

[Demo](#-see-it-in-action) • [Quick Start](#-quick-start) • [Architecture](#-how-it-works) • [Integrations](#-integrations--use-cases) • [Tech Stack](#-tech-stack)

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
| **Delta engine** | Custom diff engine compares structured JSON snapshots (Acontext baseline) before waking up AI |
| **Full-stack solo build** | React + Express + Supabase + Bright Data + ActionBook + Acontext + Gemini — one developer, end-to-end |
| **Production-ready auth** | Supabase Auth, JWT middleware, protected routes, onboarding flow |
| **Smart scraping** | Bright Data (MCP → Proxy → Direct) with ActionBook agent fallback for dynamic/anti-bot pages |

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
- **Bright Data** MCP token or proxy credentials (optional — falls back to direct fetch)
- **ActionBook** API key (optional — fallback when static scrape yields fewer than 2 tiers)
- **Acontext** API key (optional — falls back to in-memory baseline)

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
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ACIA — Scan Architecture                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     POST /api/scan      ┌─────────────────────────────────────────────────┐
│   React     │ ─────────────────────► │              Express API (Node.js)               │
│   (Vite)    │     + JWT Auth          │                                                 │
└─────────────┘                         └─────────────────────┬───────────────────────────┘
                                                              │
         ┌────────────────────────────────────────────────────┼────────────────────────────────────────────────────┐
         │                    │                    │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Bright Data   │  │   ActionBook     │  │    Acontext      │  │    Supabase     │  │     Gemini      │  │  Delta Engine    │
│   (Primary)     │  │   (Fallback)     │  │   (Memory)       │  │  (DB + Auth)    │  │   (Insights)    │  │  (≥5% → AI)      │
└────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                   │                     │                     │                     │                     │
         │  MCP / Proxy /    │  Agent navigation   │  getLatestSnapshot  │  Competitors,       │  analyzeDelta()    │  computeLocalDelta
         │  Direct fetch     │  when <2 tiers      │  setLatestSnapshot  │  Reports, Auth      │  (conditional)     │  (JSON diff)
         │                   │                     │                     │                     │                     │
         └───────────────────┴─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
                                                              │
                                                              ▼
                                              ┌───────────────────────────────┐
                                              │  1. Bright Data fetches HTML  │
                                              │  2. Parse → tiers/prices        │
                                              │  3. If <2 tiers → ActionBook    │
                                              │  4. Acontext: load baseline    │
                                              │  5. Delta ≥5%? → Gemini        │
                                              │  6. Save report → Supabase     │
                                              └───────────────────────────────┘
```

### Scan flow

1. **Trigger** — User clicks Scan → `POST /api/scan`
2. **Fetch** — Bright Data scrapes competitor URL (MCP → Proxy → Direct fallback)
3. **Parse** — HTML → structured JSON (tiers, prices)
4. **ActionBook fallback** — If &lt;2 tiers found, autonomous agent navigates to pricing page
5. **Compare** — Delta engine vs. Acontext baseline snapshot
6. **Conditional AI** — Gemini only if delta ≥5%
7. **Store** — Report saved to Supabase, snapshot to Acontext

---

## 🔌 Integrations & Use Cases

### Bright Data — Primary Scraping Engine

**Use case:** High-volume, standard SaaS pricing pages that aren't aggressively anti-bot or highly dynamic.

**How it works:**
- **Strategy 1 (MCP):** Bright Data Model Context Protocol — connects via SSE, calls `scrape_as_html` tool for clean HTML
- **Strategy 2 (Proxy):** Bright Data residential proxy — routes requests through proxy for anti-bot bypass
- **Strategy 3 (Direct):** Plain axios fetch with robust headers — fallback when credentials are missing

**Flow:** Tries MCP → Proxy → Direct, with retries. Returns HTML for parsing. Used first for every scan.

---

### ActionBook — Autonomous Web Agent (Fallback)

**Use case:** Dynamic pages (React/Next), pricing behind navigation, or when static scraping yields nothing.

**When it triggers:**
- Bright Data returns HTML but parser finds &lt;2 pricing tiers
- User provides homepage URL instead of direct pricing URL
- Pricing is behind interaction (e.g. "Pricing" link in nav)

**How it works:**
- **`navigateToPricing()`** — Agent starts at homepage, uses goal "Find and navigate to the pricing page", clicks common selectors (`a[href*="pricing"]`, `a[href*="plans"]`, etc.), waits for pricing content
- **`extractDynamicHtml()`** — Renders URL with `wait_for_selector` for `.pricing`, `.price`, `.tier`, etc.

**Flow:** Only invoked when Bright Data + parser fail to extract sufficient tiers. Returns rendered HTML from the discovered pricing page.

---

### Acontext — Memory & Baseline State

**Use case:** "Time machine" for delta comparison — stores the latest pricing snapshot per user so we can detect changes over time.

**How it works:**
- **`getLatestSnapshot(userId)`** — Retrieves previous scan's structured JSON (tiers, prices) before comparing
- **`setLatestSnapshot(userId, data)`** — Overwrites memory with new scan result after processing
- **Key format:** `competitor:{userId}:latest_snapshot`

**Fallback:** If no API key, uses in-memory `Map` — works for single-instance dev, degrades gracefully.

**Flow:** Called before delta computation (load baseline) and after scan completes (save new state).

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, React Router |
| **Backend** | Node.js, Express |
| **Database & Auth** | Supabase (PostgreSQL, Auth) |
| **Scraping** | Bright Data (MCP, Proxy, Direct), ActionBook (agent fallback for dynamic pages) |
| **AI** | Google Gemini 2.5 Flash |
| **Memory** | Acontext (baseline snapshots for delta comparison) |

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
| `BRIGHTDATA_MCP_TOKEN` | No | Bright Data MCP token (primary scraping; falls back to proxy/direct) |
| `BRIGHTDATA_PROXY_HOST`, `BRIGHTDATA_USERNAME`, `BRIGHTDATA_PASSWORD` | No | Bright Data proxy (fallback if MCP fails) |
| `ACTIONBOOK_API_KEY` | No | ActionBook agent (fallback when &lt;2 tiers from static scrape) |
| `ACONTEXT_API_KEY` | No | Acontext memory (falls back to in-memory for baseline) |

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
