# Medikal Site AI Persona & Guidelines

## Big Picture Architecture
**Next.js 16 + Firebase 12** medical platform with a strict multi-step onboarding system.
- **Client Boundary**: All pages use `"use client"`. Firebase initialized in [app/layout.tsx](app/layout.tsx).
- **Core State Machine**: Managed by [app/components/SignupFlowManager.tsx](app/components/SignupFlowManager.tsx). All requests pass through status checks:
  `pending_gdpr` → `pending_role` → `pending_personal_data` (for pro roles) → `active`.
- **Data Encapsulation**: 
  - `users/{uid}`: Private profile + credentials. Managed by the user.
  - `open_healthcare_personnel_data`, `open_medical_facility_data`, `open_agency_data`: Public records. **Admin-only write**. Linked to user docs via `openDataId`.
- **RBAC**: 5 roles (`patient`, `healthcare_personnel`, `medical_facility`, `agency`, `admin`). Access controlled via `<ProtectedRoute>` and [middleware.ts](middleware.ts).

## Critical Workflows
- **Onboarding**: Google Login → [GDPRConsent.tsx](app/components/GDPRConsent.tsx) → [Role Selection](app/signup/role-selection/page.tsx) → Role-Specific Forms.
- **Support Tickets**: Authenticated users create tickets in `support_tickets`. Admins respond via the admin dashboard.
- **Treatment Plans**: Patients submit plans tagged with [MedicalProcedureType](lib/types.ts). Doctors with matching tags can read/respond.

## Coding Patterns
### 1. Unified Logging
Always use emoji prefixes for console output:
- 👤 `[PROFILE]` - User data / Firestore sync
- 🔐 `[AUTH]` - Auth status / Redirects
- 🎭 `[SIGNUP_FLOW]` - Onboarding state transitions
- 📋 `[GDPR]` - Consent status
- ✅/🚫/⚠️ - Success / Error / Warning

### 2. Firestore Data Handling
- **Timestamps**: Always convert using `convertTimestampsToDates` from [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx).
- **Security**: Never update `openDataId` fields from the client (locked by rules).

### 3. Protected Components
Wrap sensitive UI with `<ProtectedRoute requiredRole="admin">`. Always Destructure `loading` from `useAuth()` to prevent layout flickering.

## Key Files
- [lib/types.ts](lib/types.ts) - Source of truth for roles, statuses, and specializations.
- [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) - Firebase Auth + Profile management logic.
- [firebase/firestore.rules](firebase/firestore.rules) - Defines document-level permissions.
- [app/components/SignupFlowManager.tsx](app/components/SignupFlowManager.tsx) - Global redirect logic.

