# Multi-Step Signup Flow Documentation

## Overview
The application now implements a comprehensive multi-step signup flow that ensures GDPR compliance, proper role selection, and doctor credential verification before granting full access.

## Signup Flow Diagram

```
New User Sign In (Google OAuth)
         ↓
   [User Created]
   accountStatus: 'pending_gdpr'
         ↓
  GDPR Consent Modal
   (Privacy Policy & Terms)
         ↓
   [User Accepts GDPR]
   accountStatus: 'pending_role'
         ↓
   Role Selection Page
   (/signup/role-selection)
         ↓
    ┌────┴────┐
    ↓         ↓
 Patient    Doctor
    ↓         ↓
  Active   pending_application
    ↓         ↓
  Done    Doctor Application Form
          (/signup/doctor-application)
                ↓
          [Form Submitted]
          accountStatus: 'pending_approval'
                ↓
          Pending Approval Page
          (/doctor/pending-approval)
                ↓
          [Admin Approves]
          accountStatus: 'active'
          verified: true
                ↓
              Done
```

## Account Statuses

### `pending_gdpr`
- **Description**: New user who hasn't accepted GDPR consent yet
- **Access**: GDPR consent modal is shown
- **Next Step**: Accept GDPR to move to `pending_role`

### `pending_role`
- **Description**: User accepted GDPR but hasn't selected a role yet
- **Access**: Redirected to `/signup/role-selection`
- **Next Step**: 
  - Select **Patient** → `active`
  - Select **Doctor** → `pending_application`

### `pending_application`
- **Description**: User selected doctor role but hasn't submitted application
- **Access**: Redirected to `/signup/doctor-application`
- **Next Step**: Submit application to move to `pending_approval`

### `pending_approval`
- **Description**: Doctor submitted application, waiting for admin approval
- **Access**: Can only view `/doctor/pending-approval` page
- **Next Step**: Admin approves → `active`

### `active`
- **Description**: Fully activated account with all features available
- **Access**: Full access based on role (patient/doctor/admin)
- **Next Step**: N/A (final state)

### `suspended`
- **Description**: Account has been suspended by admin
- **Access**: Redirected to `/account-suspended` page
- **Next Step**: Contact support

## Key Components

### 1. **GDPRConsent Component** (`app/components/GDPRConsent.tsx`)
Modal that displays:
- Privacy Policy (data collection, usage, protection, GDPR rights)
- Terms of Service (service description, responsibilities, medical disclaimer)
- Two checkboxes for explicit consent
- Accept/Decline buttons

**Actions:**
- **Accept**: Calls `acceptGDPR()` → Updates `accountStatus` to `pending_role`
- **Decline**: Logs user out and returns to homepage

### 2. **SignupFlowManager Component** (`app/components/SignupFlowManager.tsx`)
Wraps the entire application and manages routing based on `accountStatus`:
- Shows GDPR modal for `pending_gdpr` users
- Redirects to appropriate pages based on status
- Allows access to public pages (login, support, about, blogs, doctors)
- Bypasses checks for active admin users

### 3. **Role Selection Page** (`app/signup/role-selection/page.tsx`)
Beautiful dual-option selection interface:
- **Patient Card**: Lists benefits (search doctors, request treatment plans, reviews)
- **Doctor Card**: Lists benefits (build profile, connect with patients, verified credentials)
- Updates Firestore with selected role
- Patient accounts activated immediately
- Doctor accounts move to application phase

### 4. **Doctor Application Form** (`app/signup/doctor-application/page.tsx`)
Comprehensive form collecting:
- **Personal Info**: Name, DOB, phone
- **Professional Info**: License number, issuing authority, expiration, specialization, experience
- **Education**: Medical school, graduation year
- **Employment**: Current clinic, position, address
- **Motivation**: Why join the platform

**On Submit:**
1. Creates document in `verification_requests` collection
2. Updates user profile with `doctorInfo` and `accountStatus: 'pending_approval'`
3. Redirects to pending approval page

### 5. **Pending Approval Page** (`app/doctor/pending-approval/page.tsx`)
Waiting screen for doctors showing:
- Application status
- Submitted date and details
- What happens next (verification process)
- Estimated review time (2-5 business days)
- Contact support button
- Auto-refreshes to check if approved

### 6. **AuthContext Updates** (`lib/contexts/AuthContext.tsx`)
New functionality:
- `acceptGDPR()`: Updates user with GDPR consent and moves to `pending_role`
- New user creation sets `accountStatus: 'pending_gdpr'` (except admins)
- Admins get `accountStatus: 'active'` immediately
- Role is `null` until selected (except admins)

