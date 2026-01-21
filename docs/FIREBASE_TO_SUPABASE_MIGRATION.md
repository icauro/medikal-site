# Firebase to Supabase Migration Guide

## ✅ Completed Setup

### 1. Core Configuration Files Created
- ✅ [lib/supabase.ts](../../lib/supabase.ts) - Supabase client initialization with helper functions
- ✅ [lib/contexts/AuthContext.tsx](../../lib/contexts/AuthContext.tsx) - Converted from Firebase Auth to Supabase Auth
- ✅ [docs/SUPABASE_SCHEMA.sql](../SUPABASE_SCHEMA.sql) - Complete PostgreSQL schema with RLS policies
- ✅ [.env.example](.../env.example) - Environment variables template
- ✅ [package.json](../../package.json) - Updated dependencies (Firebase removed, @supabase/supabase-js added)

### 2. Pages Converted
- ✅ [app/agencies/page.tsx](../../app/agencies/page.tsx) - Converted to use Supabase queries

## 🚀 Next Steps to Complete Migration

### Phase 1: Supabase Project Setup (One-time)
1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Copy your `Project URL` and `Anon Key` from Project Settings

2. **Run Database Schema**
   - Go to SQL Editor in Supabase Dashboard
   - Copy the entire contents of `docs/SUPABASE_SCHEMA.sql`
   - Paste and execute it
   - Verify all tables are created with proper RLS policies

3. **Configure Authentication**
   - Go to Authentication > Providers in Supabase Dashboard
   - Enable Google OAuth provider
   - Add your Google OAuth credentials from Google Cloud Console
   - Set redirects: `http://localhost:3000/auth/callback` (dev) and your production URL

4. **Set Environment Variables**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local
   
   # Fill in your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com
   ```

### Phase 2: Install Dependencies
```bash
npm install
```

### Phase 3: Create Auth Callback Route (Required)
Create `app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin + '/signup/role-selection')
}
```

### Phase 4: Convert All Remaining Files

#### **Analytics & Admin Pages**
- [ ] `app/admin/page.tsx` - User management with Supabase
- [ ] `app/admin/support/page.tsx` - Support ticket admin
- [ ] `app/admin/components/UserCRUDModal.tsx` - User CRUD operations
- [ ] `app/admin/components/HealthcarePersonnelListingCRUDModal.tsx`
- [ ] `app/admin/components/MedicalFacilityListingCRUDModal.tsx`
- [ ] `app/admin/components/AgencyListingCRUDModal.tsx`

#### **Core Pages**
- [ ] `app/healthcare-personnel/page.tsx`
- [ ] `app/healthcare-personnel/[slug]/page.tsx`
- [ ] `app/medical-facilities/page.tsx`
- [ ] `app/medical-facilities/[slug]/page.tsx`
- [ ] `app/support/page.tsx`
- [ ] `app/support/tickets/[id]/page.tsx`
- [ ] `app/treatment-plan/page.tsx`
- [ ] `app/add-review/page.tsx`
- [ ] `app/profile/page.tsx`
- [ ] `app/signup/role-selection/page.tsx`

#### **Components**
- [ ] `app/components/UserCommentsSection.tsx`
- [ ] `app/components/Navbar.tsx`
- [ ] `app/components/ProtectedRoute.tsx`
- [ ] `app/components/SignupFlowManager.tsx`

#### **API Routes**
- [ ] `app/api/upload-facilities/route.ts`
- [ ] `app/api/debug/route.ts`
- [ ] `app/api/doctors/` - List doctors API

---

## 📋 Field Naming Convention (Firestore → Supabase)

When converting, use these mappings:

### Users Table
| Firestore | Supabase |
|-----------|----------|
| `uid` | `id` (auto, from auth.users) |
| `email` | `email` |
| `displayName` | `display_name` |
| `photoURL` | `photo_url` |
| `role` | `role` |
| `accountStatus` | `account_status` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `gdprConsent` | `gdpr_consent` (JSONB) |
| `adminAccountData` | `admin_account_data` (JSONB) |
| `patientAccountData` | `patient_account_data` (JSONB) |
| `healthcarePersonnelAccountData` | `healthcare_personnel_account_data` (JSONB) |
| `medicalFacilityAccountData` | `medical_facility_account_data` (JSONB) |
| `agencyAccountData` | `agency_account_data` (JSONB) |

### Listing Tables (healthcare_personnel_listings, medical_facility_listings, agency_listings)
| Firestore | Supabase |
|-----------|----------|
| `id` | `id` |
| `userId` | `user_id` |
| `name` | `name` |
| `slug` | `slug` |
| `image` | `image` |
| `listingId` | `id` |
| `medicalFacilityIds` | `medical_facility_ids` (array) |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### Comments & Reviews
| Firestore | Supabase |
|-----------|----------|
| `userId` | `user_id` |
| `agencyId`/`listingId` | `listing_id` + `listing_type` column |
| `isDeleted` | `is_deleted` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

---

## 🔄 Common Query Conversions

### Firebase → Supabase Examples

**Get all records:**
```typescript
// Firebase
const snapshot = await getDocs(collection(db, "agencies"));

