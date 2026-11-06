# Healthcare Database (app/healthcare-database/page.tsx)

## Purpose
 
This page provides a searchable, filterable directory of public healthcare listings: healthcare personnel, medical facilities, and agencies. It fetches listings from the server API (`/api/listings`) and displays results in categorized sections.

## Location

- App route: `app/healthcare-database/page.tsx`
- Doc: `_docs/TechnicalGuides/architecture/healthcare_database.md`

## Data Source

- Fetches from server endpoint: `/api/listings` (public, no auth required).
- Rows are converted with `convertDatabaseRow()` before use.

## UI Overview

- Header with title and short description.
- Search input (free-text).
- Four filter controls in a responsive grid (Type, Country, Province, Specialization).
- Results summary (total count).
- Results grouped by type: Medical Facilities, Healthcare Personnel, Agencies. Each group shows cards via `ListingCard`.

## Filtering Options

- Search (free-text):
  - Placeholder: "Search by name, specialization, or location..."
  - Behavior: For personnel, matches `name` and `specialization`; for facilities and agencies, matches `name`.

- Type (select):
  - Options: `All Types`, `Healthcare Personnel`, `Medical Facilities`, `Agencies`.
  - Behavior: Controls which categories are shown. `All` shows all three categories.

- Country (select):
  - Options: Dynamically loaded from `country-state-city` library via `COUNTRIES` constant (200+ countries).
  - Behavior: When country is selected, provinces are dynamically loaded for that country. Applies to personnel, facilities, and agencies (filters by `country` field).

- Province (select):
  - Options: Dynamically loaded from `country-state-city` library's `State.getStatesOfCountry()` based on selected country.
  - Resets automatically when country selection changes.
  - Behavior: Applies to personnel, facilities, and agencies (filters by `province` field).

- Specialization (select):
  - Options: `All Specializations`, `Cardiology`, `Dermatology`, `Neurology`, `Orthopedics`, `Pediatrics`, `Oncology`, `General Practice`.
  - Behavior: Applies to personnel only (matches `specialization`).

## Client State

- `searchQuery`: string
- `filterType`: `"all" | "personnel" | "facilities" | "agencies"`
- `filterCountry`: string
- `filterProvince`: string
- `filterSpecialization`: string

## Implementation Details

- Countries and provinces are fetched from the `country-state-city` library (imported via `COUNTRIES` constant and `State` class).
- Country dropdown defaults to "Turkey" on mount for better UX.
- When country selection changes, provinces are recomputed and province filter is automatically reset to avoid conflicts.
- All filtering happens client-side for immediate feedback; consider server-side filtering for larger datasets.

- Personnel filter checks `name` and `specialization`, plus country, province, and specialization selections.
- Facilities and agencies filter by `name`, country, and province.
- Results are computed separately per-type and then summed for total results.

## Tips for Future Enhancements

- Cache provinces at module level or use `useMemo` to avoid recalculating on every render.
- Add a "Reset Filters" button for user convenience.
- Consider implementing server-side filtering to improve performance with large datasets.
- Add pagination or infinite scroll for large result sets.
- Allow multi-select filters for more granular search capabilities.

## Related Files

- `app/healthcare-database/page.tsx` — UI implementation.
- `app/components/ListingCard.tsx` — card component used to render each result.
- `lib/constants.ts` — `COUNTRIES` constant imported from `country-state-city`.
- `lib/supabase.ts` — conversion utilities like `convertDatabaseRow()`.
