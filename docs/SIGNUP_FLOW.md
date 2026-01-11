
# Multi-Step Signup Flow Documentation (with Open/Personal Doctor Data Separation)

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
      Active   pending_personal_data
        ↓         ↓
      Done    Personal Doctor Data Entry
            ↓
          [Personal Data Submitted]
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


### `pending_personal_data`
- **Description**: User selected doctor role but hasn't submitted their personal doctor data
- **Access**: Redirected to personal doctor data entry page (replaces application form)
- **Next Step**: Submit personal data to move to `pending_approval`

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


### 4. **Personal Doctor Data Entry** (replaces Doctor Application Form)
Doctors fill out their personal doctor data after selecting the doctor role. This data is private and only visible to the doctor and admins until verified. The form collects:
- **Personal Info**: Name, DOB, phone
- **Professional Info**: License number, issuing authority, expiration, specialization, experience
- **Education**: Medical school, graduation year
- **Employment**: Current clinic, position, address
- **Motivation**: Why join the platform
- **Photo**: Profile photo

**On Submit:**
1. Updates user profile with `personalDoctorData` and `accountStatus: 'pending_approval'`
2. Redirects to pending approval page

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
  personalDoctorData?: PersonalDoctorData; // Only for doctor users
}
```

### PersonalDoctorData Interface
* openDoctorDataId is set by admin after verification; doctors cannot edit this link themselves.
```typescript
export interface PersonalDoctorData {
  name: string;
  dob: string;
  phone: string;
  licenseNumber: string;
  issuingAuthority: string;
  licenseExpiration: string;
  specialization: string;
  experience: number;
  medicalSchool: string;
  graduationYear: number;
  currentClinic: string;
  position: string;
  clinicAddress: string;
  motivation: string;
  photoUrl?: string;
  openDoctorDataId?: string; // Linked after verification
  verified?: boolean;
}
```

### OpenDoctorData Interface (Admin-managed, public, doctor cannot edit links)
* personalDoctorDataId is set by admin if verified; doctors cannot edit this link themselves.
```typescript
export interface OpenDoctorData {
  id: string;
  name: string;
  specialty: string;
  personalDoctorDataId?: string; // Linked if verified
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

### Approving Doctor Applications & Linking Data

1. Admin logs into `/admin/verifications`
2. Views list of pending doctor approvals
3. Clicks on a doctor to see their personalDoctorData
4. Reviews credentials and information
5. **Approve**:
  - Admin must manually select the appropriate openDoctorData record to link with this doctor (or create a new one if needed)
  - Update `users/{uid}`:
    - `accountStatus: 'active'`
    - `personalDoctorData.verified: true`
    - `personalDoctorData.openDoctorDataId = openDoctorData.id`
  - Update `open_doctor_data/{id}`:
    - `personalDoctorDataId = uid`
  - This creates a two-way link between open and personal data
  - Doctors cannot edit or unlink their openDoctorData themselves; only admins can manage these links
6. **Deny**:
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
  personalDoctorData: {
    name: "Dr. John Doe",
    dob: "1980-01-01",
    phone: "+1234567890",
    licenseNumber: "MD12345",
    issuingAuthority: "Medical Board",
    licenseExpiration: "2030-01-01",
    specialization: "Plastic, Reconstructive and Aesthetic Surgery",
    experience: 10,
    medicalSchool: "Harvard Medical School",
    graduationYear: 2013,
    currentClinic: "Clinic Name",
    position: "Surgeon",
    clinicAddress: "123 Main St",
    motivation: "To help patients",
    photoUrl: "...",
    openDoctorDataId: null,
    verified: false
  }
}
```

### `open_doctor_data/{id}`
```javascript
{
  id: "open123",
  name: "Dr. John Doe",
  specialty: "Plastic, Reconstructive and Aesthetic Surgery",
  personalDoctorDataId: "user123" // Linked if verified
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
- If doctor, move doctorInfo fields to personalDoctorData

**Migration Script (run once in Firestore console):**
```javascript
// Update all existing users without accountStatus
db.collection('users').where('accountStatus', '==', null).get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      let update = { accountStatus: 'active' };
      if (data.doctorInfo) {
        update.personalDoctorData = { ...data.doctorInfo };
        update.doctorInfo = firebase.firestore.FieldValue.delete();
      }
      doc.ref.update(update);
    });
  });
```

## Future Enhancements

1. **Email Notifications**: Send emails when verification status changes
2. **Document Upload**: Allow doctors to upload license/certification PDFs
3. **Re-verification**: Periodic credential re-verification for doctors
4. **Partial Applications**: Save draft personal doctor data
5. **Multi-language Support**: GDPR consent in multiple languages
6. **Analytics**: Track conversion rates at each step
7. **Open/Personal Data Linking**: Automate linking after admin approval
