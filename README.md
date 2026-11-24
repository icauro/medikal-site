# Medikal

A healthcare directory for Turkey — find hospitals, clinics, doctors and agencies, review them, and manage
listings through a role-based admin panel.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Supabase**
(auth + Postgres + RLS) and **Cloudflare R2** for image storage.

## Features

- Healthcare database with province/district filtering and full-text search
- Facility, personnel and agency listing pages with reviews, ratings and comments
- Treatment plans, blog, legal pages
- Role-based access: `patient`, `healthcare_personnel`, `medical_facility`, `agency`, `admin`
- Authenticated image upload (profile pictures, review and facility photos) to R2
- Admin panel: user management, listing moderation, approval flows
- Unit and component tests with Vitest + Testing Library

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in your own values
npm run dev                    # http://localhost:3000
```

### Environment

All required variables are documented in [`.env.example`](.env.example). Two rules:

- `NEXT_PUBLIC_*` ends up in the browser bundle — only public values belong there.
- `SUPABASE_SECRET_KEY` and the R2 secret are server-side only. Never prefix them with `NEXT_PUBLIC_`.

`NEXT_PUBLIC_R2_PUBLIC_URL` is the **public read** URL (`https://pub-….r2.dev` or a custom domain), not the
S3 API endpoint `https://<account-id>.r2.cloudflarestorage.com`.

### Database

SQL lives in `supabase/migrations/` (schema, RLS policies, role tables). With the Supabase CLI:

```bash
supabase start
supabase db push
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run test` / `npm run test:ui` | Vitest (watch / UI) |

## Data note

`public/merged_medical_facilities.json` — the bulk facility dataset used for name/address autocomplete in the
admin listing form — is **not part of this repository**. The admin form degrades gracefully without it. If you
have a licensed copy, drop it at that path locally; it is gitignored.

## Documentation

- `_docs/` — architecture, database, R2 storage and setup guides
- `DEBUG_LOGGING.md` — logging levels and `DEBUG` namespaces
- `AGENTS.md` — coding-convention notes for AI agents

## License

[MIT](LICENSE)
