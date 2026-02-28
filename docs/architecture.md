# Signal – Autonomous Competitive Intelligence Agent: Architecture

## 1. System Overview
Signal is a streamlined, user-triggered SaaS dashboard designed to provide immediate competitive intelligence. For the hackathon MVP, the system focuses strictly on monitoring a single competitor's pricing page. When initiated by the user, Signal fetches the latest data, compares it against the most recent snapshot stored in the database, and uses AI to generate strategic insights only if a material change (delta) is detected.

## 2. Architectural Principles
*   **Cost Efficiency First:** Zero passive background tasks. Expensive LLM and scraping APIs are only invoked when absolutely necessary (e.g., when a user clicks "Scan" and a structural delta is detected).
*   **Deterministic Flow:** The pipeline follows a strict, predictable A -> B -> C sequence. No autonomous loops, no auto-retries, no scheduled cron jobs.
*   **Strict Scope Control:** Limited to one competitor and one target URL (pricing page).
*   **No Unnecessary API Calls:** Heavy reliance on simple DOM/JSON diffing before waking up Gemini. Raw HTML is never sent to the LLM.
*   **Stateless Frontend:** The SaaS UI acts purely as a trigger and viewer, maintaining no long-term state.

## 3. High-Level Architecture Diagram
```text
[ User UI ] --(1. Click "Scan")--> [ API Server ] 
                                        |
                               (2. Check Cache/Rate Limits)
                                        |
                            +-----------v-----------+
                            | Bright Data / Scraping|
                            | (Fetch Pricing Page)  |
                            +-----------+-----------+
                                        |
                               (3. Cleaned JSON)
                                        |
                            +-----------v-----------+
                            |     Parsing Layer     |
                            | (Extract target data) |
                            +-----------+-----------+
                                        |
                                (4. Clean Data)
                                        |
                            +-----------v-----------+       (5. Fetch Prev
                            |     Delta Engine      | <----- Snapshot)
                            | (Compare with prior)  | ------ [ Supabase ]
                            +-----------+-----------+
                                        |
                             [Is there a material change?]
                              /                        \
                           YES                          NO
                           /                              \
          +---------------v---------------+         +------v------+
          |     Acontext Memory (Add)     |         | Return No   |
          |       (Update latest)         |         | Change      |
          +---------------+---------------+         +------+------+
                          |                                |
          +---------------v---------------+                |
          | Gemini Insight Engine         |                |
          | (Generates strategic insight) |                |
          +---------------+---------------+                |
                          |                                |
          +---------------v---------------+                |
          |       Supabase (Store)        | <--------------+
          | (Overwrite latest snapshot)   |
          +---------------+---------------+
                          |
[ User UI ] <--(6. Return fresh insights / status)--
```

## 4. Component Breakdown
*   **Frontend (SaaS Dashboard):** Static React/Next.js UI. Displays the "Scan" button, current pricing snapshot, and latest AI insights.
*   **API Layer (Node/Python):** The orchestration server. Exposes a single `/api/scan` endpoint that handles the synchronous flow from UI request to database storage.
*   **Bright Data Service (MCP):** The specialized web scraper. Triggered to fetch the raw DOM/JSON of the competitor's pricing page. ActionBook is fully bypassed unless specifically required to resolve a complex anti-bot captcha for the pricing page.
*   **Parsing Layer:** Strips out noise (CSS, scripts, nav headers) from the Bright Data response. Converts raw structural HTML into a clean, deterministic JSON schema (e.g., `[{"tier": "Basic", "price": 10}, ...]`).
*   **Delta Engine:** A lightweight, pure-code comparator. Takes the newly parsed JSON and compares it against the last known JSON snapshot from Supabase.
*   **Acontext Memory Layer:** Used strictly to inject the current snapshot contextual variables. Keeps the context window minimal.
*   **Gemini Insight Engine:** The LLM module. Receives *only* the structured delta (e.g., "Tier A changed from $10 to $15") and outputs a 2-3 sentence strategic insight on how to react to this specific competitor move.
*   **Supabase Persistence Layer:** Primary PostgreSQL database. Stores users and exactly one active snapshot row per user/competitor.

## 5. Data Flow (Step-by-Step Scan Flow)
1.  **Trigger:** User clicks "Force Scan" on the frontend.
2.  **Request:** HTTP POST to backend `/api/scan`.
3.  **Fetch:** Backend calls Bright Data to scrape the competitor's pricing URL.
4.  **Parse:** Backend parses the HTML to extract only relevant pricing nodes, structuring it into a JSON object.
5.  **Retrieve:** Backend fetches the single `latest_snapshot` row from Supabase.
6.  **Compare:** The Delta Engine compares the new JSON with the old JSON.
    *   *If no change:* Update `last_scanned_at` timestamp in Supabase. Return "No changes detected" to UI. Stop execution.
    *   *If change detected:* Proceed to Step 7.
7.  **Format:** Generate a text/JSON summary of the exact differences.
8.  **Analyze:** Send the summary of differences (not HTML) to Gemini, requesting strategic insights.
9.  **Store:** Overwrite the existing row in Supabase with the new snapshot JSON, the new timestamp, and the Gemini insight summary. Update Acontext with the new state.
10. **Respond:** Return the updated information to the frontend.