// Supabase
const { data } = await supabase.from("agency_listings").select("*");
```

**Filter query:**
```typescript
// Firebase
const q = query(collection(db, "reviews"), where("status", "==", "published"));

// Supabase
const { data } = await supabase
  .from("reviews")
  .select("*")
  .eq("status", "published");
```

**Update record:**
```typescript
// Firebase
await updateDoc(doc(db, "users", userId), { role: "admin" });

// Supabase
await supabase
  .from("users")
  .update({ role: "admin" })
  .eq("id", userId);
```

**Delete record:**
```typescript
// Firebase
await deleteDoc(doc(db, "users", userId));

// Supabase
await supabase
  .from("users")
  .delete()
  .eq("id", userId);
```

**Soft delete:**
```typescript
// Supabase
await supabase
  .from("comments")
  .update({ is_deleted: true })
  .eq("id", commentId);
```

---

## 🔐 Row Level Security (RLS)

All tables have RLS policies configured in `SUPABASE_SCHEMA.sql`. Key policies:

- **Public Listings**: Anyone can read, only admins can write
- **User Profiles**: Users can read/update own, admins can read all
- **Comments**: Anyone can read, authenticated users can write own
- **Support Tickets**: Users can read own, admins can read all
- **Treatment Plans**: Users can read own, admins can read all

Enable RLS enforcement in Supabase dashboard for security.

---

## 📱 User Type Conversions

All Firestore User types have been converted:

| Role | Private Data | Public Listing |
|------|-----------|---|
| `patient` | `patient_account_data` JSONB | No public listing |
| `healthcare_personnel` | `healthcare_personnel_account_data` JSONB | `healthcare_personnel_listings` table |
| `medical_facility` | `medical_facility_account_data` JSONB | `medical_facility_listings` table |
| `agency` | `agency_account_data` JSONB | `agency_listings` table |
| `admin` | `admin_account_data` JSONB | No public listing |

---

## ✨ Key Differences

1. **Auth Management**: Supabase handles all auth in `auth.users` table. User profiles extend this with `public.users`
2. **Timestamps**: All timestamps are ISO 8601 strings in Supabase (convert with `convertTimestampsToDates()`)
3. **File Storage**: If using images, migrate to Supabase Storage (bucket: `media`)
4. **Realtime**: Supabase supports realtime subscriptions via `.on()` method
5. **RLS**: All permissions are handled via database policies, not application code

---

## 🐛 Debugging

### Check Auth State
```typescript
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session);
```

### Test Database Query
```typescript
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("email", "test@example.com");

if (error) console.error('Query error:', error);
console.log('Result:', data);
```

### View RLS Policies in Effect
- Go to Supabase Dashboard > SQL Editor
- Run: `SELECT * FROM pg_policies;`

---

## 📞 Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/frameworks/nextjs)
