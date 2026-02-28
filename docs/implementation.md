# ACIA: Autonomous Competitive Intelligence Agent - System Architecture & Execution Plan

## 1. System Architecture
ACIA is designed as a modular, event-driven pipeline that transforms raw web data into strategic intelligence.

### Component Breakdown
- **Ingestion Engine**: Orchestrates Bright Data (static) and ActionBook (dynamic) to fetch target pages.
- **Extraction Service**: Uses LLM-driven parsing to convert HTML/screenshots into structured JSON (tiers, features, prices).
- **Intelligence Layer (Acontext)**: Manages historical state, computes deltas (diffs), and generates strategic insights.
- **Frontend Dashboard**: A high-end Next.js/Vite interface for visualizing timelines and strategic reports.

### Data Flow
1. **Trigger**: User inputs a URL.
2. **Fetch**: Ingestion Engine decides between MCP Bright Data (fast, static) or ActionBook (dynamic/behind-JS).
3. **Normalize**: Extraction Service maps raw data to a standard `PricingSchema`.
4. **Compare**: Acontext retrieves the `last_known_state`. Delta engine calculates `Added/Removed/Changed`.
5. **Analyze**: LLM analyzes deltas + current state to generate a "Competitive Impact Report".
6. **Store**: Save new state to Acontext as the latest snapshot.
7. **Present**: Dashboard renders the latest intelligence.

---

## 2. Minimal Backend Structure
**Path**: `/backend`

### File Structure
```text
/backend
  /services
    - scraper_service.py (Bright Data & ActionBook orchestration)
    - intelligence_service.py (Delta logic & LLM prompts)
    - storage_service.py (Acontext wrapper)
  /models
    - pricing.py (Pydantic models for Tiers/Features)
  /api
    - main.py (FastAPI endpoints)
  .env (API Keys)
```

### Key Services
- `ScraperService`: Logic to toggle between MCP and ActionBook.
- `StorageService`: Push/Pull snapshots from Acontext.

### Data Models
- `PricingTier`: `name`, `price`, `billing_cycle`, `features[]`.
- `IntelligenceReport`: `timestamp`, `deltas`, `strategic_impact`, `action_items`.

### API Endpoints
- `POST /analyze`: Accepts URL, triggers full pipeline.
- `GET /history`: Returns historical snapshots from Acontext.
- `GET /latest`: Returns the current intelligence report.

---

## 3. Bright Data Integration (via MCP)
**Usage**: Primary engine for high-volume, standard SaaS pricing pages that aren't aggressively anti-bot or highly dynamic.

- **Flow**:
  1. Use Bright Data MCP tool to fetch the URL content.
  2. specifically request "clean" HTML or Markdown conversion to reduce token cost.
- **Output Format**: Markdown (optimized for LLM extraction).

---

## 4. ActionBook Integration
**Usage**: For dynamic pages (React/Next apps) or when pricing is behind interaction (e.g., clicking a "Monthly/Annual" toggle).

- **Interaction Logic**:
  - `ActionBook` script to:
    1. Navigate to URL.
    2. Wait for `pricing-table` or similar selectors.
    3. Click toggles (Monthly vs Yearly).
    4. Capture `body.innerText` + screenshot for visual verification.
- **Fallback**: If Bright Data returns an empty `<body>` or "Access Denied", automatically switch to ActionBook.

---

## 5. Acontext Integration (Memory & State)
**Usage**: Acontext serves as the "Time Machine" and "Decision Engine Context".

- **Short-term Memory**: Stores the current scraping session metadata.
- **Mid-term State**: Stores the last 5 snapshots for delta comparison.
- **Snapshot Schema**:
  ```json
  {
    "competitor_id": "string",
    "timestamp": "ISO-8601",
    "data": { "tiers": [...], "features": [...] },
    "metadata": { "source": "BrightData|ActionBook" }
  }
  ```
- **Delta Logic**: JSON-diff between `T-0` and `T-1`.
  - Changed `price`.
  - New `feature` added.
  - Tier `removed`.

---

## 6. Intelligence Layer
### Delta Computation
- Hard-coded logic for structure diffs.
- Categorization: `INFLATIONARY` (price up), `AGGRESSIVE` (features added, price same), `VALUE_ENGINEERING` (tier removed).

### LLM Prompt Structure
```text
System: You are a Tier-1 McKinsey Strategy Consultant.
Context: Historical state [T-1] vs Current state [T-0].
Task: 
1. Identify the ONE most significant change.
2. Predict the impact on our market share.
3. Suggest 3 counter-moves.
```

---

## 7. Frontend MVP Flow
1. **Landing**: "Competitor URL" input field with a "Scan Now" button.
2. **Loading**: Progress steps: [Scraping -> Parsing -> Delta Check -> Generating Insights].
3. **Dashboard**:
   - Sidebar with history snapshots.
   - Main view: "Price Change Alert" (if applicable).
   - Comparative table: "Then" vs "Now".
   - AI Strategic Brief card.

---

## 8. Development strategy: What to Skip
- **NO Authentication**: Direct access to dashboard for demo.
- **NO Multi-tenant**: Hardcoded for 1 competitor at a time.
- **NO CRON/Scheduling**: Manual "Refresh" button only.
- **NO Database**: Use Acontext and local file storage if needed.

---

## 9. 6-Hour Execution Timeline (Team of 4)

| Hour | Dev 1 (Frontend) | Dev 2 (Backend/API) | Dev 3 (Scraping/MCP) | Dev 4 (Intelligence/Acontext) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Layout & UI Design | Repo Setup & API Skeleton | Bright Data MCP Test | Acontext Schema Design |
| **2** | Dashboard Components | Scraper Wrapper | ActionBook Scripting | Extraction Prompt Eng. |
| **3** | Integration (API) | Storage Integration | Dynamic Page Edge Cases | Delta Logic Implementation |
| **4** | Timeline/Diff View | Error Handling Logic | Testing 1 SaaS Target | Strategic Prompt Eng. |
| **5** | Visual Polish/Cards | End-to-End Testing | Final Data Optimization | Demo Data Prep |
| **6** | Demo Recording/Prep | Bug Squashing | Documentation | Final Presentation Prep |

---

## 10. Demo Narrative
- **60s Architecture**: "We built ACIA as a multi-modal ingestion engine. We solve the 'dynamic web' problem by layering Bright Data for speed and ActionBook for interaction, all tied together by Acontext's historical state management to detect market shifts in real-time."
- **30s USP**: "Most tools only scrape. ACIA thinks. It doesn't just tell you the price changed; it tells you why their strategy is shifting and how we should respond."
- **30s Technical Depth**: "We're using Acontext's context engineering to maintain state across disparate scraping sessions, ensuring our delta logic is precise and our LLM insights are grounded in historical truth."
