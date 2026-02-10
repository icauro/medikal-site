# Supabase Integration Overview

This document provides a high-level overview of how Supabase integrates with your Medikal Site project.

---

## 🏗️ Architecture

```
Medikal Site (Next.js 16)
│
├── Client Layer (React Components)
│   ├── app/components/
│   ├── app/pages/
│   └── app/admin/
│
├── Auth Layer (Supabase Auth)
│   ├── lib/supabase.ts          ← Supabase client
│   ├── lib/contexts/AuthContext.tsx  ← Auth management
│   └── app/auth/callback/route.ts    ← OAuth handler
│
├── Data Layer (Supabase PostgreSQL)
│   ├── users (extends auth.users)
│   ├── healthcare_personnel_listings
│   ├── medical_facility_listings
│   ├── agency_listings
│   ├── reviews
│   ├── comments
│   ├── support_tickets
│   ├── treatment_plans
│   └── [with RLS policies]
│
└── Storage Layer (Supabase Storage)
    └── media bucket (for images)
```

---

## 📦 Core Files

### 1. Supabase Client (`lib/supabase.ts`)
**Purpose**: Initialize Supabase client and export helper functions

```typescript
export const supabase = createClient(url, key);
export const convertTimestampsToDates = (data) => {...}
export const getCurrentUser = async () => {...}
export const signInWithGoogle = async () => {...}
export const signOut = async () => {...}
export const getSession = async () => {...}
```

**Use in**: Any file that needs to query the database

---

### 2. Auth Context (`lib/contexts/AuthContext.tsx`)
**Purpose**: Manage authentication state and user profile

```typescript
{
  user,              // Supabase auth user (from auth.users)
  userProfile,       // Extended profile (from users table)
  loading,           // Loading state
  signInWithGoogle,  // Google OAuth login
  logout,            // Sign out
  updateUserRole,    // Set user role
  refreshUserProfile,// Reload from DB
  acceptGDPR,        // Accept GDPR
  deleteAccount,     // Full account deletion
}
```

**Use in**: Wrap entire app in `<AuthProvider>`

---

### 3. Environment Variables (`.env.local`)
**Required**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
```

**Optional**:
```
SUPABASE_SERVICE_ROLE_KEY=...  # For server-only operations
```

---

## 🗄️ Database Schema

### Tables Overview

| Table | Purpose | Access |
|-------|---------|--------|
| `users` | User profiles + roles | Private (RLS) |
| `healthcare_personnel_listings` | Doctor listings | Public read, admin write |
| `medical_facility_listings` | Hospital listings | Public read, admin write |
| `agency_listings` | Agency listings | Public read, admin write |
| `reviews` | Ratings & reviews | Public read, user write |
| `comments` | Comments on listings | Public read, user write |
| `support_tickets` | Support requests | Private (RLS) |
| `treatment_plans` | Medical plans | Private (RLS) |
| `ticket_responses` | Support responses | Private (RLS) |
| `treatment_plan_responses` | Plan responses | Private (RLS) |

### Field Naming Convention
- All fields use **snake_case** (not camelCase)
- All dates are **ISO 8601 strings** (not Date objects)
- Foreign keys use `{table}_id` pattern
- Boolean flags use `is_*` pattern (e.g., `is_deleted`)

---

## 🔐 Authentication Flow

### Google OAuth Flow
```
1. User clicks "Sign in with Google"
   ↓
2. Opens OAuth consent screen
   ↓
3. Redirects to app/auth/callback/route.ts with code
   ↓
4. Route exchanges code for session
   ↓
5. Redirects to /signup/role-selection
   ↓
6. AuthContext detects logged-in user
   ↓
7. Creates/loads user profile from database
   ↓
8. Checks accountStatus → directs to next step
```

### Account Status Flow
```
pending_gdpr
    ↓
[User accepts GDPR]
    ↓
pending_role
    ↓
[User selects role]
    ↓
pending_personal_data (optional for some roles)
    ↓
[User fills profile]
    ↓
active ✓
```

---

## 🔄 Common Operations

### Fetching Data
```typescript
import { supabase } from '@/lib/supabase';

// Get one record
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Get multiple records
const { data } = await supabase
  .from('agency_listings')
  .select('*')
  .order('created_at', { ascending: false });

// Filter data
const { data } = await supabase
  .from('reviews')
  .select('*')
  .eq('status', 'published')
  .eq('listing_id', listingId);
```

### Writing Data
```typescript
// Insert
const { data, error } = await supabase
  .from('support_tickets')
  .insert({
    user_id: user.id,
    title: 'My issue',
    description: '...',
  })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('users')
  .update({ role: 'admin' })
  .eq('id', userId);

// Delete
const { error } = await supabase
  .from('comments')
  .delete()
  .eq('id', commentId);

// Soft delete
const { error } = await supabase
  .from('comments')
  .update({ is_deleted: true })
  .eq('id', commentId);
```

---

## 🛡️ Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Public Listings (Read-Only)
```sql
-- Anyone can read
CREATE POLICY "Anyone can read listings"
  ON healthcare_personnel_listings FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admin only write"
  ON healthcare_personnel_listings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### User Profiles (Scoped Access)
```sql
-- Users can read own, admins can read all
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');
```

