# App Pages & Responsibilities Overview

This document provides a high-level overview of all main pages/routes in the Medikal Site app, their responsibilities, and access restrictions. Use this as a reference for development, onboarding, and validation.

**Last Updated**: January 26, 2026

---

## Table of Contents
- [Public Pages](#public-pages)
- [Role-specific Pages](#role-specific-pages)
- [Support & Legal](#support--legal)

---

## Public Pages

| Route | Purpose | Access |
|---|---|---:|
| `/` | Home page with search, featured content and quick links | Public |
| `/about` | About the platform | Public |
| `/blogs` | Blog articles and medical content | Public |
| `/legal` | Legal information landing page (links to privacy & terms) | Public |
| `/legal/privacy-policy` | Privacy policy text and contact info | Public |
| `/legal/terms-of-service` | Terms of service and usage conditions | Public |
| `/healthcare-database` | Search and filter healthcare providers and facilities | Public |
| `/healthcare-personnel/[slug]` | Public profile page for a healthcare professional | Public |
| `/medical-facilities/[slug]` | Public profile page for a medical facility | Public |
| `/agencies/[slug]` | Public profile page for a medical tourism agency | Public |
| `/blogs/[slug]` | Individual blog article | Public |

---

## Role-specific Pages

### Patient

| Route | Purpose | Access |
|---|---|---:|
| `/login` | Google OAuth sign-in | Public |
| `/signup/role-selection` | Choose role during signup | Public |
| `/profile` | View / edit personal profile | Authenticated (patient) |
| `/treatment-plan` | Create treatment plan request; view responses | Patient |
| `/add-review` | Submit reviews and ratings | Patient |
| `/support` | Create support tickets | Authenticated |

### Healthcare Personnel (admin-assigned)

| Route | Purpose | Access |
|---|---|---:|
| `/profile` | View / edit personal professional data (private) | Authenticated (healthcare_personnel)
| `/treatment-plan` | View and respond to patient treatment requests | Healthcare personnel |
| `/add-review` | Respond to reviews on own profile | Healthcare personnel |
| `/support` | Create/view support tickets | Authenticated |

### Medical Facility

| Route | Purpose | Access |
|---|---|---:|
| `/profile` | Facility account profile (manage facility data) | Authenticated (medical_facility)
| `/treatment-plan` | Receive/respond to treatment requests | Medical facility |
| `/support` | Create/view support tickets | Authenticated |

### Agency

| Route | Purpose | Access |
|---|---|---:|
| `/profile` | Agency account profile (manage agency data) | Authenticated (agency)
| `/treatment-plan` | Submit treatment requests on behalf of patients | Agency |
| `/support` | Create/view support tickets | Authenticated |

### Admin

| Route | Purpose | Access |
|---|---|---:|
| `/admin` | Admin dashboard — user & listing management | Admin |
| `/admin/support` | Support ticket management and responses | Admin |
| `/admin/listings` | Create / edit public listings (healthcare / facility / agency) | Admin |
| `/admin/users` | Create / edit / suspend users (UserCRUDModal) | Admin |

---

## Support & Legal

| Route | Purpose | Access |
|---|---|---:|
| `/support` | Create support request and view own tickets | Authenticated |
| `/support/tickets/[id]` | View/respond to specific support ticket (thread) | Authenticated |
| `/legal` | Legal landing (links to privacy & terms) | Public |
| `/legal/privacy-policy` | Privacy policy | Public |
| `/legal/terms-of-service` | Terms of service | Public |

---

If you'd like, I can also:
- update internal links across docs to match any filename changes, or
- generate a short TOC fragment to insert into the site navigation.