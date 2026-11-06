# Signup & Role Selection Flow - Quick Reference

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     SIGNUP & ROLE SELECTION FLOW                 │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION ENTRY
   ┌──────────────────────┐
   │ User at /login page  │
   └──────────┬───────────┘
              │
              ├─→ [Click "Sign in with Google"]
              │
              ├─→ Redirect to Google OAuth
              │
              ├─→ User authenticates with Google
              │
              ├─→ /auth/callback route handler
              │
              └─→ Exchange code for Supabase session

2. USER PROFILE CREATION (AuthContext)
   ┌──────────────────────────────────┐
   │ Check if user exists in database │
   └──────────┬───────────────────────┘
              │
              ├─→ [NEW USER PATH]
              │   └─→ Create profile: account_status = 'pending_gdpr'
              │
              └─→ [EXISTING USER PATH]
                  └─→ Load existing profile
                  └─→ Update last login

3. GDPR CONSENT FLOW (SignupFlowManager)
   ┌────────────────────────────────────────┐
   │ Check: userProfile.accountStatus?      │
   └──────┬─────────────────────────────────┘
          │
          ├─→ IF 'pending_gdpr':
          │   ├─→ Show GDPR modal
          │   ├─→ User reads Privacy Policy + Terms
          │   ├─→ [DECLINE] → logout() + redirect /
          │   ├─→ [ACCEPT] → acceptGDPR()
          │   │              ├─→ account_status = 'pending_role'
          │   │              ├─→ gdpr_consent = true
          │   │              └─→ setUserProfile()
          │   └─→ SignupFlowManager detects status change
          │
          └─→ Hide GDPR modal

4. ROLE SELECTION FLOW
   ┌─────────────────────────────────────────────┐
   │ SignupFlowManager checks: 'pending_role'?   │
   └──────┬──────────────────────────────────────┘
          │
          ├─→ YES: redirect to /signup/role-selection
          │
          └─→ RoleSelectionPage renders
              ├─→ [PATIENT CARD - Blue]
              │   └─→ onClick: setSelectedRole('patient')
              │
              ├─→ [MEDICAL FACILITY CARD - Green]
              │   └─→ onClick: setSelectedRole('medical_facility')
              │
              ├─→ [AGENCY CARD - Purple]
              │   └─→ onClick: setSelectedRole('agency')
              │
              └─→ [CONTINUE BUTTON]
                  └─→ handleRoleSelection()

5. ROLE UPDATE & STATUS CHANGE
   ┌──────────────────────────────────────┐
   │ handleRoleSelection() called          │
   └──────┬───────────────────────────────┘
          │
          ├─→ Update Supabase:
          │   ├─→ role = selectedRole
          │   └─→ IF patient:
          │       └─→ account_status = 'active'
          │   └─→ ELSE (facility/agency):
          │       └─→ account_status = 'pending_personal_data'
          │
          ├─→ refreshUserProfile()
          │   └─→ Sync database changes to AuthContext
          │
          └─→ router.push('/profile')

6. POST-ROLE SELECTION ROUTING
   ┌─────────────────────────────────────┐
   │ User now on /profile page           │
   └──────┬──────────────────────────────┘
          │
          ├─→ IF role = 'patient' + account_status = 'active':
          │   └─→ ✅ FULL ACCESS
          │       ├─→ Can edit profile name
          │       ├─→ Can upload photo
          │       ├─→ Can search doctors
          │       └─→ Can request treatments
          │
          └─→ IF role = 'medical_facility' + account_status = 'pending_personal_data':
              └─→ ⏳ AWAITING VERIFICATION
                  ├─→ Can edit profile name
                  ├─→ Can upload photo
                  ├─→ Cannot access facility features yet
                  └─→ Admin will fill facility data via UserCRUDModal


═══════════════════════════════════════════════════════════════════
                         ADMIN VERIFICATION FLOW
═══════════════════════════════════════════════════════════════════

7. ADMIN VERIFICATION (Professional Accounts Only)
   ┌────────────────────────────────┐
   │ Admin at /admin page           │
   └──────┬─────────────────────────┘
          │
          ├─→ Find user with status = 'pending_personal_data'
          │
          ├─→ Click user row → UserCRUDModal opens
          │
          ├─→ Fill facility/agency details:
          │   ├─→ Name, location, contact
          │   ├─→ Specializations, services
          │   └─→ Verification documents
          │
          ├─→ Click [VERIFY] button
          │
          ├─→ Update Supabase:
          │   ├─→ medical_facility_data = {...}
          │   └─→ account_status = 'active'
          │
          └─→ ✅ User now has full access


═══════════════════════════════════════════════════════════════════
                         KEY COMPONENTS
═══════════════════════════════════════════════════════════════════

