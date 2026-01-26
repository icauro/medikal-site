# Copilot Instructions for Medikal Portal

## Project Overview
Medikal Portal is a Next.js 16+ healthcare directory platform specializing in plastic surgery, dermatology, hair restoration, and dental treatments. It features medical facilities, healthcare personnel, patient reviews, and support ticketing with Supabase as the backend.

**Stack**: Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS 4, Vitest

---

## Architecture Patterns

### 1. Next.js App Router + React Server Components
- Use `app/` directory structure with route-based layouts
- Root layout wraps all pages with: `AuthProvider` → `SignupFlowManager` → `Navbar`, `ToastContainer`, `main`, `Footer`
- Client components require `"use client"` directive at top

### 2. Authentication & User Roles
- **Context-based**: `AuthContext` in [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) manages user state globally
- **Role hierarchy**: `patient`, `healthcare_personnel` (admin-only), `medical_facility`, `agency`, `admin`
- **Account status flow**: `pending_gdpr` → `pending_role` → `pending_personal_data` → `pending_verification` → `active` (or `suspended`)
- **Admin bypass**: Admin users (`role: 'admin'`) bypass most status checks; use carefully in `ProtectedRoute`
- Access control: `ProtectedRoute` component wraps pages requiring auth; pass `requiredRole` prop to restrict by role

### 3. Supabase Integration
- **Client initialization**: [lib/supabase.ts](lib/supabase.ts) with session persistence and auto token-refresh
- **Critical conversion utilities**:
  - `convertDatabaseRow()`: Converts snake_case DB fields to camelCase + parses date ISO strings
  - `convertToSnakeCase()`: Converts camelCase JS objects back to snake_case for DB inserts
  - Always use these when reading/writing to Supabase to avoid type mismatches
- **Row-level security (RLS)**: Database enforces policies per role; API routes must set auth headers correctly

### 4. Type System
- **Centralized constants**: [lib/constants.ts](lib/constants.ts) defines all enums (procedures, roles, statuses, etc.) as `const` arrays
- **Type derivation**: [lib/types.ts](lib/types.ts) derives TypeScript types from constants using `typeof` for type safety
- Example: `type MedicalSpecialization = typeof MEDICAL_SPECIALIZATIONS[number]` ensures types stay in sync with constants

### 5. Component Patterns
- **Client components** (`"use client"`): Use `useAuth()` hook to access `user`, `userProfile`, `loading`
- **Shared components**: [app/components/](app/components/) includes reusable UI (Navbar, Footer, ProtectedRoute, Toast, etc.)
- **Form components**: SignupFlowManager handles multi-step signup flow; ToastContainer displays notifications
- **Testing**: Use Vitest + React Testing Library; test files co-locate with components (e.g., `Footer.test.tsx`)

---

## Critical Developer Workflows

### Setup & Development
```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server on http://localhost:3000
npm run build               # Build for production
npm run start               # Run production server
npm run lint                # Run ESLint (eslint.config.mjs)
npm run test                # Run tests with Vitest
npm run test:ui             # Open Vitest UI for interactive testing
```

### Environment Configuration
- Required env vars in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated, triggers auto-admin on signup)
- Supabase client gracefully handles missing vars during build with placeholder values (fails at runtime if not set)

### Testing Patterns
- **Vitest config**: [vitest.config.ts](vitest.config.ts) uses jsdom environment, React plugin, alias `@` to root
- **Setup**: [vitest.setup.ts](vitest.setup.ts) initializes testing library globals
- **Structure**: `import { describe, it, expect } from 'vitest'` and `import { render, screen } from '@testing-library/react'`
- Run focused tests: `npm run test -- fileName.test.tsx`

---

## Project-Specific Conventions

### 1. Data Transformation
- **Always call conversion utilities**: When fetching from Supabase, pipe results through `convertDatabaseRow()` before using in components
- **Database → JS**: snake_case becomes camelCase; ISO date strings become Date objects
- **JS → Database**: Use `convertToSnakeCase()` before `.insert()` or `.update()` calls
- Failing to convert causes silent type mismatches and runtime errors

