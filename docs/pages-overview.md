# App Pages & Responsibilities Overview

This document provides a high-level overview of all main pages/routes in the Medikal Site app, their responsibilities, and access restrictions. Use this as a reference for development, onboarding, and validation.

---

## Table of Contents
- [Public Pages](#public-pages)
- [Authentication & Profile](#authentication--profile)
- [Doctor Features](#doctor-features)
- [Admin Features](#admin-features)
- [Support & Misc](#support--misc)

---

## Public Pages

| Route                | Purpose                                      | Access        |
|----------------------|----------------------------------------------|--------------|
| `/`                  | Home page, search, featured doctors          | Public       |
| `/about`             | About the platform                           | Public       |
| `/blogs`             | Blog articles                                | Public       |
| `/doctors`           | List/search doctors                          | Public       |
| `/doctors/[slug]`    | Doctor profile page                          | Public       |

## Authentication & Profile

| Route                        | Purpose                                 | Access        |
|------------------------------|-----------------------------------------|--------------|
| `/login`                     | Google OAuth login                      | Public       |
| `/signup/role-selection`     | Choose user role                        | Public       |
| `/signup/doctor-application` | Doctor application form                 | Public       |
| `/profile`                   | User profile (view/edit)                | Authenticated|

## Doctor Features

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/doctor/pending-approval`            | Shown to doctors awaiting verification  | Doctor       |
| `/doctor/verify`                      | Doctor verification submission          | Doctor       |
| `/add-review`                         | Add review for a doctor                 | Authenticated|
| `/treatment-plan`                     | View/manage treatment plans             | Doctor       |

## Admin Features

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/admin`                              | Admin dashboard                         | Admin        |
| `/admin/doctors`                      | Manage doctors                          | Admin        |
| `/admin/doctors/create`               | Add new doctor                          | Admin        |
| `/admin/doctors/edit/[id]`            | Edit doctor profile                     | Admin        |
| `/admin/verifications`                | Approve doctor verifications            | Admin        |
| `/admin/support`                      | Manage support tickets                  | Admin        |

## Support & Misc

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/support`                            | User support main page                  | Authenticated|
| `/support/tickets/[id]`               | View specific support ticket            | Authenticated|
| `/unauthorized`                       | Shown on access denied                  | Public       |

---


## Design Notes Summary

### Medical Categories (Sample)
- Rhinoplasty (Nose job)
- Septorhinoplasty (Nose job + breathing correction)
- Blepharoplasty (Eyelid surgery / Eye lift)
- Rhytidectomy (Facelift)
- Mini-rhytidectomy (Mini facelift)
- Brow lift / Forehead lift (Eyebrow lift)
- Mentoplasty (Chin surgery)
- Genioplasty (Chin reshaping – sliding chin)
- Otoplasty (Ear pinning / Ear correction)
- Buccal Fat Pad Excision (Buccal fat removal / Cheek slimming)
- Lip lift (Subnasal lip lift)

### MVP Goals & User Flows
- User login (Google only)
- Doctor page with About and Reviews tabs (site and Google reviews)
- Clinic page listing doctors
- Unified signup for all users; doctors submit a form for approval
- Doctor accounts are on hold until admin approval

### User Types & Permissions
- **Patients**: Post reviews, comment on reviews (Reddit style), post treatment plan requests, receive treatment plans/costs (paid), Google login
- **Doctors**: Respond to reviews, edit their page, post links/images, claim clinic connections, request to moderate clinic page, Google login
- **Admins**: Moderate conversations, approve doctors, manage clinics, Google login
- **Clinics**: List doctors, claim doctors, state location/contact info

### Technical Stack
- Auth: Firebase Auth (Google only)
- Data: Firestore Database (reviews, doctor data)
- Media: Firebase Storage (images, videos)
- UI: Dark, clean, modern

---

## Notes
- All protected routes use the `ProtectedRoute` component and check user roles.
- Admin-only pages require the `admin` role.
- Doctor and patient features are separated by role.
- This document should be updated as new pages/features are added.
