# User Roles, Permissions & Capabilities

This document defines all user roles in the Medikal Site platform, their permissions, and capabilities.

---

## Table of Contents
- [Role Overview](#role-overview)
- [Role Definitions](#role-definitions)
- [Permissions Matrix](#permissions-matrix)
- [Data Access Patterns](#data-access-patterns)
- [Security Notes](#security-notes)

---

## Role Overview

The platform supports the following user roles:

| Role                   | Description                                      | Signup Flow                                              |
|------------------------|--------------------------------------------------|----------------------------------------------------------|
| `patient`              | End users seeking medical services               | GDPR → Role selection → Active                           |
| `healthcare_personnel` | Medical professionals with personal profiles     | GDPR → Role selection → Personal personnel data → Active |
| `admin`                | Platform administrators                          | Auto-assigned via ADMIN_EMAILS                           |
| `medical_facility`     | Medical facilities (Clinics, Hospitals, etc.)   | GDPR → Role selection → Facility data → Active           |
| `agency`               | Medical tourism agencies                         | GDPR → Role selection → Agency data → Active             |

---

## Data Architecture: Personal vs. Open Data

The platform maintains a strict separation between account ownership (Personal Data) and directory visibility (Open Data).

### Open Data (The Listing)
- **Nature**: Public-facing record that represents the entity on the website.
- **Primary Field**: `slug` (used for the entity's dedicated URL).
- **Independence**: Open Data records **can exist without a linked user**. This allows admins to populate the directory with hospitals or doctors who haven't registered an account yet.
- **Collections**: `healthcare_personnel_listings`, `medical_facility_listings`, `agency_listings`.

### Personal Data (The Account)
- **Nature**: Private user-owned data required for authentication and onboarding.
- **Constraint**: **Personal Data cannot exist without a corresponding Open Data record.** 
- **Linking**: Every user with a professional role must be linked to an Open Data record. During account creation, if no link exists, a new Open Data record is generated.
- **Collections**: `users/{uid}`.

---

## Role Definitions

### Patient Role

**Description**: Regular users who search for healthcare personnel, submit reviews, and request treatment plans.

**Capabilities**:
- ✅ Search and browse healthcare personnel (Doctors/Coordinators)
- ✅ View professional profiles and reviews
- ✅ Submit reviews on professional pages
- ✅ Comment on other reviews (Reddit-style)
- ✅ Post treatment plan requests (visible to facilities/personnel)
- ✅ Receive treatment plan proposals and cost inquiries (paid)
- ✅ Create and manage support tickets
- ✅ Edit own profile

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot edit professional profiles
- ❌ Cannot moderate content

**Account Status**: `active` immediately after role selection

---

### Healthcare Personnel Role

**Description**: Medical professionals (Doctors, Patient Coordinators) who manage their profiles and interact with patients.

**Capabilities**:
- ✅ All patient capabilities
- ✅ Respond to reviews on their profile
- ✅ Edit their healthcarePersonnelAccountData (name, photo, bio, personnelType, etc.)
- ✅ Post links and images on their profile
- ✅ Claim connection to medical facilities
- ✅ Request to moderate medical facility pages (requires admin approval)
- ✅ Respond to treatment plan requests
- ✅ Receive patient inquiries

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot edit their public listing (name, specialty - admin only)
- ❌ Cannot link/unlink their public listing (admin only)
- ❌ Cannot moderate other professionals or delete reviews

**Account Status**: 
- `pending_personal_data` → after role selection
- `active` → after submitting personal personnel data

**Verification**: Professionals are active upon submission of their personal data. Admin can manually link their personal data to a public listing for public visibility.

---

### Admin Role

**Description**: Platform administrators with full access to manage users, content, and data.

**Capabilities**:
- ✅ All patient and healthcare personnel capabilities
- ✅ Access admin dashboard (`/admin`)
- ✅ View and manage healthcare personnel profiles
- ✅ Manually link private user data ↔ public listings
- ✅ Create and edit public listing records
- ✅ Manage support tickets from all users
- ✅ Moderate conversations and reviews
- ✅ Suspend/activate user accounts
- ✅ View all user profiles
- ✅ Approve facility moderation requests from personnel

**Restrictions**:
- ⚠️ Should act responsibly and ethically

---

### Medical Facility Role

**Description**: Clinics, hospitals, and other healthcare centers.

**Capabilities**:
- ✅ Manage facility information
- ✅ Link healthcare personnel to the facility
- ✅ Respond to treatment plan requests
- ✅ Manage facility-specific support tickets

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot moderate other facilities

**Account Status**: 
- `pending_personal_data` → after role selection
- `active` → after submitting facility data
- ⚠️ All admin actions should be logged for audit

**Account Status**: `active` immediately (bypasses GDPR and role selection)

**Assignment**: Auto-assigned via `NEXT_PUBLIC_ADMIN_EMAILS` environment variable

---

### Clinic Role (Future)

**Description**: Medical clinics/facilities that can list doctors and receive patient inquiries.

**Planned Capabilities**:
- List associated doctors with links
- Display location and contact information
- Receive treatment plan requests
- Post clinic information and updates
- Claim doctors (requires doctor or admin confirmation)

**Restrictions**:
- Cannot perform patient actions (reviews, comments)
- Cannot edit doctor profiles directly

---

### Agency Role (Future)

**Description**: Medical tourism agencies that facilitate patient-doctor connections.

**Planned Capabilities**:
- Browse doctors and clinics
- Submit treatment plan requests on behalf of patients
- Manage patient inquiries
- Contact doctors and clinics

**Restrictions**:
- Cannot post reviews
- Cannot moderate content
- Limited to coordination/facilitation role

---

## Permissions Matrix

| Feature                          | Patient | Doctor | Admin | Clinic | Agency |
|----------------------------------|---------|--------|-------|--------|--------|
| **Authentication**               |         |        |       |        |        |
| Google OAuth login               | ✅      | ✅     | ✅    | 🔮     | 🔮     |
| GDPR consent flow                | ✅      | ✅     | ❌    | 🔮     | 🔮     |
| Role selection                   | ✅      | ✅     | ❌    | 🔮     | 🔮     |
| **Profile Management**           |         |        |       |        |        |
| Edit own profile                 | ✅      | ✅     | ✅    | 🔮     | 🔮     |
| View other profiles              | ✅      | ✅     | ✅    | 🔮     | 🔮     |
| **Doctor Features**              |         |        |       |        |        |
| Submit personalDoctorData        | ❌      | ✅     | ✅    | ❌     | ❌     |
| Edit personalDoctorData          | ❌      | ✅     | ✅    | ❌     | ❌     |
| Edit openDoctorData              | ❌      | ❌     | ✅    | ❌     | ❌     |
| Link personal ↔ open data        | ❌      | ❌     | ✅    | ❌     | ❌     |
| Claim clinic connection          | ❌      | ✅     | ✅    | ❌     | ❌     |
| Request clinic moderation        | ❌      | ✅     | ✅    | ❌     | ❌     |
| **Reviews & Comments**           |         |        |       |        |        |
| Submit reviews                   | ✅      | ✅     | ✅    | ❌     | ❌     |
| Respond to reviews (own profile) | ❌      | ✅     | ✅    | ❌     | ❌     |
| Comment on reviews               | ✅      | ✅     | ✅    | ❌     | ❌     |
| Delete any review                | ❌      | ❌     | ✅    | ❌     | ❌     |
| **Treatment Plans**              |         |        |       |        |        |
| Submit treatment plan request    | ✅      | ✅     | ✅    | ❌     | 🔮     |
| Respond to requests              | ❌      | ✅     | ✅    | 🔮     | ❌     |
| **Support**                      |         |        |       |        |        |
| Create support ticket            | ✅      | ✅     | ✅    | 🔮     | 🔮     |
| View own tickets                 | ✅      | ✅     | ✅    | 🔮     | 🔮     |
| View all tickets                 | ❌      | ❌     | ✅    | ❌     | ❌     |
| **Admin Functions**              |         |        |       |        |        |
| Access admin dashboard           | ❌      | ❌     | ✅    | ❌     | ❌     |
| Approve doctor verifications     | ❌      | ❌     | ✅    | ❌     | ❌     |
| Manage openDoctorData            | ❌      | ❌     | ✅    | ❌     | ❌     |
| Suspend accounts                 | ❌      | ❌     | ✅    | ❌     | ❌     |
| Moderate content                 | ❌      | ❌     | ✅    | ❌     | ❌     |

**Legend**: ✅ Allowed | ❌ Not allowed | 🔮 Future/planned

---

## Data Access Patterns

### Public Data (No Authentication Required)
- `open_doctor_data` collection (name, specialty)
- `doctors` collection (public profiles, if exists)
- `clinics` collection (public clinic info)
- `reviews` collection (read-only)

### Authenticated User Data
- Own `users/{uid}` document (read/write)
- Own `support_tickets` (read/write)
- Other users' public profile fields (read-only)

### Doctor-Specific Data
- Own `personalDoctorData` (read/write)
- Linked `openDoctorData` (read-only, admin writes)
- Treatment plan requests (read)

### Admin-Only Data
- All `users` collection documents (read/write)
- All `personalDoctorData` (read/write)
- All `openDoctorData` (read/write)
- All `support_tickets` (read/write)
- Pending doctor approvals (read/write)

---

## Security Notes

### 1. Custom Claims vs. Document-Based Roles
**Current Implementation**: Roles are stored in user documents (`users/{uid}.role`)

**Limitation**: Firestore rules checking `request.auth.token.role` won't work because the client SDK cannot set custom claims.

**Solution**: Use Firebase Admin SDK to set custom claims after profile creation:
```javascript
admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

**Workaround**: Current rules read from `users/{uid}` document directly (less efficient but functional).

### 2. Admin Assignment Security
- Admin emails are hardcoded in `.env.local` via `NEXT_PUBLIC_ADMIN_EMAILS`
- ⚠️ **Risk**: If environment variables are exposed, unauthorized users could be granted admin access
- ✅ **Mitigation**: Use server-side environment variables (without `NEXT_PUBLIC_` prefix) and validate via backend API

### 3. Role Escalation Prevention
- Firestore rules must prevent users from changing their own `role` field
- Only admins (via Admin SDK) should be able to modify user roles
- Client-side role checks are for UX only; always enforce server-side

### 4. Doctor Data Separation
- **personalDoctorData**: Private, editable by doctor and admin
- **openDoctorData**: Public, editable only by admin
- Linking is one-way admin action; doctors cannot self-link or unlink

### 5. Protected Routes
- Use `<ProtectedRoute requiredRole="admin">` wrapper for admin pages
- Always check `accountStatus === 'active'` before granting access
- Pending doctors should be redirected to `/doctor/pending-approval`

### 6. Firestore Security Rules Pattern
```javascript
match /users/{userId} {
  // User can read/write their own profile
  allow read, update: if request.auth.uid == userId;
  
  // Only admins can change role or accountStatus
  allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /open_doctor_data/{docId} {
  // Public read
  allow read: if true;
  
  // Only admins can write
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## Role Transition Workflows

### Role Transitions
Users can request to change or add roles through the support ticketing system. Once a professional role is granted, the user must complete the relevant data application to become `active` in that role. Admin carries out the linking process between user accounts and public directory entries.

### Admin Demotion (Emergency)
1. Admin removes email from `NEXT_PUBLIC_ADMIN_EMAILS`
2. Redeploy application
3. User's `role` remains `admin` in database until manually changed
4. Admin manually updates user document: `role: 'patient'` or `role: 'doctor'`
5. User loses admin access on next login

---

## Future Enhancements

1. **Role-Based Notifications**: Different notification preferences per role
2. **Multi-Role Support**: Users can have multiple roles (e.g., doctor + clinic owner)
3. **Granular Permissions**: Fine-grained permissions within roles (e.g., admin subtypes)
4. **Role History**: Audit log of role changes
5. **Temporary Elevated Access**: Time-limited admin permissions for support staff
6. **API Key Authentication**: For clinic/agency API integrations

---

**Last Updated**: January 11, 2026  
**Maintained By**: Development Team
