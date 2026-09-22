# Real Estate Due Diligence Agent — React Frontend

Connects to the Spring Boot backend (Session 1 + Session 2) via Vite's dev proxy.

## Pages / features

1. User registration, login (JWT)
2. Property search by address, full property list
3. Property details, with 6 due-diligence checks:
   - Ownership, Tax history, Zoning (ATTOM + Regrid)
   - Flood zone (FEMA NFHL), Permits (Shovels.ai), Environmental (EPA Envirofacts)
   - "Run all checks" fires the backend's parallel `/due-diligence` aggregation
     endpoint in ONE call instead of six separate requests
4. Property history timeline
5. Utility information — full CRUD (add/edit/delete), each record stamped
   with who entered it
6. Risk assessment — runs all 6 weighted risk strategies, shows the overall
   score, executive summary, and a per-category breakdown with score bars
7. My Account (Profile) — view/edit name+email, change password, see
   properties linked to your account
8. Address validation tool (Google Geocoding, falls back to Nominatim
   automatically)

## Backend endpoints used

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`

### Property
- GET `/api/properties`
- GET `/api/properties/search?address=...`
- GET `/api/properties/{id}`
- GET `/api/properties/{id}/history`
- POST `/api/properties/validate_address`
- GET `/api/properties/{id}/ownership`
- GET `/api/properties/{id}/tax-history`
- GET `/api/properties/{id}/zoning`
- GET `/api/properties/{id}/flood-zone`
- GET `/api/properties/{id}/permits`
- GET `/api/properties/{id}/environmental`
- GET `/api/properties/{id}/due-diligence` (all 7 sections in parallel)

### Utilities
- POST `/api/properties/{id}/utilities`
- GET `/api/properties/{id}/utilities`
- PUT `/api/properties/{id}/utilities/{utilityId}`
- DELETE `/api/properties/{id}/utilities/{utilityId}`

### Reports / risk assessment
- POST `/api/properties/{id}/reports`
- POST `/api/properties/{id}/risk-assessment`

### My Account
- GET `/api/users/me`
- PUT `/api/users/me`
- PUT `/api/users/me/password`
- GET `/api/users/me/properties`

## Registration roles

The backend does not allow ADMINISTRATOR to be self-registered, so the
frontend only offers: `BUYER`, `REAL_ESTATE_AGENT`, `LEGAL_REVIEWER`,
`FINANCIAL_INSTITUTION`.

## Run

Start the Spring Boot backend first on `http://localhost:8080`, then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Important

Passwords are BCrypt-hashed and never stored/shown in plaintext by this
frontend. The backend's `DataSeeder` creates a default administrator
(`admin@realestateapp.com` / `Admin@123` on first seed only — if that row
already existed, the seeder doesn't touch its password).

## Testing order

1. Register a BUYER, log in, confirm name/role shows in the header.
2. List properties, search by address, open a property's details page.
3. Click "Run all checks" — confirm all 6 check cards populate from one
   aggregate call (or show a clear error per section if a key like
   `SHOVELS_API_KEY`/`REGRID_API_TOKEN` isn't configured on the backend).
4. Add a utility record, edit it, delete it.
5. Run the risk assessment, confirm 6 category cards + overall score render.
6. Open My Account, change your name/email, change your password, log out,
   log back in with the new password.