## 6. API Usage Control Strategy
*   **When Bright Data is called:** ONLY when the user explicitly clicks the "Scan" button. Capped via frontend rate-limiting (e.g., max 1 scan per hour per user).
*   **When Gemini is called:** ONLY if the Delta Engine detects a material difference (e.g., price change, new tier added). Bypassed completely if the page is identical or only cosmetic changes occurred.
*   **When ActionBook is used:** STRICTLY fallback. Only invoked if Bright Data returns a blocked/captcha response that requires dynamic browser interaction to resolve. Otherwise, unused to save time and compute.
*   **When Acontext is accessed:** Called only during a delta event to retrieve the very specific persona/competitor context needed for the prompt, avoiding passing huge context windows to Gemini.

## 7. Data Models

**Supabase Table: `competitor_snapshots`**
*   `id` (UUID, PK)
*   `user_id` (UUID, FK)
*   `competitor_name` (String) - Fixed to 1 competitor.
*   `target_url` (String)
*   `last_scanned_at` (Timestamp)
*   `snapshot_data` (JSONB) - The structured pricing data.
*   `latest_insight` (Text) - Output from Gemini.

**Snapshot JSON Structure**
```json
{
  "tiers": [
    { "name": "Starter", "price": 29, "features": ["1 User", "Basic Support"] },
    { "name": "Pro", "price": 99, "features": ["5 Users", "Priority Support"] }
  ]
}
```

**Delta JSON Structure (Sent to Gemini)**
```json
{
  "event": "price_change_detected",
  "changes": [
    { "tier": "Pro", "old_price": 79, "new_price": 99 }
  ]
}
```

## 8. Cost Optimization Strategy
*   **Caching Strategy:** Frontend enforces a cool-down period between scans to prevent abuse.
*   **Delta Threshold Logic:** Only literal changes in pricing amounts, tier names, or structural feature inclusions trigger the LLM. Cosmetic HTML changes (class names, div wrappers) are stripped out during the Parsing Layer.
*   **Skip-LLM Conditions:** If the delta is empty after parsing, the execution halts before the Gemini API is ever invoked.
*   **Single Snapshot Overwrite Logic:** We use an `UPSERT` model in Supabase. We do not insert new rows to build a history. We update the single existing row, saving database storage costs and preventing query complexity.

## 9. Failure Handling Strategy
*   **Scraping Failure (Bright Data timeout/block):** Catch error, return a graceful "Competitor site temporarily unavailable" message to the UI. Do not retry automatically.
*   **Parsing Failure (Site layout changed completely):** If the parser cannot find the expected DOM elements, it alerts the user: "Competitor layout changed. Manual review required." Does not trigger LLM.
*   **LLM Failure (Gemini timeout/rate limit):** Save the new snapshot to Supabase anyway so data is fresh. Return the basic numeric delta to the UI with a generic "Insights currently unavailable" message.
*   **Demo Fallback Mode:** In the event of a total network ban during the presentation, a local mock JSON response mimics the Bright Data return object to ensure the UI and Gemini pipeline can still be demonstrated.

## 10. Explicitly List Removed Features
*   **No multi-tenant logic:** Hardcoded to one primary user/account for the MVP.
*   **No timeline history:** No historical graphs or charting of past price changes.
*   **No auto scheduling:** No cron jobs or recurring background agents.
*   **No polling:** The system never actively polls the competitor site while the user is away.
*   **No long-term learning:** The LLM does not remember past insights or compound knowledge over time. It only sees the immediate delta event.

## 11. Final Production-Safe Scan Pseudocode

```python
def execute_manual_scan(user_id, target_url):
    # 1. Fetch current persistence layer data
    current_record = supabase.table("competitor_snapshots").select("*").eq("user_id", user_id).single()
    old_snapshot = current_record.get("snapshot_data", {})
    
    # 2. Execute Web Scrape
    try:
        raw_html = bright_data.fetch(target_url)
    except Exception as e:
        return {"status": "error", "message": "Failed to reach competitor site."}
        
    # 3. Deterministic Parsing (Strips noise)
    try:
        new_snapshot = custom_html_parser.extract_pricing_tiers(raw_html)
    except LayoutChangeException:
        return {"status": "error", "message": "Competitor structure changed."}
        
    # 4. Calculate Delta
    delta = delta_engine.compare(old_snapshot, new_snapshot)
    
    # 5. Check Threshold & Cost Control
    if not delta.has_material_changes():
        # Update timestamp only, save DB row, skip LLM
        supabase.table("competitor_snapshots").update({"last_scanned_at": now()}).eq("user_id", user_id)
        return {"status": "success", "message": "Scanned. No updates detected.", "data": new_snapshot}
        
    # 6. LLM Generation (Only if delta exists)
    try:
        prompt = f"Analyze this competitor pricing change and give a 2-sentence strategic recommendation: {delta.to_json()}"
        insight = gemini.generate_text(prompt)
    except Exception as e:
        insight = "AI insight generation failed. See raw changes."
        
    # 7. Persistence (Overwrite, no history)
    supabase.table("competitor_snapshots").update({
        "snapshot_data": new_snapshot,
        "latest_insight": insight,
        "last_scanned_at": now()
    }).eq("user_id", user_id)
    
    # 8. Return to UI
    return {
        "status": "success", 
        "message": "New pricing detected and analyzed.",
        "insight": insight,
        "data": new_snapshot
    }
```
