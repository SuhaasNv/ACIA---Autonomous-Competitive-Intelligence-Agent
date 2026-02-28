# Signal (ACIA) – Strict Implementation Audit Report

**Audit Date:** 2026-02-28  
**Scope:** MVP constraints only. No feature expansion.

---

## 1. Frontend Audit

### Implemented
- **Landing** (`Landing.tsx`) – Hero, CTA to /register
- **Register** (`Register.tsx`) – Email/password auth via Supabase (Google removed)
- **Onboarding** (`Onboarding.tsx`) – Profile creation, inserts to `profiles` table
- **DashboardLayout** (`DashboardLayout.tsx`) – Tabbed layout (Dashboard, Competitors, Reports, Insights, Timeline)
- **Processing** (`Processing.tsx`) – Step animation UI
- **Report** (`Report.tsx`) – Intelligence report UI
- **ProtectedRoute** – Session + profile checks, onboarding redirect
- **AddCompetitorModal** – Form (name, pricingUrl, featuresUrl, frequency)

### Assumes Backend Exists
- Add Competitor modal expects competitor creation to succeed
- Processing expects scan to complete and return report
- Report expects real delta/insight data
- Dashboard tabs expect competitor/report data from API

### Mock Data Locations
| File | Mock Data |
|------|-----------|
| `Report.tsx` | `pricingData`, `featuresAdded`, `featuresRemoved`, `trendData` = empty arrays; hardcoded "Acme Inc", insight text, recommended actions |
| `DashboardTab.tsx` | `competitors` (4 items), `miniPricing` (3 items), hardcoded insight |
| `CompetitorsTab.tsx` | `competitors` = empty array |
| `TimelineTab.tsx` | `trendData`, `events` = empty arrays |
| `DashboardLayout.tsx` | "3 of 5 competitors" usage gauge |
| `ReportsTab.tsx` | Hardcoded "Acme Inc" report list |

### Expected Data Structures (from backend)
- **Competitor:** `{ id, user_id, url, name? }`
- **Report:** `{ competitor_id, user_id, delta, insight, classification, last_scan_time }`
- **Delta:** `{ changes: [{ type, tier, old_price?, current_price?, percent_change? }] }`

### UI States Not Backed by Logic
- Processing uses `setTimeout` (9s) → no real API call, no scan
- "View Report" in DashboardTab has no navigation target
- CompetitorsTab "Add Competitor" onSubmit only closes modal (no API)
- Report page has no route → navigates to 404
- Empty state vs populated state not driven by API data

### Critical Bug
- **`/report` route missing** – Processing navigates to `/report` but route is not defined → user hits NotFound

### Dead Code
- `Dashboard.tsx` – Empty state with Add Competitor; not used in routes (DashboardLayout used instead)

---

## 2. Authentication Audit

### Dashboard Protection
- ✅ Protected by `ProtectedRoute` (session required)
- ✅ Onboarding enforced (profile required before dashboard)

### API Call Gating
- ✅ Backend `requireAuth` middleware verifies JWT via Supabase `getUser()`
- ❌ Frontend never calls backend – no JWT passed to API
- ❌ No API client or `Authorization` header setup

### Onboarding
- ✅ Creates profile in `profiles` table
- ✅ Redirects to dashboard when profile exists
- Direct Supabase insert (no backend API)

---

## 3. Backend Status Audit

### Implemented
- **POST /api/scan** – Protected, runs full pipeline
- **Scan flow:** Bright Data → Parse → ActionBook fallback → Acontext snapshot → Diff → Gemini (if ≥5%) → Save report
- **Services:** supabase, brightdata, actionbook, parser, diff, acontext, gemini
- **Auth middleware:** JWT verification

### Missing
- **POST /api/competitors** – Create competitor (required before scan)
- **GET /api/competitors** – List competitor(s)
- **GET /api/reports** – List reports
- **GET /api/reports/:id** – Get single report

### Scope Violations
- None in backend – pipeline aligns with architecture

### Extra Endpoints
- None

### Early Overengineering
- None identified

---

## 4. API Usage Risk Audit

### Bright Data
- **Risk:** Called once per scan in controller ✓
- **Mitigation:** Single request per user-triggered scan
- **Fallback:** Direct axios if credentials missing (bypasses proxy)

