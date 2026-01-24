# Roles.md Update Summary

## Date: January 24, 2026

### Changes Made to `docs/roles.md`

#### ✅ Healthcare Personnel Role Marked as Deprecated
**Changes**:
- Added prominent `⚠️ DEPRECATED FOR USER SIGNUP` status
- Updated signup flow row: Shows "Deprecated (admin only)" status
- Added clear note: "Users can no longer sign up as healthcare personnel. This role is now assigned and managed exclusively by administrators."
- Updated account status: Now shows `active` (assigned directly by admin) instead of pending flow
- Removed old pending_personal_data flow
- Added detailed "Admin Assignment Process" section with 6-step process

**Impact**:
- Users cannot select healthcare_personnel role during signup
- Only admins can create healthcare_personnel accounts
- Existing healthcare_personnel accounts remain functional

#### ✅ Medical Facility Role Updated
**Changes**:
- Updated signup flow to: `GDPR → Role selection → Fill facility data → **Pending Verification** → Active`
- Added `Pending Verification` status in role overview table
- Updated account status flow:
  - `pending_personal_data` → after role selection
  - `pending_verification` → after submitting facility data (waiting for admin approval)
  - `active` → after admin verification and approval
- Updated capabilities: Added "Edit own profile information (pending admin approval)"
- Added detailed "Verification Process" section with 6-step workflow

**Impact**:
- Medical facilities must submit data during signup
- Accounts enter pending_verification status
- Admin must explicitly verify before account becomes active
- Clear verification workflow documented

#### ✅ Agency Role Updated
**Changes**:
- Updated signup flow to: `GDPR → Role selection → Fill agency data → **Pending Verification** → Active`
- Added `Pending Verification` status in role overview table
- Expanded from "Future" to current implementation
- Updated account status flow:
  - `pending_personal_data` → after role selection
  - `pending_verification` → after submitting agency data (waiting for admin approval)
  - `active` → after admin verification and approval
- Added detailed "Verification Process" section with 6-step workflow
- Added comprehensive "Planned Capabilities" list

**Impact**:
- Agency role is now active (not future)
- Clear signup flow with verification step
- Standardized verification process with medical_facility role

#### ✅ Clinic Role Consolidated
**Changes**:
- Marked as `🔮 **Future**` with note
- Consolidated functionality notes under medical_facility role
- Removed old duplicate capabilities list

#### ✅ Documentation Standards Updated
- Role overview table now includes Status column
- All signup flows clearly show status transitions
- All professional roles (healthcare_personnel, medical_facility, agency) documented consistently
- Verification processes clearly documented

### Role Overview Table

| Role                   | Status | Signup Flow |
|------------------------|--------|------------|
| `patient`              | ✅ Active | GDPR → Role selection → Active |
| `healthcare_personnel` | ⚠️ Deprecated (admin only) | Admin assignment only |
| `admin`                | ✅ Active | Auto-assigned via ADMIN_EMAILS |
| `medical_facility`     | ✅ Active | GDPR → Role selection → Fill data → **Pending Verification** → Active |
| `agency`               | ✅ Active | GDPR → Role selection → Fill data → **Pending Verification** → Active |

### Key Workflow Changes

#### Before (Old Flow)
- Healthcare Personnel: User signup → role select → fill data → active
- Medical Facility: User signup → admin fills data → active
- Agency: Not implemented/documented

#### After (New Flow)
- Healthcare Personnel: ❌ Not available to users → Admin only
- Medical Facility: User signup → fill facility data → **Pending Verification** → Admin reviews → Active
- Agency: User signup → fill agency data → **Pending Verification** → Admin reviews → Active

### Security & Consistency Improvements
✅ **Healthcare Personnel Control**: No longer user-accessible, eliminating unauthorized professional account creation
✅ **Verification Process**: Both medical_facility and agency now require admin verification
✅ **Standardized Signup**: Professional roles follow consistent pending_verification pattern
✅ **Clear Admin Process**: Detailed verification steps for each role

### Document Status
✅ **Updated**: January 24, 2026
✅ **Current**: Reflects actual application state
✅ **Complete**: All role workflows documented

---

**Summary**: The roles.md document has been updated to reflect that healthcare_personnel signup is deprecated and only available to admins, while medical_facility and agency roles now follow a standardized signup flow with pending verification status.
