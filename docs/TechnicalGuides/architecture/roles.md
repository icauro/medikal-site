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

| Role                   | Description                                      | Signup Flow                                              | Status |
|------------------------|--------------------------------------------------|----------------------------------------------------------|----|
| `patient`              | End users seeking medical services               | GDPR → Role selection → Active                           | ✅ Active |
| `healthcare_personnel` | Medical professionals with personal profiles     | GDPR → Role selection → Personal personnel data → Active | ⚠️ **Deprecated** (admin only) |
| `admin`                | Platform administrators                          | Auto-assigned via ADMIN_EMAILS                           | ✅ Active |
| `medical_facility`     | Medical facilities (Clinics, Hospitals, etc.)   | GDPR → Role selection → Fill facility data on profile page→ **Pending Verification** → Active | ✅ Active |
| `agency`               | Medical tourism agencies                         | GDPR → Role selection → Fill agency data on profile page→ **Pending Verification** → Active | ⚠️ **Deprecated** (admin only) |

---

Professional Roles: term to refer a group of roles included healthcare_personnel and medical_facility

**Note on Disabled Roles**: 
- `healthcare_personnel` and `agency` are no longer available for user signup
- These roles are now **admin-only** and can only be assigned by administrators
- Existing accounts with these roles remain functional

## Data Architecture: Listing data vs Account data

The platform maintains a strict separation between account ownership (Account Data) and directory visibility (Listing Data).

