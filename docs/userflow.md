# ACIA - Autonomous Competitive Intelligence Agent: User Flow

## 1. User Personas

*   **SaaS Founder:** Needs quick, high-level insights on competitor pricing or positioning shifts to adjust their own strategy without dedicating hours to research.
*   **Product Manager:** Requires specific details on what changed in a competitor's offering (e.g., a new tier, removed feature) to inform product roadmap and sales enablement.

## 2. Primary User Journey

**Landing → Registration → Dashboard → Add Competitor → Scan → View Report**

1.  **Landing:** User visits the Signal landing page, understanding the value proposition (instant competitive delta).
2.  **Registration/Login:** User authenticates via Supabase Auth.
3.  **Dashboard (Empty State):** User sees an empty list of competitors.
4.  **Add Competitor:** User clicks "Add", inputs a single competitor URL (specifically a pricing page).
5.  **Scan Context:** User clicks "Scan Now".
6.  **Results:** User views the generated intelligence report detailing any material changes since the last snapshot.

## 3. Detailed Step-by-Step Flow

### A. Dashboard & Competitor Management
*   **What user sees:** A dashboard with a list containing a maximum of *one* competitor. An "Add Competitor" button (disabled if one exists).
*   **What system does:** Fetches competitor profile from Supabase.
*   **APIs triggered:** Supabase (Fetch `competitors` table).

### B. Triggering a Scan
*   **What user sees:** A "Scan Now" button next to the competitor URL. Clicking it shows a loading state (e.g., "Analyzing...").
*   **What system does:** Initiates the manual scan workflow.
*   **APIs triggered:** Next.js API route (`/api/scan`).

### C. Viewing Results
*   **What user sees:** A detailed report showing "Strategic Shifts" and "Material Changes" (if any), or a "No Strategic Shift" message.
*   **What system does:** Fetches the latest report from the database.
*   **APIs triggered:** Supabase (Fetch `reports` table).

## 4. Scan Flow (Strict)

This flow is executed when the user explicitly clicks the "Scan Now" button.

1.  **Trigger:** User clicks "Scan Now" (Button click triggers backend `/api/scan`).
2.  **Scrape:** System calls Bright Data Web Unlocker API to fetch the current HTML of the competitor's pricing page.
3.  **Parse:** System parses the raw HTML into standardized Markdown using utility functions.
4.  **Retrieve Snapshot:** System queries Acontext for the most recent text snapshot of this specific URL.
5.  **Compute Delta:** System performs a strict diff/distance comparison between the new Markdown and the historical Acontext snapshot.
6.  **Conditional Intelligence:**
    *   *Condition:* Is the delta material (above the threshold)?
    *   *Action:* If YES, call Gemini AI API to analyze the diff and generate a structured strategic report.
7.  **Overwrite Snapshot:** System updates the Acontext document with the newly parsed Markdown (overwriting the old one, retaining no timeline history).
8.  **Save Report:** System saves the resulting data (either the AI report or the "No Change" status) to the Supabase `reports` table.
9.  **Return Context:** Backend returns the structured response to the frontend to update the UI.

## 5. No-Change Flow

When the `Compute Delta` step determines the changes are immaterial (e.g., just timestamp updates or minor class name changes):

1.  **Skip Gemini:** The system explicitly *does not* call the Gemini AI API to save costs.
2.  **Update Status:** The system generates a standard "No Strategic Shift" payload.
3.  **Save & Return:** The status is saved to Supabase and returned to the frontend.

## 6. Error Flow

The system gracefully handles failures at each integration point:

*   **Scraping Failure (Bright Data):**
    *   *Cause:* Target site blocked the request, timeout, or invalid URL.
    *   *Action:* Log error, return a specific error to the UI ("Could not reach competitor site. Try again later.").
*   **Parsing Failure:**
    *   *Cause:* Unexpected HTML structure that breaks the Markdown converter.
    *   *Action:* Log error, return error to UI ("Failed to process site content.").
*   **LLM Failure (Gemini):**
    *   *Cause:* Rate limit exceeded, API down.
    *   *Fallback Mode:* Return a "raw diff" highlighting the changed text without strategic AI analysis, informing the user that AI analysis is temporarily unavailable.

## 7. Explicitly List What User Cannot Do

To maintain MVP scope, the following actions are strictly prohibited or unsupported:

*   **Cannot** add multiple competitors (limited to 1).
*   **Cannot** add multiple URLs per competitor (limited to 1 pricing page).
*   **Cannot** schedule automatic or recurring scans.
*   **Cannot** view historical timelines or past versions of the competitor site (only the latest delta).
*   **Cannot** edit or manually manipulate snapshots.
*   **Cannot** view the raw HTML or raw scraped data.

## 8. State Diagram (Simple ASCII)

```text
[Idle/Dashboard]
       |
       | (Click "Scan Now")
       v
[Scraping URL via Bright Data]
       |
       | (Success)
       v
[Parsing HTML to Markdown]
       |
       | (Success)
       v
[Fetching Last Snapshot from Acontext]
       |
       v
[Computing Text Delta]
       |
       +-------------------------------+
       |                               |
(Delta > Threshold)             (Delta < Threshold)
       |                               |
       v                               v
[Calling Gemini for Analysis]   [Set Status: "No Change"]
       |                               |
       +---------------+---------------+
                       |
                       v
       [Updating Acontext with New Snapshot]
                       |
                       v
          [Saving Result to Supabase]
                       |
                       v
                 [Idle/Dashboard]
```
