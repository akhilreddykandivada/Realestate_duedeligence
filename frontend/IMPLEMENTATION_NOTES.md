# Frontend implementation notes

The React frontend now includes:

- Professional property search dashboard
- Property details page
- Property history timeline
- Empty-history state
- Address validation page
- Google validation result with clean address and coordinates
- Login and registration pages
- JWT token handling
- Protected routes
- Responsive navigation and layouts

Run:

```bash
npm install
npm run dev
```

The Vite proxy sends `/api` requests to `http://localhost:8080`.

Optional production API base URL:

```env
VITE_API_BASE_URL=https://your-backend-host
```

## Session 3 frontend updates

- **History timeline**: `GET /history` now returns real `{date, label, description}` timeline entries (ownership/tax/permit based) instead of the old sync-event audit log - `PropertyDetails.jsx` updated accordingly.
- **Risk Assessment panel**: now has two modes - "Quick risk check" (fast, risk-only, unchanged) and "Generate full report" (new - runs the complete pipeline: risk assessment + comparables + timeline + executive summary + PDF/Excel export). Handles `FAILED` status with the backend's `failureReason`. Note the two endpoints return slightly different field names for the same concepts (`overallRiskScore` vs `riskScore`, `categories` vs `riskCategories`) - normalized in the component rather than assuming one shape.
- **New: `ComparablesPanel`** - sortable comparable listings (distance/price/listed date) + market trend stats (average price, average price/sqft, recency-weighted average).
- **New: `ValueHistoryPanel`** - simple bar chart of assessed value by year, reusing tax history data. Fails silently (renders nothing) rather than showing an error banner, since it's a supplementary chart, not core functionality.
- **My Reports** (Profile page): lists the current user's report history via `GET /api/reports?user={id}`, with PDF/Excel download buttons per completed report.
- **New in `api.js`**: `propertyApi.comparables/comparableTrends/valueHistory`, `reportApi.getReport/getUserReports/downloadPdf/downloadExcel`. Added a `downloadFile()` helper separate from the JSON `request()` helper, since PDF/Excel responses are binary blobs, not JSON.
