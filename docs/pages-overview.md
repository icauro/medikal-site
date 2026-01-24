# App Pages & Responsibilities Overview

This document provides a high-level overview of all main pages/routes in the Medikal Site app, their responsibilities, and access restrictions. Use this as a reference for development, onboarding, and validation.

**Last Updated**: January 24, 2026

---

## Table of Contents
- [Public Pages](#public-pages)
- [Authentication & Profile](#authentication--profile)
- [Healthcare Professional Features](#healthcare-professional-features)
- [Patient Features](#patient-features)
- [Admin Features](#admin-features)
- [Support & Legal](#support--legal)

---

## Public Pages

| Route                                     | Purpose                                      | Access        |
|-------------------------------------------|----------------------------------------------|--------------|
| `/`                                       | Home page with search and featured content   | Public       |
| `/about`                                  | About the platform                           | Public       |
| `/blogs`                                  | Blog articles and medical content            | Public       |
| `/legal`                                  | Legal information (Terms, Privacy)           | Public       |
| `/healthcare-database`                    | Comprehensive healthcare provider search/filter | Public |
| `/healthcare-personnel/[slug]`            | Healthcare professional profile page        | Public       |
| `/medical-facilities/[slug]`              | Medical facility profile page with doctors   | Public       |
| `/agencies/[slug]`                        | Medical agency profile page                  | Public       |
| `/auth/callback`                          | OAuth callback handler (internal)            | System       |

## Authentication & Profile

| Route                                     | Purpose                                 | Access        |
|-------------------------------------------|-----------------------------------------|--------------|
| `/login`                                  | Google OAuth login page                 | Public       |
| `/signup/role-selection`                  | Choose user role during signup (Patient, Healthcare Personnel, Medical Facility, or Agency) | Public  |
| `/profile`                                | User profile - view/edit personal data  | Authenticated|

## Healthcare Professional Features

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/add-review`                         | Submit review for a healthcare professional | Authenticated|
| `/treatment-plan`                     | Create/view treatment plan requests     | Patient/Healthcare Personnel |

## Patient Features

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/treatment-plan`                     | Submit treatment plan request, view doctor responses | Patient |
| `/add-review`                         | Add reviews and ratings for doctors/facilities | Patient |

## Admin Features

| Route                                     | Purpose                                 | Access        |
|-------------------------------------------|-----------------------------------------|--------------|
| `/admin`                                  | Admin dashboard with user/listing management | Admin        |
| `/admin/support`                          | Support ticket management and responses | Admin        |
| **Admin Modals** (in-page CRUD)                                                        |
| - UserCRUDModal                           | Create/edit/delete user accounts (all roles) | Admin |
| - HealthcarePersonnelListingCRUDModal     | Manage public healthcare personnel listings | Admin |
| - MedicalFacilityListingCRUDModal         | Manage public medical facility listings | Admin |
| - AgencyListingCRUDModal                  | Manage public agency listings           | Admin |

## Support & Legal

| Route                                 | Purpose                                 | Access        |
|---------------------------------------|-----------------------------------------|--------------|
| `/support`                            | Support request creation and management | Authenticated|
| `/support/tickets/[id]`               | View/respond to specific support ticket | Authenticated|
| `/legal`                              | Terms of Service and Privacy Policy     | Public       |

---


## Architecture & Key Concepts

### Multi-Step Onboarding Flow
1. **Google Login**: User signs in with Google
2. **GDPR Consent**: User accepts GDPR terms (status: `pending_gdpr` → `pending_role`)
3. **Role Selection**: User chooses role: Patient, Healthcare Personnel, Medical Facility, or Agency
4. **Personal Data**: Role-specific form completion (status: `pending_role` → `pending_personal_data` or `active`)
5. **Active Status**: Account ready to use (status: `active`)

All status transitions are enforced by `SignupFlowManager.tsx` - users cannot skip steps.

### User Roles & Permissions
| Role | Can Do | Cannot Do |
|------|--------|----------|
| **Patient** | Post reviews, request treatment plans, view professional profiles | Access admin features, create listings |
| **Healthcare Personnel** | Respond to treatment plans, view own listing, claim facilities | Create/edit own listing (admin-controlled) |
| **Medical Facility** | Manage facility info, claim doctors | Create/edit public listing directly |
| **Agency** | Manage agency info | Create/edit public listing directly |
| **Admin** | Manage all users, create/edit all listings, handle support tickets, verify professionals | None - full access |

### Data Structure Overview

#### Private User Data (`users/{uid}`)
- **All Roles**: Basic profile (email, display name, photo, role, status, GDPR consent)
- **Healthcare Personnel**: Credentials, specialization, experience, education, employment info
- **Patient**: Medical history preferences, emergency contact, location
- **Medical Facility/Agency**: Organization details, contact info, services

#### Public Listings (Admin-Managed)
- **healthcare_personnel_listings**: Public professional profiles (linked to user via `userId`)
- **medical_facility_listings**: Public facility listings (linked to user via `userId`)
- **agency_listings**: Public agency listings (linked to user via `userId`)

#### Linking System
- **Two-Way Links**: User ↔ Listing relationships are bidirectional
- **Admin-Controlled**: Only admins can create/modify listing links
- **Verification Tracking**: Listings tracked with `verifiedAt` timestamp and `verifiedBy` admin email

### Medical Specializations (Current)
- Plastic, Reconstructive and Aesthetic Surgery
- Dermatology

### Medical Facility Types (Current)
- Solo Practice
- Polyclinic
- Clinic
- Health Center
- Hospital
- Medical Center
- Private Oral and Dental Health Center
- Private Oral and Dental Health Polyclinic
- Private Oral and Dental Health Hospital

### Support System
- **Support Tickets**: Users can create support tickets with attachments
- **Threading**: Admin-user conversation via message threads
- **Categories & Priority**: Tickets categorized and prioritized (Low/Medium/High/Urgent)
- **Status Tracking**: Open, In Progress, Resolved, Closed statuses

### Treatment Plans
- **Patient Submission**: Patients submit treatment plans with medical details and budget
- **Doctor Tagging**: Plans tagged with medical procedure types (e.g., Rhinoplasty, Blepharoplasty)
- **Doctor Responses**: Healthcare personnel with matching tags can respond with recommendations
- **Cost Estimation**: Doctors provide estimated costs and treatment duration

## Technical Implementation

### Database & Authentication
- **Auth**: Firebase Authentication (Google OAuth only)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Frontend Framework**: Next.js 16 + React (all pages use `"use client"`)
- **State Management**: React Context (AuthContext) + Supabase real-time subscriptions

### Security Features
- **RLS Policies**: Database-level access control (Firestore rules equivalent)
- **Protected Routes**: `<ProtectedRoute>` component enforces client-side access control
- **Admin Verification**: Critical operations (listing creation, verification) require admin action
- **GDPR Enforcement**: Platform requires GDPR consent before account activation

### UI Components & Modals
- **Universal UserCRUDModal**: Single modal for all user database operations (adapts by role)
- **Listing CRUD Modals**: Specialized modals for each listing type (Healthcare Personnel, Medical Facility, Agency)
- **Comments System**: Reddit-style comments on professional profiles with voting
- **Toast Notifications**: User feedback system for actions and errors

## Design Principles

### Data Encapsulation
- Public data separate from private user profiles
- Admin-only write access to public listings
- Bidirectional syncing for user-listing relationships

### User Privacy
- Location data optional for patients
- GDPR consent mandatory before account activation
- Users cannot directly modify own professional listings (admin controls verification)

### Professional Verification
- Doctors/facilities verified by admin before public listing creation
- Verification timestamp and admin email tracked for audit trail
- Verification status replaces boolean flag (null = unverified, timestamp = verified)

---

## Important Notes

### Protected Routes
- All protected routes use the `ProtectedRoute` component and enforce role-based access control
- Admin pages require the `admin` role
- Professional features are separated by role (Healthcare Personnel, Medical Facility, Agency)
- Patients have access to review, treatment plan, and support features

### Key Workflows
1. **User Registration**: Google OAuth → GDPR Consent → Role Selection → Role-Specific Form → Activation
2. **Professional Verification**: Admin creates/edits professional listing → Sets verification timestamp → Professional linked to listing
3. **Treatment Plan**: Patient submits plan with procedure tags → Matching doctors notified → Doctors respond with costs
4. **Support Request**: User creates ticket → Admin responds in thread → Ticket resolved and closed

### Removed Fields (as of Jan 24, 2026)
The following fields have been removed from HealthcarePersonnelAccountData to reduce data collection:
- `licenseNumber`, `licenseIssuingAuthority`, `licenseExpirationDate`
- `medicalFacilityAddress`
- `motivation`
- `verified` (replaced with `verifiedAt` timestamp and `verifiedBy` admin email)
- `verificationNotes`

Verification now tracked via `verifiedAt?: Date` and `verifiedBy?: string` fields.

### Important Paths
- **Type Definitions**: [lib/types.ts](../lib/types.ts) - Source of truth for all interfaces
- **Auth Context**: [lib/contexts/AuthContext.tsx](../lib/contexts/AuthContext.tsx) - Firebase integration
- **Signup Flow Manager**: [app/components/SignupFlowManager.tsx](../app/components/SignupFlowManager.tsx) - Enforces onboarding steps
- **Protected Route**: [app/components/ProtectedRoute.tsx](../app/components/ProtectedRoute.tsx) - Access control component
- **Database Rules**: [firebase/firestore.rules](../firebase/firestore.rules) - RLS policies

### Last Updated
- **Date**: January 24, 2026
- **Update Type**: Comprehensive revision with current architecture, workflow, and data structure documentation
- **Status**: ✅ Current and accurate