COMPONENT: SignupFlowManager
FILE: app/components/SignupFlowManager.tsx
PURPOSE: Central routing logic
LISTENS TO: userProfile.accountStatus
ACTIONS:
  ├─→ pending_gdpr → Show GDPR modal
  ├─→ pending_role → Redirect to /signup/role-selection
  ├─→ pending_personal_data → Redirect to /profile
  ├─→ pending_verification → Redirect to /profile
  ├─→ active → Allow full access
  └─→ admin users → Bypass all checks

COMPONENT: GDPRConsent
FILE: app/components/GDPRConsent.tsx
PURPOSE: GDPR compliance modal
PROPS: onAccept(), onDecline()
ACTIONS:
  ├─→ [ACCEPT] → acceptGDPR() from AuthContext
  └─→ [DECLINE] → logout()

COMPONENT: RoleSelectionPage
FILE: app/signup/role-selection/page.tsx
PURPOSE: Role selection UI
FLOW:
  ├─→ Display 3 role cards
  ├─→ User clicks card → setState(selectedRole)
  ├─→ Click [CONTINUE] → handleRoleSelection()
  └─→ Navigate to /profile

CONTEXT: AuthContext
FILE: lib/contexts/AuthContext.tsx
FUNCTIONS:
  ├─→ createUserProfile() - Create with pending_gdpr status
  ├─→ acceptGDPR() - Update status to pending_role
  ├─→ updateUserRole() - Update role & status (not used in new flow)
  ├─→ refreshUserProfile() - Sync DB to state
  └─→ logout() - Sign out user


═══════════════════════════════════════════════════════════════════
                         STATUS REFERENCE
═══════════════════════════════════════════════════════════════════

'pending_gdpr'
├─ Description: User just created account
├─ Display: GDPR modal on top
├─ Next Action: Accept/Decline GDPR
└─ Auto Redirect: None (modal shown)

'pending_role'
├─ Description: GDPR accepted, role not selected
├─ Display: Role selection page
├─ Next Action: Select role (Patient/Facility/Agency)
└─ Auto Redirect: /signup/role-selection

'pending_personal_data' (Professional roles only)
├─ Description: Role selected but needs verification
├─ Display: Profile page with read-only facility info
├─ Next Action: Admin fills facility data
└─ Auto Redirect: /profile

'pending_verification' (Professional roles only)
├─ Description: Facility data submitted, awaiting approval
├─ Display: Profile page with status message
├─ Next Action: Admin approves/rejects
└─ Auto Redirect: /profile

'active'
├─ Description: Account fully activated
├─ Display: Full feature access
├─ Next Action: Use all features
└─ Auto Redirect: /profile (if on signup pages)

'suspended'
├─ Description: Account disabled (rare)
├─ Display: Suspended account message
├─ Next Action: Contact support
└─ Auto Redirect: /account-suspended


═══════════════════════════════════════════════════════════════════
                    DEBUGGING & TESTING
═══════════════════════════════════════════════════════════════════

CONSOLE LOGS (Search for these emojis):
  🔐 [AUTH] - Authentication events
  📋 [GDPR] - GDPR consent flow
  🎭 [ROLE] - Role selection events
  🚦 [SIGNUP_FLOW] - SignupFlowManager routing
  👤 [PROFILE] - Profile operations

MANUAL TEST (Patient):
  1. /login → Sign in with Google
  2. GDPR modal → Accept GDPR
  3. /signup/role-selection → Select Patient
  4. → account_status = 'active'
  5. /profile → Full access ✅

MANUAL TEST (Medical Facility):
  1. /login → Sign in with Google
  2. GDPR modal → Accept GDPR
  3. /signup/role-selection → Select Medical Facility
  4. → account_status = 'pending_personal_data'
  5. /profile → Limited access (awaiting verification)
  6. [As Admin] /admin → Fill facility data + Verify
  7. User's account_status = 'active' ✅

AUTOMATED TESTS:
  npm run test -- AuthContext.test.tsx
  npm run test -- ProtectedRoute.test.tsx


═══════════════════════════════════════════════════════════════════
                         LINKS
═══════════════════════════════════════════════════════════════════

Code Files:
  • AuthContext: lib/contexts/AuthContext.tsx
  • SignupFlowManager: app/components/SignupFlowManager.tsx
  • GDPRConsent: app/components/GDPRConsent.tsx
  • RoleSelectionPage: app/signup/role-selection/page.tsx
  • Auth Callback: app/auth/callback/route.ts

Documentation:
  • Full Flow Guide: _docs/SIGNUP_FLOW.md
  • Architecture: _docs/TechnicalGuides/architecture/signup_flow.md
  • User Roles: _docs/TechnicalGuides/architecture/roles.md

Tests:
  • AuthContext Tests: lib/contexts/AuthContext.test.tsx
  • ProtectedRoute Tests: app/components/ProtectedRoute.test.tsx
