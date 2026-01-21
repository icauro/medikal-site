# Troubleshooting Guide - Firebase to Supabase Migration

This guide helps you resolve common issues during the migration process.

---

## 🔴 Critical Issues

### Issue: "Cannot find module '@/lib/firebase'"

**Cause**: Old Firebase imports still exist in files

**Solution**:
1. Find the file with the error
2. Check all imports at the top
3. Replace Firebase imports:
```typescript
// OLD
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// NEW
import { supabase } from '@/lib/supabase';
```
4. Update queries to use Supabase syntax
5. Run `npm run lint` to check for remaining issues

---

### Issue: "Missing Supabase environment variables"

**Cause**: `.env.local` not configured

**Solution**:
```bash
# 1. Create .env.local if it doesn't exist
touch .env.local

# 2. Add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 3. Restart dev server
npm run dev
```

**Note**: Restart VS Code after changing `.env.local`

---

### Issue: "TypeError: Cannot read property 'id' of null"

**Cause**: User not authenticated when trying to access `user.id`

**Solution**:
```typescript
// Add null check
const { user } = useAuth();

if (!user) {
  return <div>Loading...</div>;
}

// Now safe to use user.id
```

---

## 🟡 Database Issues

### Issue: "relation 'xyz' does not exist"

**Cause**: Database schema not imported

**Solution**:
1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire `docs/SUPABASE_SCHEMA.sql`
5. Paste into SQL Editor
6. Click "Run"
7. Wait for completion (~10 seconds)
8. Check left sidebar to verify tables exist

**If still failing**:
- Check no SQL syntax errors
- Try running individual CREATE TABLE statements
- Verify you have database admin permissions

---

### Issue: "new row violates row-level security policy"

**Cause**: RLS policy doesn't allow the operation

**Solution**:
1. Check you're authenticated: `const { user } = useAuth();`
2. Check your role matches policy: `user?.role` should be set
3. For admin-only operations, verify user is admin:
```typescript
// Add to .env.local
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com
```
4. Log out and back in to refresh role

**Debug RLS**:
```sql
-- In Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'users';
```

---

### Issue: "column 'xyz' does not exist"

**Cause**: Field name mismatch (camelCase vs snake_case)

**Solution**:
Remember: Supabase uses **snake_case**

Wrong:
```typescript
const { data } = await supabase
  .from('users')
  .select('userId, displayName');  // ❌ camelCase
```

Correct:
```typescript
const { data } = await supabase
  .from('users')
  .select('id, display_name');  // ✅ snake_case
```

**Common mappings**:
- `userId` → `user_id`
- `createdAt` → `created_at`
- `accountStatus` → `account_status`
- `photoURL` → `photo_url`
- `displayName` → `display_name`

---

## 🟡 Authentication Issues

### Issue: "Google OAuth not working"

**Cause**: OAuth configuration missing

**Solution**:
1. Get Google OAuth credentials:
   - Go to Google Cloud Console
   - Create OAuth 2.0 Client ID
   - Copy Client ID and Secret

2. Add to Supabase:
   - Dashboard > Authentication > Providers > Google
   - Enable Google
   - Paste Client ID and Secret
   - Save

3. Set redirect URL:
   - Add: `http://localhost:3000/auth/callback`
   - Add production URL when deploying

4. Restart dev server

---

### Issue: "Callback URL doesn't match"

**Cause**: OAuth redirect URL not configured correctly

**Solution**:
1. Check your app's exact callback route:
   - Should be: `http://localhost:3000/auth/callback`

2. In Supabase, set exact URL:
   - Dashboard > Authentication > URL Configuration
   - Set Site URL: `http://localhost:3000` (dev)
   - Set Redirect URLs: `http://localhost:3000/auth/callback`

3. Restart dev server

---

### Issue: "User profile not being created"

**Cause**: AuthContext didn't complete profile creation

**Solution**:
1. Check browser console for errors (look for 🔐 [AUTH] messages)
2. Check Supabase logs:
   - Dashboard > Logs > Edge Functions
   - Dashboard > Logs > API
3. Verify user was created:
   - Dashboard > Authentication > Users
4. Check if user exists in users table:
```sql
SELECT * FROM users WHERE email = 'your-email@example.com';
```

---

### Issue: "Session invalid after page reload"

**Cause**: Supabase session not persisted

**Solution**:
This shouldn't happen with Supabase's default config, but if it does:

1. Check browser storage:
   - Open DevTools > Application > Local Storage
   - Should have `sb-{project-id}-auth-token`

2. Clear and retry:
   - DevTools > Application > Clear Storage
   - Log out manually
   - Restart dev server
   - Log back in

---

## 🟡 Timestamp Issues

