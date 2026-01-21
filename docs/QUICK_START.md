# Quick Start: Firebase to Supabase Migration

## 🎯 What's Been Done

Your Medikal Site project has been converted from Firebase to Supabase. Here's what's ready:

### ✅ Completed (8 files)
1. **Supabase Client** - `lib/supabase.ts`
2. **Auth Context** - `lib/contexts/AuthContext.tsx` (fully converted)
3. **Database Schema** - `docs/SUPABASE_SCHEMA.sql` (with RLS policies)
4. **OAuth Callback** - `app/auth/callback/route.ts` (for Google OAuth)
5. **Example Config** - `.env.example`
6. **Dependencies** - `package.json` (Firebase removed)
7. **Sample Page** - `app/agencies/page.tsx` (example of conversion)
8. **Migration Guides** - 2 comprehensive docs

---

## 🚀 Get Started in 5 Steps

### Step 1: Create Supabase Project (5 min)
```
1. Go to https://supabase.com
2. Click "New Project"
3. Select your region
4. Create database (keep default settings)
5. Wait for project to be ready
```

### Step 2: Copy Your Credentials (2 min)
```
Dashboard > Project Settings > API
- Copy: Project URL → NEXT_PUBLIC_SUPABASE_URL
- Copy: Anon Key → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Step 3: Setup Database Schema (5 min)
```
1. Dashboard > SQL Editor > New Query
2. Open: docs/SUPABASE_SCHEMA.sql
3. Copy entire content
4. Paste into SQL Editor
5. Click "Run"
6. Verify all tables created (check left sidebar)
```

### Step 4: Configure Google OAuth (10 min)
```
Supabase Dashboard:
1. Go to: Authentication > Providers > Google
2. Enable Google
3. Get Google OAuth credentials from Google Cloud Console
   - Client ID
   - Client Secret
4. Paste them into Supabase
5. Add redirect URLs:
   - Dev: http://localhost:3000/auth/callback
   - Prod: https://yourdomain.com/auth/callback
```

### Step 5: Add Environment Variables (1 min)
```bash
# In project root, create or update .env.local
cp .env.example .env.local

# Edit .env.local and add:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
```

---

## 🧪 Test It Works

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Go to http://localhost:3000
# Try Google login - should work!
```

---

## 📋 What Needs Converting Next

| Priority | Task | Status | Est. Time |
|----------|------|--------|-----------|
| 🔴 High | Admin pages + modals | Not started | 3 hours |
| 🔴 High | Healthcare personnel pages | Not started | 2 hours |
| 🟡 Medium | Medical facilities pages | Not started | 2 hours |
| 🟡 Medium | Support/Treatment plan pages | Not started | 2 hours |
| 🟢 Low | Components (navbar, etc.) | Not started | 1 hour |
| 🟢 Low | API routes | Not started | 1 hour |

**Total Remaining**: ~11 hours

---

## 📚 Key Resources

1. **Migration Guide** → `docs/FIREBASE_TO_SUPABASE_MIGRATION.md`
2. **Conversion Checklist** → `docs/CONVERSION_CHECKLIST.md`
3. **Database Schema** → `docs/SUPABASE_SCHEMA.sql`

---

## 🔑 Key Differences to Remember

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| **Fields** | camelCase | snake_case |
| **Timestamps** | Firestore.Timestamp | ISO 8601 string |
| **Auth** | Firebase Auth | Supabase Auth + auth.users table |
| **Database** | Firestore | PostgreSQL |
| **Security** | Firestore rules | Row Level Security (RLS) |
| **File Storage** | Cloud Storage | Supabase Storage (buckets) |

---

## 💡 Query Conversion Example

**Firebase:**
```typescript
const snapshot = await getDocs(
  query(collection(db, "agencies"), where("country", "==", "Turkey"))
);
```

**Supabase:**
```typescript
const { data } = await supabase
  .from("agency_listings")
  .select("*")
  .eq("country", "Turkey");
```

---

## ❓ Troubleshooting

### "Missing Supabase environment variables"
→ Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Google OAuth not working"
→ Verify in Supabase: Authentication > Providers > Google is enabled with credentials

### "TypeScript errors about 'db' or 'firebase'"
→ Remove old Firebase imports, use `import { supabase } from "@/lib/supabase"`

### "RLS policy error when querying"
→ Check RLS policies in schema, verify you're authenticated with correct role

---

## 📞 Next Steps

1. **Complete the setup above** (23 min total)
2. **Read** `docs/FIREBASE_TO_SUPABASE_MIGRATION.md` for detailed conversions
3. **Convert remaining files** using the checklist in `docs/CONVERSION_CHECKLIST.md`
4. **Test thoroughly** after each page/component conversion

---

**Questions?** Check the comprehensive migration guide or Supabase docs at https://supabase.com/docs
