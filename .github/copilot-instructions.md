# Medikal Site AI Persona & Guidelines

## Big Picture Architecture
**Next.js 16 + Firebase 12** medical platform with a strict multi-step onboarding system.
- **Client Boundary**: All pages use `"use client"`. Firebase initialized in [app/layout.tsx](app/layout.tsx).
- **Core State Machine**: Managed by [app/components/SignupFlowManager.tsx](app/components/SignupFlowManager.tsx). All requests pass through status checks:
  `pending_gdpr` → `pending_role` → `pending_personal_data` (for pro roles) → `active`.
- **Data Encapsulation**: 
  - `users/{uid}`: Private profile + credentials. Managed by the user.
  - `healthcare_personnel_listings`, `medical_facility_listings`, `agency_listings`: Public records. **Admin-only write**. Linked to user docs via `listingId`.
  - **Two-Way Linking**: All user↔listing connections are bidirectional and automatically synchronized. When linking from either modal (user or listing), both documents are updated automatically.
  - **Account Data Naming**: All role-specific user data uses the `XxxAccountData` pattern (e.g., `healthcarePersonnelAccountData`, `patientAccountData`, `agencyAccountData`). This convention applies to both user entities AND business entities for semantic consistency.
- **RBAC**: 5 roles (`patient`, `healthcare_personnel`, `medical_facility`, `agency`, `admin`). Access controlled via `<ProtectedRoute>` and [middleware.ts](middleware.ts).

## Critical Workflows
- **Onboarding**: Google Login → [GDPRConsent.tsx](app/components/GDPRConsent.tsx) → [Role Selection](app/signup/role-selection/page.tsx) → Role-Specific Forms.
- **Support Tickets**: Authenticated users create tickets in `support_tickets`. Admins respond via the admin dashboard.
- **Treatment Plans**: Patients submit plans tagged with [MedicalProcedureType](lib/types.ts). Doctors with matching tags can read/respond.

## Coding Patterns
### 1. Unified Logging
Always use emoji prefixes for console output:
- 👤 `[PROFILE]` or `[USER_CRUD]` - User data / Firestore sync
- 📋 `[LISTING_CRUD]` - Public listing operations
- 🔗 `[LINK]` - User-listing linking
- 🔐 `[AUTH]` - Auth status / Redirects
- 🎭 `[SIGNUP_FLOW]` - Onboarding state transitions
- 📋 `[GDPR]` - Consent status
- ✅/🚫/⚠️ - Success / Error / Warning

### 2. Firestore Data Handling
- **Timestamps**: Always convert using `convertTimestampsToDates` from [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx).
- **Security**: Never update `listingId` fields from the client (locked by rules).
- **Two-Way Linking**: When linking user↔listing in admin modals, the system automatically updates both sides. Trust the automatic sync - don't manually update both documents.

### 3. Protected Components
Wrap sensitive UI with `<ProtectedRoute requiredRole="admin">`. Always Destructure `loading` from `useAuth()` to prevent layout flickering.

### 4. Admin Modal Architecture
- **UserCRUDModal**: Single universal modal for ALL user database operations (all roles). Dynamically adapts based on user role.
- **Listing CRUD Modals**: Separate specialized modals for public listings:
  - `HealthcarePersonnelListingCRUDModal`
  - `MedicalFacilityListingCRUDModal`
  - `AgencyListingCRUDModal`
- See [docs/MODAL_ARCHITECTURE.md](docs/MODAL_ARCHITECTURE.md) for complete details.

## Key Files
- [lib/types.ts](lib/types.ts) - Source of truth for roles, statuses, and specializations.
- [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) - Firebase Auth + Profile management logic.
- [firebase/firestore.rules](firebase/firestore.rules) - Defines document-level permissions.
- [app/components/SignupFlowManager.tsx](app/components/SignupFlowManager.tsx) - Global redirect logic.
- [docs/MODAL_ARCHITECTURE.md](docs/MODAL_ARCHITECTURE.md) - Admin modal architecture and usage patterns.