### Support Tickets (Private)
```sql
-- Users can only read own tickets
CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
```

---

## 🔍 Debugging

### Check Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Test Query
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1);

if (error) console.error('Query failed:', error);
else console.log('Data:', data);
```

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies;
```

### View Logs
Go to Supabase Dashboard → Logs → choose service to view errors

---

## 📱 User Roles & Data

### Role-Specific Data Tables

Each user role stores extended data in a dedicated normalized table:

```typescript
// Patient User Data
patient_user_data: {
  id: UUID,
  user_id: UUID,
  medical_history: string[],
  preferred_language: string,
  country: string,
  province: string,
  city: string,
  emergency_contact_name: string,
  emergency_contact_phone: string,
  interested_procedures: string[],
  preferred_facilities: string[]
}

// Healthcare Personnel User Data
healthcare_personnel_user_data: {
  id: UUID,
  user_id: UUID,
  personnel_type: string,
  specialization: string,
  phone_number: string,
  date_of_birth: string,
  country: string,
  province: string,
  city: string,
  bio: string,
  photo_url: string,
  years_of_experience: number,
  medical_school: string,
  graduation_year: number,
  certifications: string[],
  national_id_number: string,
  current_medical_facility_id: UUID,
  position: string,
  procedure_tags: string[],
  listing_id: UUID,
  verified_at: timestamp,
  verified_by: UUID
}

// Medical Facility User Data
medical_facility_user_data: {
  id: UUID,
  user_id: UUID,
  name: string,
  facility_type: string,
  phone: string,
  email: string,
  country: string,
  province: string,
  city: string,
  address: string,
  website: string,
  description: string,
  logo_url: string,
  specializations: string[],
  services: string[],
  contact_person: string,
  owner_name: string,
  tax_id_number: string,
  registration_number: string,
  established_year: number,
  number_of_doctors: number,
  internal_notes: string,
  listing_id: UUID,
  verified: boolean,
  verification_notes: string,
  verified_at: timestamp,
  verified_by: UUID,
  claimed_doctor_ids: UUID[],
  verified_doctor_ids: UUID[]
}

// Agency User Data
agency_user_data: {
  id: UUID,
  user_id: UUID,
  name: string,
  phone: string,
  email: string,
  country: string,
  province: string,
  city: string,
  address: string,
  website: string,
  description: string,
  logo_url: string,
  services_offered: string[],
  focus_countries: string[],
  contact_person: string,
  owner_name: string,
  tax_id_number: string,
  registration_number: string,
  established_year: number,
  internal_notes: string,
  listing_id: UUID,
  verified: boolean,
  verification_notes: string,
  verified_at: timestamp,
  verified_by: UUID
}
```

### Accessing User Data
```typescript
// In TypeScript
import { supabase } from '@/lib/supabase';

// Get user with their patient data
const { data: user } = await supabase
  .from('users')
  .select('*, patient_user_data(*)')
  .eq('id', userId)
  .single();

// Data is two-way linked
user.patientUserDataId  // FK to patient_user_data table
user.patientUserData    // Actual data (if selected with *)
```

---

## 🚀 Performance Optimization

### Indexes
All frequently queried fields have indexes:
```sql
idx_users_email
idx_users_role
idx_healthcare_personnel_listings_slug
idx_reviews_status
idx_comments_listing
idx_support_tickets_user
idx_treatment_plans_status
```

### Querying Best Practices
```typescript
// Good: Select only needed columns
const { data } = await supabase
  .from('users')
  .select('id, email, role')
  .eq('role', 'admin');

// Bad: Select all columns
const { data } = await supabase
  .from('users')
  .select('*');

// Good: Use limit for pagination
const { data } = await supabase
  .from('reviews')
  .select('*')
  .range(0, 20);
```

---

## 🔗 Relationships

### User ↔ Listing Linking
Two-way linking maintained automatically:

```
User (users table)
  └─ healthcare_personnel_account_data.listingId
     ↓
HealthcarePersonnelListing (table)
  └─ user_id
```

When linking:
1. User profile gets `listingId`
2. Listing gets `user_id`
3. Both automatically synced via admin operations

---

## 📚 Learning Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Guide**: https://supabase.com/docs/guides/getting-started/frameworks/nextjs
- **Auth Guide**: https://supabase.com/docs/guides/auth
- **Database Guide**: https://supabase.com/docs/guides/database
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist After Setup

- [ ] Supabase project created
- [ ] Database schema imported (SUPABASE_SCHEMA.sql)
- [ ] Google OAuth configured
- [ ] Environment variables set in `.env.local`
- [ ] `npm install` completed
- [ ] `npm run dev` runs without errors
- [ ] Google login works
- [ ] User profile created in database
- [ ] Admin role works correctly
- [ ] GDPR flow works
- [ ] Role selection works

---

## 🆘 Troubleshooting

**"Table does not exist"**
→ Ensure SUPABASE_SCHEMA.sql was fully executed in SQL Editor

**"RLS policy violation"**
→ Check user is authenticated and RLS policies allow operation

**"Field does not exist"**
→ Check field names use snake_case and match schema exactly

**"Auth not working"**
→ Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

**"OAuth redirects wrong URL"**
→ Check OAuth callback URL in Supabase matches http://localhost:3000/auth/callback
