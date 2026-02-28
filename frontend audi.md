# Frontend Implementation Audit: "Signal" SaaS Dashboard

### 1. Pages / Views Implemented
- **Pages**:
  - `Landing.tsx`
  - `Register.tsx`
  - `Dashboard.tsx` (Empty state display)
  - `Processing.tsx` (Mock loading/processing sequence)
  - `Report.tsx` (Intelligence report viewer)
  - `Index.tsx`
  - `NotFound.tsx`
- **Layouts**:
  - `DashboardLayout.tsx` (Sidebar navigation and usage limits)
- **Modals**:
  - `AddCompetitorModal.tsx` (Form to configure competitor tracking)
- **Tabs (Dashboard Views)**:
  - `DashboardTab.tsx` (Summary dashboard view)
  - `CompetitorsTab.tsx` (Competitors list with search capability)
  - `ReportsTab.tsx`
  - `InsightsTab.tsx`
  - `TimelineTab.tsx`

### 2. User Actions That Trigger Backend Calls
- **Buttons / Actions**:
  - "Add Competitor" button in Dashboard and CompetitorsTab (Opens modal).
  - "View Report" inline text link in Alert Banner (`DashboardTab.tsx`).
- **Form Submissions**:
  - "Start Monitoring" submission in `AddCompetitorModal.tsx`.
- **Scan Triggers**:
  - Automatically triggered upon completing the add competitor form flow (currently simulates progress via timeouts in `Processing.tsx` before routing to `Report.tsx`).
- **Other Interactive Elements**:
  - Search input box in `CompetitorsTab.tsx` (client-side filter currently, potential backend text search).

### 3. Data Structures Expected From Backend

**Pricing Table (Array)**
```json
[
  {
    "tier": "String",
    "previous": "String",
    "current": "String",
    "change": "String"
  }
]
```

**Status Badge**
```json
{
  "status": "String (e.g., Strategic Shift)",
  "risk": "String (high | medium | low)",
  "direction": "String (up | down | neutral)",
  "priceDelta": "String (e.g., +25.1%)"
}
```

**Insight Panel**
```json
{
  "insight": "String",
  "confidenceText": "String",
  "impactText": "String"
}
```

**Competitor Object**
```json
{
  "id": "String",
  "name": "String",
  "status": "String",
  "risk": "String",
  "lastScan": "String",
  "priceDelta": "String",
  "direction": "String",
  "url": "String",
  "features": "Number",
  "pricing": "String"
}
```

**Scan Response (Report Payload)**
```json
{
  "competitorName": "String",
  "lastScanned": "String",
  "pricingData": [
    { "tier": "String", "previous": "String", "current": "String", "change": "String" }
  ],
  "featuresAdded": ["String"],
  "featuresRemoved": ["String"],
  "strategicInsight": "String",
  "recommendedActions": ["String"],
  "trendData": [
    { "month": "String", "starter": "Number", "pro": "Number", "enterprise": "Number" }
  ]
}
```

### 4. State Management
- **Loading states**: Handled locally via `setTimeout` queues traversing through visual steps (`Processing.tsx`).
- **Error states**: Not implemented (Missing UI for API failures, timeouts, validation errors).
- **Scan-in-progress state**: Maintained locally via a `currentStep` index traversing a static steps array (`Processing.tsx`).
- **Empty state**: Fully implemented in `Dashboard.tsx` with graphical placeholders when zero competitors are present.

### 5. Mock Data Locations
- **`src/pages/Report.tsx`**: Contains hardcoded paragraphs for "Strategic Insight", a static list of "Recommended Actions", and empty arrays for `pricingData`, `featuresAdded`, `featuresRemoved`, and `trendData`.
- **`src/components/dashboard/DashboardTab.tsx`**: Hardcoded array of `competitors`, static `miniPricing` array, and raw textual insights.
- **`src/components/dashboard/CompetitorsTab.tsx`**: Uses a static array structure (`competitors`).
- **`src/pages/DashboardLayout.tsx`**: Static usage gauge logic ("3 of 5 competitors").
- **`src/pages/Processing.tsx`**: Mock durations for simulated "AI Processing" steps.

### 6. API Integration Points
- **`AddCompetitorModal.tsx`**: `onSubmit` needs to pass data to a real API controller and `POST /api/scan` instead of static navigation routing.
- **`DashboardTab.tsx`**: Needs real-time `GET /api/dashboard/metrics` integration instead of static JSON constants.
- **`CompetitorsTab.tsx`**: Needs `GET /api/competitors` array mapping instead of local dummy arrays.
- **`Report.tsx`**: Needs a direct endpoint hook like `GET /api/reports/:id` upon rendering the parsed data.
- **`Processing.tsx`**: Must poll or subscribe to an active scan event instead of waiting statically. 

### 7. Strict Backend Contract
**Constraints:** Single competitor only, manual scan only, no polling, no multi-tenant. 

**Endpoint 1: Initiate Scan**
- **Method:** `POST /api/scan`
- **Request Payload:**
```json
{
  "competitorUrl": "String",
  "pricingUrl": "String",
  "featuresUrl": "String"
}
```
- **Response Формат (Synchronous, single manual execution):**
```json
{
  "status": "success",
  "data": {
    "competitorName": "String",
    "lastScanned": "String",
    "status": "String",
    "risk": "String",
    "direction": "String",
    "priceDelta": "String",
    "pricingData": [
      {
        "tier": "String",
        "previous": "String",
        "current": "String",
        "change": "String"
      }
    ],
    "featuresAdded": ["String"],
    "featuresRemoved": ["String"],
    "strategicInsight": "String",
    "recommendedActions": ["String"],
    "trendData": [
      {
        "month": "String",
        "starter": "Number",
        "pro": "Number",
        "enterprise": "Number"
      }
    ]
  }
}
```