###  Listing Data
- **Nature**: Public-facing record that represents the entity on the website.
- **Primary Field**: `slug` (used for the entity's dedicated URL).
- **Independence**: Listing Data records **can exist without a linked user**. This allows admins to populate the directory with hospitals or doctors who haven't registered an account yet.
- **Collections**: `healthcare_personnel_listings`, `medical_facility_listings`, `agency_listings`.

### Account Data
- **Nature**: Private user-owned data required for authentication and onboarding.
- **Constraint**: **Personal Data Professional Roles cannot exist without a corresponding Open Data record.** 
- **Linking**: Every user with a professional role must be linked to an Open Data record. During account creation, if no link exists, a new Listing data record is generated.
- **Collections**: `users/{uid}`.

---

## Role Definitions

### Patient Role

**Description**: Regular users who search in Healtcare database, submit reviews, and request treatment plans.

**Capabilities**:
- ✅ View professional profiles and reviews
- ✅ Submit reviews on professional pages
- ✅ Comment on other reviews (Reddit-style)
- ✅ Post treatment plan requests (visible to facilities/agencyies)
- ✅ Receive treatment plan proposals and cost inquiries
- ✅ Create and manage support their own tickets (max 3 unresoveld at the same time)
- ✅ Edit own profile

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot edit professional profiles
- ❌ Cannot moderate content

**Account Status**: `active` immediately after role selection

---

### Healthcare Personnel Role

**Status**: ⚠️ **DEPRECATED FOR USER SIGNUP** - Now admin-only assignment

**Description**: Medical professionals (Doctors, Patient Coordinators) who manage their profiles and interact with patients.

**Important Note**: Users can no longer sign up as healthcare personnel. This role is now assigned and managed exclusively by administrators. Existing healthcare personnel accounts remain functional.

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
- `active` → assigned directly by admin
- Healthcare personnel are immediately active when assigned by admin

**Admin Assignment Process**:
1. Admin accesses admin dashboard
2. Admin opens UserCRUDModal
3. Admin creates new user with `role: 'healthcare_personnel'`
4. Admin fills in healthcare personnel data (specialization, credentials, etc.)
5. Admin optionally links to public healthcare_personnel_listings
6. User becomes active immediately

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

### Medical Facility Role

**Description**: Clinics, hospitals, and other healthcare centers.

**Signup Flow**: GDPR → Role selection → Fill facility data → **Pending Verification** → Active

**Capabilities**:
- ✅ View facility information on profile page (read-only)
- ✅ Respond to treatment plan requests
- ✅ Create and manage support tickets
- ✅ Edit own profile information (pending admin approval)

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot publish facility information until verified by admin
- ❌ Cannot moderate other facilities

**Account Status**: 
- `pending_personal_data` → after role selection
- `pending_verification` → after submitting facility data (waiting for admin approval)
- `active` → after admin verification and approval

**Verification Process**:
1. Medical facility user completes signup and fills facility data (status: `pending_personal_data`)
2. User data submitted to admin for review
3. Admin reviews facility details and verifies legitimacy
4. Admin activates account via UserCRUDModal (status: `active`)
5. Facility information becomes visible on public listing
6. User now has full access to respond to treatment plans and support

---


### Agency Role

**Status**: ⚠️ **DEPRECATED FOR USER SIGNUP** - Now admin-only assignment

**Description**: Medical tourism agencies that facilitate patient-doctor connections.

**Important Note**: Users can no longer sign up as agencies. This role is now assigned and managed exclusively by administrators. Existing agency accounts remain functional.

**Capabilities** (when assigned by admin):
- ✅ All patient capabilities
- ✅ Browse doctors and clinics
- ✅ Submit treatment plan requests on behalf of patients
- ✅ Manage patient inquiries
- ✅ Contact doctors and clinics
- ✅ Create and manage support tickets
- ✅ Edit own agency information (pending admin approval)

**Restrictions**:
- ❌ Cannot access admin pages
- ❌ Cannot post reviews
- ❌ Cannot publish agency information until verified by admin
- ❌ Cannot moderate content
- ❌ Limited to coordination/facilitation role

**Account Status**: 
- `active` → assigned directly by admin
- Agencies are immediately active when assigned by admin

**Admin Assignment Process**:
1. Admin accesses admin dashboard
2. Admin opens UserCRUDModal
3. Admin creates new user with `role: 'agency'`
4. Admin fills in agency data (name, country, province, etc.)
5. Admin optionally links to public agency_listings
6. User becomes active immediately

**Verification**: Agencies are active upon admin assignment. Admin can manually link their account data to a public listing for public visibility.

---

## Permissions Matrix

| Feature                             | Patient |  Clinic | Agency |Admin  |
| :---------------------------------- | :-----: |  :----: | :----: |:----: |
| **Authentication**                  |         |         |        |       |
| Google OAuth login                  |   ✅    |    ✅   |   ✅   |  ✅   |
| GDPR consent flow                   |   ✅    |    ✅   |   ✅   |  ❌   |
| **Profile Management**              |         |         |        |       |
| Edit own profile                    |   ✅    |    ✅   |   ✅   |  ✅   |
| View other profiles                 |   ✅    |    ✅   |   ✅   |  ✅   |
| **Reviews & Comments**              |         |         |        |       |
| Submit reviews                      |   ✅    |    ❌   |   ❌   |  ✅   |
| Respond to reviews (own profile)    |   ❌    |    ✅   |   ✅   |  ✅   |
| Comment on reviews                  |   ✅    |    ❌   |   ❌   |  ✅   |
| Delete any review                   |   ❌    |    ❌   |   ❌   |  ✅   |
| **Treatment Plans**                 |         |         |        |       |
| Submit treatment plan request       |   ✅    |    ❌   |   ❌   |  ❌   |
| Respond to requests                 |   ❌    |    ✅   |   ✅   |  ❌   |
| **Support**                         |         |         |        |       |
| Create support ticket               |   ✅    |    ✅   |   ✅   |  ✅   |
| View own tickets                    |   ✅    |    ✅   |   ✅   |  ✅   |
| View all tickets                    |   ❌    |    ❌   |   ❌   |  ✅   |
| **Admin Functions**                 |         |         |        |       |
| Access admin dashboard              |   ❌    |    ❌   |   ❌   |  ✅   |
| Approve professional verifications        |   ❌    |    ❌   |   ❌   |  ✅   |
| Manage listing data               |   ❌    |    ❌   |   ❌   |  ✅   |
| Suspend accounts                    |   ❌    |    ❌   |   ❌   |  ✅   |
| Moderate content                    |   ❌    |    ❌   |   ❌   |  ✅   |

**Legend**: ✅ Allowed | ❌ Not allowed | 🔮 Future/planned

---