### Gemini
- **Risk:** Only called when `hasSignificantChange` (delta ≥5%) ✓
- **Implemented in:** `diff.service.js` – `percentChange >= 5` triggers Gemini
- **Fallback:** Placeholder if API key missing

### Acontext
- **Usage:** `getLatestSnapshot`, `setLatestSnapshot` per user ✓
- **Fallback:** In-memory Map if API key missing
- **Risk:** No misuse identified

### Polling / Auto-Refresh
- ❌ None in frontend ✓
- Processing uses setTimeout, not polling ✓

---

## 5. Scope Alignment

### Implemented Outside MVP Scope
| Item | Location | MVP Rule Violated |
|------|----------|-------------------|
| Timeline tab | `TimelineTab.tsx` | No timeline storage |
| Historical Price Trend | `Report.tsx` | Only latest snapshot |
| Multi-competitor UI | `DashboardTab.tsx` (4 competitors) | Single competitor only |
| Competitors tab (multi) | `CompetitorsTab.tsx` | Single competitor |
| "3 of 5 competitors" | `DashboardLayout.tsx` | No multi-competitor |
| Frequency dropdown | `AddCompetitorModal.tsx` | No scheduling |
| Features URL field | `AddCompetitorModal.tsx` | Single pricing page only |

### Missing from MVP Scope
| Item | Status |
|------|--------|
| Competitor creation API | Not implemented |
| Frontend → Backend integration | Not implemented |
| Report fetching | Not implemented |
| Real scan trigger from UI | Not implemented |
| Single competitor enforcement in UI | Not implemented |
| Frontend scan cooldown | Not implemented |

### Critical Path Items Still Required
1. POST /api/competitors – Create competitor
2. Frontend API client with JWT
3. Add Competitor → API call → then navigate to Processing
4. Processing → POST /api/scan (with auth) → wait for response
5. Add /report route
6. Report → GET report data from API or scan response
7. Dashboard/Competitors → fetch single competitor from API

---

## 6. Implementation Priority Order

1. **POST /api/competitors** – Create competitor (name, url), enforce single competitor per user
2. **Add /report route** – Fix 404 when Processing completes
3. **Frontend API client** – Base URL, JWT from Supabase session, fetch wrapper
4. **Add Competitor flow** – Call POST /api/competitors, on success navigate to Processing with competitor id
5. **Processing flow** – Call POST /api/scan with JWT, await response, on success navigate to /report with report data
6. **Report page** – Accept report from location state or fetch GET /api/reports/latest
7. **Scope cleanup** – Remove Timeline tab, frequency field, features URL; enforce single competitor in UI
8. **Dashboard/Competitors** – Fetch competitor from GET /api/competitors, show empty state or single competitor

---

## 7. Risk Assessment

### Highest Technical Risk
- **Frontend-backend disconnect** – No API integration; demo will show mock flow only
- **Competitor creation missing** – Scan fails with "No competitor configured" (404)

### Highest Credit Burn Risk
- **Bright Data fallback** – Direct axios when credentials missing could hit rate limits or get blocked
- **No frontend cooldown** – User could spam scan if connected (mitigated by no integration)

### Demo Failure Risks
1. Add Competitor → Processing → Report shows 404 (no /report route)
2. Report shows empty tables (mock data)
3. No real scan ever runs from UI

### Mitigation Steps
1. Add /report route immediately
2. Implement POST /api/competitors
3. Wire Add Competitor → API → Processing → Scan API → Report with real data
4. Remove or hide Timeline, multi-competitor UI, frequency for demo

---

## 8. Data Model Mismatch

| Doc (Architecture.md) | Implementation |
|----------------------|----------------|
| `competitor_snapshots` table | `competitors` + `reports` tables |
| Single row overwrite (UPSERT) | Reports INSERT (new row per scan) |
| `target_url` | `url` in competitors |
| `snapshot_data` JSONB | Delta + insight in reports |

Backend uses `competitors` + `reports`. Docs reference `competitor_snapshots`. Schema alignment needed for clarity.

---

## Summary

| Category | Status |
|----------|--------|
| Frontend UI | Complete but disconnected |
| Auth | Complete |
| Backend scan pipeline | Complete |
| Competitor CRUD | Missing create |
| Report fetch | Missing |
| Frontend API integration | None |
| Scope violations | Timeline, multi-competitor, frequency, features URL |
| Critical bugs | /report route missing, no competitor creation |