### 7. **ProtectedRoute Updates** (`app/components/ProtectedRoute.tsx`)
Enhanced checks:
- Redirects pending doctors to approval page
- Checks `accountStatus === 'active'` before granting access
- Works in conjunction with SignupFlowManager

## Type Updates

### UserProfile Interface
```typescript
export interface UserProfile {
  // ... existing fields
  role: UserRole | null; // null until role is selected
  accountStatus: AccountStatus;
  
  gdprConsent?: {
    accepted: boolean;
    acceptedAt: Date;
    version: string;
  };
}
```

### DoctorInfo Interface
```typescript
export interface DoctorInfo {
  // ... existing fields
  verificationRequestId?: string; // Links to verification request
}
```

### New Types
```typescript
export type AccountStatus = 
  | 'pending_gdpr'
  | 'pending_role'
  | 'pending_application'
  | 'pending_approval'
  | 'active'
  | 'suspended';
```

## Admin Workflow

### Approving Doctor Applications

1. Admin logs into `/admin/verifications`
2. Views list of pending verification requests
3. Clicks on request to see full details
4. Reviews credentials and information
5. **Approve**:
   - Update `verification_requests/{id}` → `status: 'approved'`
   - Update `users/{uid}` → `accountStatus: 'active'`, `doctorInfo.verified: true`
6. **Deny**:
   - Update `verification_requests/{id}` → `status: 'denied'`, add `reviewNotes`
   - Doctor remains in `pending_approval` status and sees denial reason

## Firestore Structure

### `users/{uid}`
```javascript
{
  uid: "user123",
  email: "doctor@example.com",
  role: "doctor", // or null if not selected
  accountStatus: "pending_approval",
  gdprConsent: {
    accepted: true,
    acceptedAt: Timestamp,
    version: "1.0"
  },
  doctorInfo: {
    specialization: "Plastic, Reconstructive and Aesthetic Surgery",
    licenseNumber: "MD12345",
    verified: false,
    verificationRequestId: "req123",
    experience: 10
  }
}
```

### `verification_requests/{id}`
```javascript
{
  id: "req123",
  doctorId: "user123",
  doctorEmail: "doctor@example.com",
  fullName: "Dr. John Doe",
  medicalLicenseNumber: "MD12345",
  specialization: "Plastic, Reconstructive and Aesthetic Surgery",
  yearsOfExperience: 10,
  medicalSchool: "Harvard Medical School",
  graduationYear: 2013,
  status: "waiting", // 'waiting' | 'approved' | 'denied'
  submittedAt: Timestamp,
  reviewedBy: null,
  reviewNotes: null
}
```

## Security Rules

Current Firestore rules already support:
- Users can read/write their own profile (including `accountStatus` updates)
- Doctors can create their own verification requests
- Admins can read and update all verification requests
- Only admins can approve/deny requests

## Testing Checklist

### New User Flow
- [ ] Sign in with Google OAuth
- [ ] GDPR modal appears
- [ ] Decline GDPR → logged out
- [ ] Accept GDPR → redirected to role selection
- [ ] Select Patient → account activated, redirected to profile
- [ ] Select Doctor → redirected to application form

### Doctor Application Flow
- [ ] Fill out application form
- [ ] Submit application → verification request created
- [ ] Redirected to pending approval page
- [ ] Application details displayed correctly
- [ ] Cannot access protected routes while pending

### Admin Approval Flow
- [ ] Admin can view pending requests
- [ ] Admin approves request
- [ ] Doctor's `accountStatus` becomes 'active'
- [ ] Doctor's `verified` field becomes true
- [ ] Doctor can now access full features

### Edge Cases
- [ ] Admin emails bypass entire signup flow (immediately active)
- [ ] Existing users don't see GDPR modal
- [ ] Public pages accessible at any status
- [ ] Attempting to access protected routes redirects appropriately
- [ ] Console logs show proper flow progression

## Environment Variables

Add admin emails to `.env.local`:
```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

## Migration Notes

**Existing Users:**
Existing user profiles in the database need to be migrated to include:
- `accountStatus: 'active'` (if they're already using the app)
- `gdprConsent` can be null (grandfather clause)
- `role` should already exist

**Migration Script (run once in Firestore console):**
```javascript
// Update all existing users without accountStatus
db.collection('users').where('accountStatus', '==', null).get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      doc.ref.update({
        accountStatus: 'active'
      });
    });
  });
```

## Future Enhancements

1. **Email Notifications**: Send emails when verification status changes
2. **Document Upload**: Allow doctors to upload license/certification PDFs
3. **Re-verification**: Periodic credential re-verification for doctors
4. **Partial Applications**: Save draft applications
5. **Multi-language Support**: GDPR consent in multiple languages
6. **Analytics**: Track conversion rates at each step