### Issue: "Cannot read property 'toDate' of string"

**Cause**: Trying to call `.toDate()` on ISO string

**Solution**:
Use the helper function provided:

```typescript
import { convertTimestampsToDates } from '@/lib/supabase';

// ❌ Wrong
const createdAt = user.created_at.toDate();

// ✅ Correct
const profile = convertTimestampsToDates(user);
const createdAt = profile.createdAt;  // Now a Date object
```

---

### Issue: "Timestamp is in wrong format"

**Cause**: ISO string not being converted

**Solution**:
```typescript
// When reading from database
const { data } = await supabase.from('users').select('*').single();
const profile = convertTimestampsToDates(data);

// When writing to database
await supabase.from('users').update({
  updated_at: new Date().toISOString()  // ISO string
}).eq('id', userId);
```

---

## 🟡 Query Issues

### Issue: "Cannot read property 'length' of undefined"

**Cause**: Supabase returned no data (undefined instead of array)

**Solution**:
Always check for null/undefined:

```typescript
// ❌ Wrong
const { data } = await supabase.from('users').select('*');
data.forEach(user => {...});  // Crashes if data is undefined

// ✅ Correct
const { data, error } = await supabase.from('users').select('*');
if (error) throw error;
(data || []).forEach(user => {...});
```

---

### Issue: "Limit must be between 0 and 1000"

**Cause**: Invalid limit value

**Solution**:
```typescript
// Make sure limit is valid
.limit(10)    // ✓ Good
.limit(1000)  // ✓ Good
.limit(2000)  // ✗ Bad (too high)
```

---

## 🟡 Component Issues

### Issue: "useAuth must be used within an AuthProvider"

**Cause**: Component used outside AuthProvider

**Solution**:
In `app/layout.tsx`, wrap with AuthProvider:

```typescript
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### Issue: "Loading never becomes false"

**Cause**: Auth listener stuck

**Solution**:
1. Check browser console for errors
2. Check Supabase auth state:
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```
3. Try hard refresh: Ctrl+Shift+R
4. Check network tab for failed requests

---

## 🟡 Performance Issues

### Issue: "Page loads very slowly"

**Cause**: Too many database queries

**Solution**:
1. Use `select()` to pick specific columns:
```typescript
// ❌ Slow - gets all columns
const { data } = await supabase.from('users').select('*');

// ✅ Fast - gets only needed columns
const { data } = await supabase.from('users').select('id, email, role');
```

2. Use pagination:
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .range(0, 20);  // First 20 items
```

3. Add indexes for frequently filtered columns (should be done in schema)

---

## 🟢 Helpful Debugging Commands

### Check Supabase Connection
```typescript
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('Error:', error);
```

### List All Tables
```typescript
const { data, error } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public');

console.log('Tables:', data);
```

### Check Current User Role
```typescript
const { user } = useAuth();
const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
console.log('User role:', data.role);
```

### View Logs
```bash
# In terminal, watch real-time logs
supabase functions list
```

---

## 📋 Testing Checklist

Before considering migration complete:

- [ ] Google login works
- [ ] User profile created in database
- [ ] GDPR acceptance works
- [ ] Role selection works
- [ ] Admin users load admin panel
- [ ] Listings display correctly
- [ ] Comments can be posted
- [ ] Reviews can be submitted
- [ ] Support tickets can be created
- [ ] User can update profile
- [ ] Logout works
- [ ] Re-login works
- [ ] No TypeScript errors
- [ ] No JavaScript console errors
- [ ] No 404 on any page

---

## 🆘 Still Stuck?

1. **Check Console Logs**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Look for emoji-prefixed logs (👤, 🔐, 💾, etc.)

2. **Check Supabase Logs**
   - Dashboard > Logs > Edge Functions
   - Dashboard > Logs > API

3. **Verify Data in Database**
   - Dashboard > SQL Editor
   - Run `SELECT * FROM users LIMIT 5;`
   - Run `SELECT * FROM agency_listings LIMIT 5;`

4. **Check Network Requests**
   - DevTools > Network tab
   - Reload page
   - Look for failed requests to Supabase
   - Check response status and error message

5. **Restart Everything**
   - Stop dev server (Ctrl+C)
   - Clear `.next` folder: `rm -rf .next`
   - Restart: `npm run dev`

6. **Contact Supabase Support**
   - Go to supabase.com
   - Click Help > Support
   - Include error message and reproduction steps

---

## 📚 Additional Resources

- **Supabase Status**: https://status.supabase.com
- **Supabase Issues**: https://github.com/supabase/supabase/issues
- **Discord Community**: https://discord.supabase.com
- **GitHub Discussions**: https://github.com/supabase/supabase/discussions
