# Healthcare Database (app/healthcare-database/page.tsx)

## Purpose

This page provides a searchable, filterable directory of public healthcare listings: healthcare personnel, medical facilities, and agencies. It fetches listings from the server API (`/api/listings`) and displays results in categorized sections.

## Location

- App route: `app/healthcare-database/page.tsx`
- Doc: `docs/TechnicalGuides/architecture/healthcare_database.md`

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
  - Options: `All Countries`, `Turkey` (currently hard-coded list).
  - Behavior: Applies to personnel, facilities, and agencies (filters by `country` field).

- Province (select):
  - Options: `All Provinces`, `Istanbul`, `Ankara`, `Izmir`, `Bursa`, `Antalya`, `Adana`, `Gaziantep`, `Konya`, `Kayseri`, `Diyarbakır`.
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

## Filtering Logic Notes

- Personnel filter checks `name` and `specialization`, plus country, province, and specialization selections.
- Facilities and agencies filter by `name`, country, and province.
- Results are computed separately per-type and then summed for total results.

## Tips for Future Enhancements

- Populate `provinces` dynamically from the API or derived from country selection instead of hard-coding.
- Make `countries` and `provinces` configurable/dynamic from the API.
- Allow multi-select or more granular location filters.
- Add pagination or infinite scroll for large result sets.
- Add server-side filtering parameters to `/api/listings` to reduce client CPU and network usage.

## Related Files

- `app/healthcare-database/page.tsx` — UI implementation.
- `app/components/ListingCard.tsx` — card component used to render each result.
- `lib/supabase.ts` — conversion utilities like `convertDatabaseRow()`.
