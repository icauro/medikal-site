
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
     Patient    Doctor / Clinic / Agency
        ↓         ↓
      Active   pending_personal_data
        ↓         ↓
      Done    Data Entry
            ↓
          [Data Submitted]
          accountStatus: 'active'
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
- **Description**: User selected a professional role (Doctor, Clinic, or Agency) but hasn't submitted their data yet
- **Access**: Redirected to data entry page
- **Next Step**: Submit data to move to `active`

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
1. Updates user profile with submitted data and sets `accountStatus: 'active'`
2. Redirects to profile page

### 5. **AuthContext Updates** (`lib/contexts/AuthContext.tsx`)
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
  personalHealthcarePersonnelData?: PersonalHealthcarePersonnelData; // Only for healthcare personnel
}
```

### PersonalHealthcarePersonnelData Interface
* openHealthcarePersonnelDataId is set by admin after verification; personnel cannot edit this link themselves.
```typescript
export interface PersonalHealthcarePersonnelData {
  name: string;
  personnelType: PersonnelType; // 'Doctor' | 'Patient Coordinator'
  dob: string;
  phone: string;
  licenseNumber: string;
  issuingAuthority: string;
  licenseExpiration: string;
  specialty: string;
  experience: number;
  medicalSchool: string;
  graduationYear: number;
  currentFacilityId?: string;
  position: string;
  facilityAddress: string;
  motivation: string;
  photoUrl?: string;
  openHealthcarePersonnelDataId?: string; // Linked after verification
  verified?: boolean;
}
```

### OpenHealthcarePersonnelData Interface (Admin-managed, public, personnel cannot edit links)
* personalHealthcarePersonnelDataId is set by admin if verified; personnel cannot edit this link themselves.
```typescript
export interface OpenHealthcarePersonnelData {
  id: string;
  name: string;
  personnelType: PersonnelType;
  specialty: string;
  personalHealthcarePersonnelDataId?: string; // Linked if verified
}
```

### New Types
```typescript
export type AccountStatus = 
  | 'pending_gdpr'
  | 'pending_role'
  | 'pending_personal_data'
  | 'active'
  | 'suspended';
```

## Admin Workflow

### Approving Personnel Applications & Linking Data

1. Admin logs into `/admin/healthcare-personnel`
2. Views list of pending personnel approvals
3. Clicks on a personnel to see their personalHealthcarePersonnelData
4. Reviews credentials and information
5. **Approve**:
  - Admin must manually select the appropriate openHealthcarePersonnelData record to link with this personnel (or create a new one if needed)
  - Update `users/{uid}`:
    - `accountStatus: 'active'`
    - `personalHealthcarePersonnelData.verified: true`
    - `personalHealthcarePersonnelData.openHealthcarePersonnelDataId = openHealthcarePersonnelData.id`
  - Update `open_healthcare_personnel_data/{id}`:
    - `personalHealthcarePersonnelDataId = uid`
  - This creates a two-way link between open and personal data
  - Personnel cannot edit or unlink their openHealthcarePersonnelData themselves; only admins can manage these links
6. **Deny**:
  - Personnel remains in `pending_approval` status and sees denial reason

## Firestore Structure


### `users/{uid}`
```javascript
{
  uid: "user123",
  email: "doctor@example.com",
  role: "healthcare_personnel", // or null if not selected
  accountStatus: "pending_approval",
  gdprConsent: {
    accepted: true,
    acceptedAt: Timestamp,
    version: "1.0"
  },
  personalHealthcarePersonnelData: {
    name: "Dr. John Doe",
    personnelType: "Doctor",
    dob: "1980-01-01",
    phone: "+1234567890",
    licenseNumber: "MD12345",
    issuingAuthority: "Medical Board",
    licenseExpiration: "2030-01-01",
    specialty: "Plastic, Reconstructive and Aesthetic Surgery",
    experience: 10,
    medicalSchool: "Harvard Medical School",
    graduationYear: 2013,
    currentFacilityId: "facility123",
    position: "Surgeon",
    facilityAddress: "123 Main St",
    motivation: "To help patients",
    photoUrl: "...",
    openHealthcarePersonnelDataId: null,
    verified: false
  }
}
```

### `open_healthcare_personnel_data/{id}`
```javascript
{
  id: "open123",
  name: "Dr. John Doe",
  personnelType: "Doctor",
  specialty: "Plastic, Reconstructive and Aesthetic Surgery",
  personalHealthcarePersonnelDataId: "user123" // Linked if verified
}
```

## Security Rules

Current Firestore rules already support:
- Users can read/write their own profile (including `accountStatus` updates)
- Admins can read and update all data

## Testing Checklist

### New User Flow
- [ ] Sign in with Google OAuth
- [ ] GDPR modal appears
- [ ] Decline GDPR → logged out
- [ ] Accept GDPR → redirected to role selection
- [ ] Select Patient → account activated, redirected to home/profile
- [ ] Select Doctor/Clinic/Agency → redirected to application form

### Application Flow
- [ ] Fill out data form
- [ ] Submit form → account activated
- [ ] Redirected to profile page
- [ ] Profile details displayed correctly
- [ ] Access full features based on role

### Admin Linking
- [ ] Admin manually links personal data to public profile record

### Edge Cases
- [ ] Admin emails bypass entire signup flow (immediately active)
- [ ] Existing users don't see GDPR modal
- [ ] Public pages accessible at any status
- [ ] Attempting to access protected routes redirects appropriately
- [ ] Console logs show proper flow progression

## Migration Notes

**Existing Users:**
Existing user profiles in the database should have:
- `accountStatus: 'active'`
- `role` should already exist
- Personal data stored in `personalDoctorData`, `clinicData`, or `agencyData` fields.

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

1. **Email Notifications**: Send emails when profiles are linked
2. **Document Upload**: Allow users to upload certificates
3. **Partial Applications**: Save draft data
4. **Multi-language Support**: GDPR consent in multiple languages
5. **Analytics**: Track conversion rates at each step
6. **Open/Personal Data Linking**: Automate linking after registration
