# Signup & Role Selection Flow Status

## Overview
The signup and role selection flow is **fully implemented and working correctly** with Supabase as the backend. The flow ensures GDPR compliance, proper role selection, and account status management.

## Current Flow Architecture

### 1. Authentication Entry Point
**Files**:
- [app/auth/callback/route.ts](../app/auth/callback/route.ts) - OAuth callback handler
- [lib/contexts/AuthContext.tsx](../lib/contexts/AuthContext.tsx) - Auth state management

**Flow**:
```
User clicks "Sign in with Google"
         ↓
Google OAuth redirect to /auth/callback
         ↓
Exchange auth code for session
         ↓
Create user profile with account_status: 'pending_gdpr'
         ↓
Return to app (AuthContext picks up session)
```

### 2. Account Status Flow
**Files**:
- [app/components/SignupFlowManager.tsx](../app/components/SignupFlowManager.tsx) - Manages routing based on status
- [app/components/GDPRConsent.tsx](../app/components/GDPRConsent.tsx) - GDPR consent modal
- [app/signup/role-selection/page.tsx](../app/signup/role-selection/page.tsx) - Role selection UI

**Status Progression**:
```
pending_gdpr
    ↓
[User accepts GDPR] → (SignupFlowManager shows modal)
    ↓
pending_role
    ↓
[User selects role] → (RoleSelectionPage handles update)
    ↓
    ├─ Patient role → account_status: 'active' (immediate access)
    │
    └─ Medical Facility/Agency → account_status: 'pending_personal_data'
            ↓
        [User fills profile data]
            ↓
        account_status: 'pending_verification'
            ↓
        [Admin verifies]
            ↓
        account_status: 'active'
```

## Component Details

### SignupFlowManager
**Purpose**: Central routing logic for signup flow
**Location**: [app/components/SignupFlowManager.tsx](../app/components/SignupFlowManager.tsx)
**Responsibilities**:
- Monitors `userProfile.accountStatus`
- Shows GDPR modal for `pending_gdpr` status
- Redirects to role selection for `pending_role` status
- Redirects to profile page for `pending_personal_data` status
- Prevents already-active users from accessing signup pages
- Bypasses all checks for admin users

**Key Code**:
```tsx
switch (userProfile.accountStatus) {
  case 'pending_gdpr':
    setShowGDPR(true); // Show modal
    break;
  case 'pending_role':
    router.push('/signup/role-selection'); // Auto-redirect
    break;
  case 'pending_personal_data':
  case 'pending_verification':
    router.push('/profile'); // Redirect to data entry
    break;
  case 'active':
    // Allow full access, prevent signup page access
    break;
}
```

### GDPRConsent Component
**Purpose**: GDPR compliance modal
**Location**: [app/components/GDPRConsent.tsx](../app/components/GDPRConsent.tsx)
**Features**:
- Two scrollable sections (Privacy Policy + Terms of Service)
- Dual checkbox acceptance
- Calls `acceptGDPR()` from AuthContext on accept
- Calls `logout()` on decline

**Behavior**:
```tsx
const handleGDPRAccept = async () => {
  await acceptGDPR(); // Updates: accountStatus → 'pending_role'
  setShowGDPR(false); // Hide modal
  // SignupFlowManager redirects to /signup/role-selection
};
```

### Role Selection Page
**Purpose**: User selects account type
**Location**: [app/app/signup/role-selection/page.tsx](../app/signup/role-selection/page.tsx)
**Roles Available**:
1. **Patient** (Blue)
   - Immediate activation
   - account_status → 'active'
   
2. **Medical Facility** (Green)
   - Requires verification
   - account_status → 'pending_personal_data'
   - Admin fills facility data via UserCRUDModal
   
3. **Agency** (Purple)
   - Requires verification
   - account_status → 'pending_personal_data'
   - Admin fills agency data via UserCRUDModal

**Key Implementation**:
```tsx
const handleRoleSelection = async () => {
  const updates = {
    role: selectedRole,
    updated_at: new Date().toISOString()
  };
  
  if (selectedRole === 'patient') {
    updates.account_status = 'active';
  } else {
    updates.account_status = 'pending_personal_data';
  }
  
  await supabase.from('users').update(updates).eq('id', user.id);
  await refreshUserProfile(); // Syncs local state
  router.push('/profile'); // Navigate to profile
};
```

## AuthContext Integration

**File**: [lib/contexts/AuthContext.tsx](../lib/contexts/AuthContext.tsx)

**Key Functions**:

### `acceptGDPR()`
Updates `account_status` from `'pending_gdpr'` → `'pending_role'`
```tsx
const acceptGDPR = async () => {
  const { data, error } = await supabase
    .from('users')
    .update({
      account_status: 'pending_role',
      gdpr_consent: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (userProfile) {
    setUserProfile(formatUserProfile(data));
  }
};
```

### `updateUserRole()`
Called by role selection page to update role and status
```tsx
const updateUserRole = async (role: UserRole) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      role,
      account_status: 'pending_personal_data', // Always set to this
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();
  
  setUserProfile(formatUserProfile(data));
};
```

## Database Schema (Supabase)

