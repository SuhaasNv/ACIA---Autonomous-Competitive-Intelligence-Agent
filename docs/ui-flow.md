# UI State & Flow Map: Signal MVP

## 1. Global Layout Structure
- **Sidebar**: Fixed left. Contains primary navigation (Dashboard, Settings, Docs).
- **Top Nav**: Fixed top. Contains user profile dropdown, active workspace indicator.
- **Main Workspace**: Scrollable content area for active page views.

## 2. Page-Level UI Flow

### A) Landing Page
- **Hero Animation**: Simple CSS-based fade-in text and mock UI graphics.
- **CTA Behavior**: "Get Started" button navigates directly to Registration Page.

### B) Registration Page
- **Form Submission Behavior**: Standard email/password input. Disables button and shows spinner on submit.
- **Redirect Logic**: On 200 OK from authentication, redirects to Dashboard (Empty State).

### C) Dashboard (Empty State)
- **Add Competitor Button Behavior**: Primary CTA "Analyze Competitor" centered on screen. Clicks open the Add Competitor Modal.

### D) Add Competitor Modal
- **Form Validation**: Requires valid URL and company name. Submit button disabled until valid.
- **On Submit → API Call**: Triggers `POST /api/scan`.
- **Loading State Handling**: Modal transitions to Processing State UI upon successful submission.

### E) Processing State UI
- **Step Animation Sequence**: Static 3-step list (1. Scraping data, 2. AI Analysis, 3. Generating report) with CSS pulsing dot indicating current step.
- **Prevent Double-Trigger**: Modal cannot be dismissed; underlying dashboard is heavily dimmed and inert.
- **Error Handling State**: If `POST /api/scan` fails, shows red error banner within modal and a "Try Again" button.

### F) Intelligence Report View
- **Pricing Delta Table**: Static CSS grid displaying scraped pricing vs. user pricing.
- **Status Badge Logic**: Green/Yellow/Red pills indicating threat level derived from initial scan data.
- **Strategic Insight Panel**: Markdown-rendered block for AI findings.
- **No-Change State UI**: Muted text indicating "No significant changes detected" if delta is zero.

## 3. UI State Management
- **Loading States**: Scoped spinners on buttons; overlay loader for full-page transitions.
- **Error States**: Inline red text for form errors; toast notifications for global API failures.
- **Scan In Progress State**: Dedicated modal takeover (Processing State UI).
- **Success State**: Toast notification + immediate progression to Intelligence Report View.
- **No-Change State**: Specific report variation when scan yields no actionable intelligence.

## 4. Disabled Interactions
- **Prevent Multiple Scan Clicks**: Submit buttons aggressively disabled (`disabled` attribute, `pointer-events: none`) immediately on click.
- **Disable Scan During Processing**: "Add Competitor" CTA removed or disabled while a scan is active.

## 5. API Interaction Map
- `POST /auth/register` → Called from Registration Page.
- `GET /api/competitors` → Called on Dashboard load (populates empty state or report view).
- `POST /api/scan` → Called from Add Competitor Modal.
- **Never Call APIs**: Landing Page, Processing State UI (no polling), No-change State.

## 6. Explicit UI Constraints
- **No polling**: Scan request is a single long-lived promise or standard fetch.
- **No auto-refresh**: Dashboard only updates on manual page reload or explicit user action.
- **No real-time websocket**: All data delivered via standard HTTP response.
- **No historical browsing**: Report view shows only the single most recent scan result.

## 7. Final UI-State Flow Summary (Step-by-Step)
1. User lands on Landing Page → Clicks "Get Started".
2. User submits Registration Page form → Redirects to Dashboard.
3. User sees Empty Dashboard → Clicks "Add Competitor".
4. User fills Add Competitor Modal → Clicks "Scan".
5. UI locks into Processing State UI → Waits for `POST /api/scan` response.
6. On success: Modal closes → UI renders Intelligence Report View.
7. User reviews static Report View (Pricing Delta, Insights). Navigation stops here until manually initiated again.
