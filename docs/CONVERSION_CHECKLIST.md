# Firebase to Supabase Conversion Checklist

## ✅ Completed Files (4/44)

### Configuration & Core (4/4)
- [x] `lib/supabase.ts` - New Supabase client
- [x] `lib/contexts/AuthContext.tsx` - Auth context fully converted
- [x] `.env.example` - Environment variables template
- [x] `package.json` - Dependencies updated

### Created Files (3/3)
- [x] `docs/SUPABASE_SCHEMA.sql` - Complete database schema with RLS
- [x] `docs/FIREBASE_TO_SUPABASE_MIGRATION.md` - Migration guide
- [x] `app/auth/callback/route.ts` - OAuth callback handler

### Pages & Views (1/21)
- [x] `app/agencies/page.tsx` - Listing page converted
- [ ] `app/agencies/[slug]/page.tsx` - Slug page
- [ ] `app/healthcare-personnel/page.tsx` - Listing page
- [ ] `app/healthcare-personnel/[slug]/page.tsx` - Slug page
- [ ] `app/medical-facilities/page.tsx` - Listing page
- [ ] `app/medical-facilities/[slug]/page.tsx` - Slug page
- [ ] `app/profile/page.tsx` - User profile
- [ ] `app/signup/role-selection/page.tsx` - Role selection
- [ ] `app/support/page.tsx` - Support tickets listing
- [ ] `app/support/tickets/[id]/page.tsx` - Ticket detail
- [ ] `app/treatment-plan/page.tsx` - Treatment plans
- [ ] `app/add-review/page.tsx` - Add review
- [ ] `app/healthcare-database/page.tsx` - Database search
- [ ] `app/admin/page.tsx` - Admin dashboard
- [ ] `app/admin/support/page.tsx` - Admin support
- [ ] `app/login/page.tsx` - Login page (verify works)
- [ ] `app/about/page.tsx` - Static page (verify works)
- [ ] `app/blogs/page.tsx` - Blogs listing (if applicable)
- [ ] `app/page.tsx` - Home page (verify works)

### Components (8/8)
- [ ] `app/components/UserCommentsSection.tsx` - Comments
- [ ] `app/components/Navbar.tsx` - Navigation
- [ ] `app/components/ProtectedRoute.tsx` - Route protection
- [ ] `app/components/SignupFlowManager.tsx` - Signup flow
- [ ] `app/components/GDPRConsent.tsx` - GDPR consent
- [ ] `app/components/ListingCard.tsx` - Listing card display
- [ ] `app/components/UserMenu.tsx` - User menu
- [ ] `app/components/Toast.tsx` - Toast notifications

### Admin Modal Components (4/4)
- [ ] `app/admin/components/user-data/UserCRUDModal.tsx` - User management
- [ ] `app/admin/components/HealthcarePersonnelListingCRUDModal.tsx` - Personnel listing CRUD
- [ ] `app/admin/components/MedicalFacilityListingCRUDModal.tsx` - Facility listing CRUD
- [ ] `app/admin/components/AgencyListingCRUDModal.tsx` - Agency listing CRUD

### API Routes (2/2)
- [ ] `app/api/upload-facilities/route.ts` - File upload
- [ ] `app/api/debug/route.ts` - Debug endpoint
- [ ] `app/api/doctors/` - Doctors listing API

### Configuration Files (3/3)
- [ ] `middleware.ts` - Auth middleware (verify/update if exists)
- [ ] `lib/types.ts` - Type definitions (verify field mappings)
- [ ] `lib/utils.ts` - Utility functions (update if Firestore-specific)
- [ ] `lib/firebase-admin.ts` - DELETE (no longer needed)
- [ ] `lib/firebase.ts` - DELETE (replaced by supabase.ts)
- [ ] `firebase/firestore.rules` - DELETE (replaced by Supabase RLS)
- [ ] `firebase.json` - DELETE (no longer needed)

### Other Files (3/3)
- [ ] `app/layout.tsx` - Verify imports (remove Firebase if present)
- [ ] `app/components/SignupFlowManager.tsx` - Uses Auth context (should work after auth conversion)
- [ ] `.gitignore` - Already ignores .env files

---

## 📊 Progress Summary

- **Total Files**: 44
- **Completed**: 8
- **Remaining**: 36
- **Estimated Effort**: ~6-8 hours for complete migration

---

## 🎯 Priority Conversion Order

### Tier 1 (Critical - Do First)
1. ✅ `lib/supabase.ts` - Supabase client
2. ✅ `lib/contexts/AuthContext.tsx` - Auth system
3. ✅ `.env.example` - Configuration
4. ✅ `app/auth/callback/route.ts` - OAuth flow
5. `app/components/ProtectedRoute.tsx` - Route protection
6. `app/components/SignupFlowManager.tsx` - Signup flow
7. `app/signup/role-selection/page.tsx` - Role selection

### Tier 2 (High Priority)
8. `app/profile/page.tsx` - User profile operations
9. `app/components/UserCommentsSection.tsx` - Comments/Reviews
10. `app/admin/page.tsx` - Admin dashboard
11. `app/admin/components/user-data/UserCRUDModal.tsx` - User CRUD
12. Listing listing pages (healthcare-personnel, medical-facilities, agencies)

### Tier 3 (Standard Priority)
13. Support ticket pages
14. Treatment plan pages
15. Review submission
16. All remaining components

### Tier 4 (Low Priority - Static Pages)
17. Login/About/Blogs pages
18. Utility files
19. Delete old Firebase files

---

## 🔧 Conversion Template

Use this template when converting each file:

```typescript
// OLD IMPORTS
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// NEW IMPORTS
import { supabase } from "@/lib/supabase";

// OLD QUERY
const q = query(collection(db, "users"), where("role", "==", "admin"));
const snapshot = await getDocs(q);
const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// NEW QUERY
const { data: users, error } = await supabase
  .from("users")
  .select("*")
  .eq("role", "admin");
```

---

## ⚡ Testing Checklist

After each file conversion:
- [ ] No TypeScript errors
- [ ] Firebase imports removed
- [ ] Supabase queries use correct field names (snake_case)
- [ ] Timestamps converted with `convertTimestampsToDates()`
- [ ] Error handling in place
- [ ] Console logging uses emoji prefixes
- [ ] Test in browser (if possible)

---

## 📝 Notes

- Field names in Supabase use snake_case (e.g., `user_id` vs `userId`)
- Timestamps must be converted from ISO strings to Date objects
- RLS policies handle all authorization (no need for manual checks)
- Service role key is optional (for server-side only)
