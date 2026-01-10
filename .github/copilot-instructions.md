# Copilot Instructions for Medikal Site

## Project Overview
**Next.js 16 medical directory** for Plastic Surgery & Dermatology specialists with Firebase backend.

**Stack**: Next.js 16 (App Router), React 19, Firebase 12, TypeScript, Tailwind CSS 4  
**Features**: Doctor search, Google OAuth with RBAC (patient/doctor/admin), verification system, support tickets

## Architecture

### Client-Server Boundary
- All pages use `"use client"` (Next.js App Router requirement for Firebase client SDK)
- Firebase client initialized globally in [app/layout.tsx](app/layout.tsx#L5)
- Admin SDK in [lib/firebase-admin.ts](lib/firebase-admin.ts) (⚠️ not used for auth yet—requires service account)

### Authentication Flow
1. **Google OAuth** via [lib/firebase.ts](lib/firebase.ts): `signInWithPopup(auth, googleProvider)`
2. **Auto-role assignment** in [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx#L82): Checks `NEXT_PUBLIC_ADMIN_EMAILS` env var, defaults to `patient`
3. **User profile creation**: Firestore `users/{uid}` doc auto-created on first login
4. **Protected routes**: Wrap components with `<ProtectedRoute requiredRole="admin">` from [app/components/ProtectedRoute.tsx](app/components/ProtectedRoute.tsx)

### Firestore Data Model
```
doctors/{id}          → Public profiles (⚠️ currently open write access)
users/{uid}           → UserProfile with role + DoctorInfo/PatientInfo/AdminInfo
verification_requests → Doctor credential submissions (doctor create, admin approve)
support_tickets       → User support (owner + admin access)
reviews/{id}          → Doctor ratings (authenticated write)
clinics/{id}          → Clinic data
```

**Rules pattern** ([firestore.rules](firestore.rules)): `request.auth.token.role` checks (requires custom claims via admin SDK)

### Type System ([lib/types.ts](lib/types.ts))
```tsx
type DoctorSpecialty = 'Plastic, Reconstructive and Aesthetic Surgery' | 'Dermatology'
type UserRole = 'patient' | 'doctor' | 'admin'

interface UserProfile {
  uid, email, displayName, photoURL, role, createdAt, updatedAt
  doctorInfo?: DoctorInfo    // specialization, licenseNumber, verified
  patientInfo?: PatientInfo  // preferredLanguage, emergencyContact
  adminInfo?: AdminInfo      // permissions, lastLogin
}
```

## Developer Workflows

### Commands
```bash
npm run dev    # http://localhost:3000 (auto-reload enabled)
npm run build  # Production build
npm run lint   # ESLint validation
```

### Environment Setup
Copy to `.env.local` (see [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another@example.com
```

## Code Patterns

### 1. Protected Pages
```tsx
"use client";
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

export default function AdminPage() {
  return <ProtectedRoute requiredRole="admin">
    {/* Only admins see this */}
  </ProtectedRoute>;
}
```
⚠️ Always check `loading` state from `useAuth()` before conditional renders to prevent flashing.

### 2. Using Auth Context
```tsx
const { user, userProfile, loading, signInWithGoogle, logout } = useAuth();

if (loading) return <Spinner />;
if (!user) return <LoginPrompt />;
// userProfile.role available here
```

### 3. Firestore Timestamp Conversion
Firestore returns `Timestamp` objects—convert to `Date` when fetching:
```tsx
const profile = {
  ...data,
  createdAt: data.createdAt instanceof Timestamp 
    ? data.createdAt.toDate() 
    : data.createdAt
};
```
See [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx#L23-L34) for reference implementation.

### 4. Logging Convention
Use emoji prefixes for debugging (appears in browser console):
```tsx
console.log('👤 [PROFILE] Creating user...', { uid, email });
console.log('🔐 [LOGIN] Google OAuth started');
console.log('🛡️ [PROTECTED] Access denied:', { requiredRole, userRole });
console.log('✅ Profile saved');  // Success
console.log('🚫 Validation failed');  // Error
```
Prefixes: `👤 [PROFILE]`, `🔐 [LOGIN]`, `🛡️ [PROTECTED]`, `✅`/`🚫`

### 5. Specialty Validation
Always use `DoctorSpecialty` type for specialty fields:
```tsx
import { DOCTOR_SPECIALTIES, DoctorSpecialty } from '@/lib/types';

// In forms:
<select>
  {DOCTOR_SPECIALTIES.map(spec => <option key={spec} value={spec}>{spec}</option>)}
</select>
```

## Critical Gotchas

### Firebase Rules Limitation
Current Firestore rules check `request.auth.token.role`, but **client SDK cannot set custom claims**. Role is stored in user doc only. To enable token-based checks:
1. Use Firebase Admin SDK with service account credentials
2. Call `auth().setCustomUserClaims(uid, { role: 'admin' })` after profile creation
3. User must re-authenticate to refresh token

**Current workaround**: Rules read from `users/{uid}` doc instead of token claims (less efficient).

### Next.js App Router Patterns
- Dynamic routes: `app/doctors/[slug]/page.tsx` (param accessed via `params.slug`)
- Middleware in [middleware.ts](middleware.ts) applies to `/admin/:path*` only
- Path alias `@/` maps to workspace root (configured in [tsconfig.json](tsconfig.json))

### Firebase SDK Initialization
Both [lib/firebase.ts](lib/firebase.ts#L18) and [lib/firebase-admin.ts](lib/firebase-admin.ts#L7) check `getApps().length === 0` to avoid duplicate initialization.

### Image Hosting
- Google profile photos whitelisted in [next.config.ts](next.config.ts#L6): `lh3.googleusercontent.com`
- Doctor documents stored in Firebase Storage (not implemented yet)

## Testing Checklist
1. **Auth**: Sign in → check console for `👤 [PROFILE]` logs → verify `users/{uid}` doc created in Firestore
2. **Protected Routes**: Test `/admin` without auth → should redirect to `/login`
3. **Role Check**: Non-admin user accessing `/admin` → redirects to `/unauthorized`
4. **Type Safety**: Specialty dropdowns must use `DOCTOR_SPECIALTIES` array only

## File Reference
| Purpose | Path |
|---------|------|
| Auth context & hooks | [lib/contexts/AuthContext.tsx](lib/contexts/AuthContext.tsx) |
| Type definitions | [lib/types.ts](lib/types.ts) |
| Firebase client SDK | [lib/firebase.ts](lib/firebase.ts) |
| Firebase admin SDK | [lib/firebase-admin.ts](lib/firebase-admin.ts) |
| Protected route wrapper | [app/components/ProtectedRoute.tsx](app/components/ProtectedRoute.tsx) |
| Firestore security rules | [firestore.rules](firestore.rules) |
| Admin dashboard | [app/admin/page.tsx](app/admin/page.tsx) |
| Doctor verification UI | [app/admin/verifications/page.tsx](app/admin/verifications/page.tsx) |