**users table key fields**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR,
  photo_url VARCHAR,
  
  -- Auth fields
  role VARCHAR, -- 'patient', 'medical_facility', 'agency', 'admin', 'healthcare_personnel'
  account_status VARCHAR, -- 'pending_gdpr', 'pending_role', 'pending_personal_data', 'pending_verification', 'active', 'suspended'
  
  -- Consent tracking
  gdpr_consent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Testing the Flow

### Manual Test Scenario 1: Patient Signup
1. Click "Sign in with Google"
2. Redirected to Google OAuth
3. After auth → `/auth/callback`
4. GDPR modal appears
5. Accept GDPR → redirected to `/signup/role-selection`
6. Select "Patient" → account_status: 'active'
7. Redirected to `/profile`
8. Full access granted

### Manual Test Scenario 2: Medical Facility Signup
1. Same as above steps 1-5
2. Select "Medical Facility" → account_status: 'pending_personal_data'
3. Redirected to `/profile`
4. Admin goes to `/admin` → finds user → opens UserCRUDModal
5. Admin fills facility data
6. Admin clicks verify → account_status: 'pending_verification' → 'active'
7. User gains facility features on next auth refresh

### Automated Tests
**File**: [lib/contexts/AuthContext.test.tsx](../lib/contexts/AuthContext.test.tsx)

Tests covering:
- ✅ GDPR workflow transitions
- ✅ Role updates with correct status changes
- ✅ Profile refresh after status changes
- ✅ Account deletion flow
- ✅ Authentication state persistence

**Run Tests**:
```bash
npm run test -- AuthContext.test.tsx
```

## Common Flows & Expected Behavior

| Scenario | Entry | Status Flow | Final Redirect |
|----------|-------|------------|-----------------|
| New Patient | Google OAuth | pending_gdpr → pending_role → active | /profile |
| New Facility | Google OAuth | pending_gdpr → pending_role → pending_personal_data | /profile |
| Admin User | Google OAuth (ADMIN_EMAILS) | active (auto) | /admin or /profile |
| Returning User | Google OAuth | No change (status preserved) | Based on status |
| Active User on /signup/role-selection | Direct link | Redirected away | /profile |

## Environment Configuration

**Required for signup to work**:
```env
# Google OAuth (handled by Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=xxx

# Auto-admin assignment
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Known Behaviors & Edge Cases

### ✅ Implemented
- Admin users bypass all signup checks (auto 'active' status)
- GDPR consent is mandatory before role selection
- Patient accounts activate immediately
- Professional accounts require admin verification
- SignupFlowManager prevents status inconsistencies
- Profile refresh syncs database changes to UI state

### ⚠️ Important Notes
1. **No healthcare_personnel role** in public signup (admin-only, deprecated)
2. **No agency role** in public signup (admin-only, disabled)
3. Role selection updates happen in database immediately (no batch)
4. Professional users must go to `/profile` after role selection (no direct data form)
5. Admin fills medical facility/agency data via admin panel modals

## Debugging

Enable logging with emoji prefixes:
```
🔐 [AUTH] - Authentication events
📋 [GDPR] - GDPR consent flow
🎭 [ROLE] - Role selection events
🚦 [SIGNUP_FLOW] - SignupFlowManager routing
👤 [PROFILE] - Profile operations
```

Check browser console during signup to trace flow:
```
👂 [AUTH] Setting up Supabase auth state listener...
🔐 [AUTH] Auth state changed: User signed in
👤 [PROFILE] Creating/loading user profile...
🆕 [PROFILE] New user detected, creating profile with pending_gdpr status...
📋 [GDPR] User accepting GDPR consent...
✅ [GDPR] GDPR consent accepted, moving to role selection
🎭 [ROLE] Starting role update...
✅ [ROLE] patient role set, refreshing profile...
✅ [ROLE] Profile refreshed, navigating to /profile
```

## Migration Notes (Firebase → Supabase)

### Changes Made:
1. **AuthContext**: Complete rewrite for Supabase
2. **Database**: Migrated to Supabase PostgreSQL
3. **OAuth**: Uses Supabase-hosted Google OAuth
4. **Field Names**: Converted to snake_case in database
5. **Timestamps**: Use ISO strings instead of Firestore Timestamps
6. **Conversions**: Added `convertDatabaseRow()` and `convertToSnakeCase()` utilities

### Backward Compatibility:
- SignupFlowManager handles legacy users without `accountStatus`
- Treats them as `'active'` for safety
- New signups go through full flow

## Future Enhancements

Potential improvements:
1. [ ] Email verification step before GDPR
2. [ ] Multi-step facility data form during signup
3. [ ] Real-time verification progress notifications
4. [ ] Bulk user import for admin
5. [ ] Self-serve facility dashboard after verification
6. [ ] SMS verification for healthcare personnel

## References

- [Architecture: Signup Flow](TechnicalGuides/architecture/signup_flow.md)
- [Architecture: User Roles](TechnicalGuides/architecture/roles.md)
- [AuthContext Tests](../lib/contexts/AuthContext.test.tsx)
- [Supabase RLS Policies](../supabase/migrations)