### 2. Slug-based Routes
- [lib/utils.ts](lib/utils.ts) exports `generateSlug()` using `slugify` package
- Used for agency routes (`/agencies/[slug]`), facility routes (`/medical-facilities/[slug]`), personnel routes
- Always match slugs exactly in database queries

### 3. Constants Over Magic Strings
- Never hardcode status values, role names, or procedure names
- Import from [lib/constants.ts](lib/constants.ts) and [lib/types.ts](lib/types.ts) instead
- Example: `role: 'patient'` → `role: USER_ROLES[0]` or use `UserRole` type for validation

### 4. Logging Convention
- Use emoji-prefixed console logs for debugging (e.g., `🔍`, `👤`, `💾`, `🚫`, `👑`, `📝`)
- Includes structured data for tracing: `console.log('🔍 [SCOPE] Message', { var1, var2 })`
- Helps debugging without adding logging library dependencies

### 5. Protected Routes & Status Checks
- `ProtectedRoute` component handles auth + status validation automatically
- Pass `allowPendingPersonalData={true}` only for profile/data-entry pages where users need to update pending info
- Admin users bypass all status checks by design (use with caution in sensitive routes)

---

## Database Architecture

### Key Tables & RLS Policies
- **users**: Core user profiles, roles, account status
- **medical_facilities**: Facilities with location, type, procedures offered
- **medical_facility_users**: Link table between users and facilities (for facility admins)
- **healthcare_personnel**: Doctors and coordinators
- **comments**: User reviews on facilities (soft delete via `is_deleted` flag)
- **treatment_plans**: Patient treatment summaries with status tracking
- **tickets**: Support tickets with priority/category tracking

### RLS Enforced
- Policies check `auth.uid()` and custom claims (role stored in JWT)
- Some tables allow only role-specific reads/writes (e.g., admins can update all users)
- API routes in [app/api/](app/api/) must include Supabase auth headers for policy enforcement

---

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| Type mismatches between DB and JS | Use `convertDatabaseRow()` when fetching, `convertToSnakeCase()` when writing |
| Status checks blocking valid transitions | Check the status flow in AuthContext; use `allowPendingPersonalData` in ProtectedRoute if needed |
| "user not found" errors despite auth | Ensure user profile is created in `users` table during signup |
| Environment vars undefined in API routes | Always check `.env.local` has NEXT_PUBLIC_* vars; restart dev server after changes |
| Slug route mismatch 404s | Verify `generateSlug()` output matches database records exactly |
| Admin override not working | Admin role is `'admin'` not `'admin_user'`; check `USER_ROLES` constant |

---

## File Navigation Guide

| Purpose | File |
|---------|------|
| Global auth state & user profile mgmt | [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) |
| Supabase client + conversion utilities | [lib/supabase.ts](lib/supabase.ts) |
| All TypeScript types & type-safe constants | [lib/types.ts](lib/types.ts), [lib/constants.ts](lib/constants.ts) |
| Validation, slugs, date formatting | [lib/utils.ts](lib/utils.ts) |
| Route protection & role checks | [app/components/ProtectedRoute.tsx](app/components/ProtectedRoute.tsx) |
| Toast notifications system | [app/components/Toast.tsx](app/components/Toast.tsx) |
| Multi-step signup flow | [app/components/SignupFlowManager.tsx](app/components/SignupFlowManager.tsx) |
| API endpoints | [app/api/](app/api/) (debug, listings, upload-facilities, auth callback) |
| Database schema & migrations | [supabase/migrations/](supabase/migrations/) |

---

## Next Steps for Agents
1. Read [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) first to understand user flow
2. Consult [lib/types.ts](lib/types.ts) + [lib/constants.ts](lib/constants.ts) for valid enum values
3. Use `convertDatabaseRow()` + `convertToSnakeCase()` when touching Supabase queries
4. Run `npm run test` before committing to validate components
5. Check database migrations in [supabase/migrations/](supabase/migrations/) to understand schema evolution
