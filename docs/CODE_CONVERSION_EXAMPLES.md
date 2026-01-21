# Firebase to Supabase Code Conversion Examples

This file shows how to convert the most common Firebase patterns used in your project.

---

## 1. Read Operations

### Get Single Document by ID

**Firebase:**
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
  const user = userSnap.data();
}
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (error) console.error(error);
```

---

### Get All Documents (List)

**Firebase:**
```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const snapshot = await getDocs(collection(db, 'agency_listings'));
const agencies = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: agencies, error } = await supabase
  .from('agency_listings')
  .select('*');

if (error) console.error(error);
```

---

### Query with Filters (WHERE clause)

**Firebase:**
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const q = query(
  collection(db, 'users'),
  where('role', '==', 'admin'),
  where('accountStatus', '==', 'active')
);
const snapshot = await getDocs(q);
const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: admins, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'admin')
  .eq('account_status', 'active');

if (error) console.error(error);
```

---

### Query with Sorting

**Firebase:**
```typescript
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const q = query(
  collection(db, 'support_tickets'),
  orderBy('createdAt', 'desc')
);
const snapshot = await getDocs(q);
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('support_tickets')
  .select('*')
  .order('created_at', { ascending: false });
```

---

### Query with Limit

**Firebase:**
```typescript
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const q = query(
  collection(db, 'reviews'),
  limit(10)
);
const snapshot = await getDocs(q);
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .limit(10);
```

---

### Complex Query (Multiple Filters + Order + Limit)

**Firebase:**
```typescript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const q = query(
  collection(db, 'reviews'),
  where('status', '==', 'published'),
  where('listing_type', '==', 'agency'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('status', 'published')
  .eq('listing_type', 'agency')
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## 2. Write Operations

### Create/Insert New Document

**Firebase:**
```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const docRef = await addDoc(collection(db, 'support_tickets'), {
  userId: user.uid,
  title: 'My Issue',
  description: 'Description here',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('support_tickets')
  .insert({
    user_id: user.id,
    title: 'My Issue',
    description: 'Description here',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();

if (error) throw error;
```

---

### Update Document

**Firebase:**
```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const userRef = doc(db, 'users', userId);
await updateDoc(userRef, {
  role: 'admin',
  updatedAt: new Date(),
});
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('users')
  .update({
    role: 'admin',
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);

if (error) throw error;
```

---

### Delete Document

**Firebase:**
```typescript
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const userRef = doc(db, 'users', userId);
await deleteDoc(userRef);
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);

if (error) throw error;
```

---

### Soft Delete (Update, don't hard delete)

**Firebase:**
```typescript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const commentRef = doc(db, 'comments', commentId);
await updateDoc(commentRef, {
  isDeleted: true,
  updatedAt: Timestamp.now(),
});
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('comments')
  .update({
    is_deleted: true,
    updated_at: new Date().toISOString(),
  })
  .eq('id', commentId);

if (error) throw error;
```

---

## 3. Authentication Operations

### Sign In with Google

**Firebase:**
```typescript
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const result = await signInWithPopup(auth, googleProvider);
const user = result.user;
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

---

### Sign Out

**Firebase:**
```typescript
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

await signOut(auth);
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

await supabase.auth.signOut();
```

---

### Get Current User

**Firebase:**
```typescript
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Logged in:', user.email);
  } else {
    console.log('Not logged in');
  }
});
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: { user }, error } = await supabase.auth.getUser();
if (user) {
  console.log('Logged in:', user.email);
}

// Or subscribe to changes:
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    console.log('Logged in:', session.user.email);
  }
});
```

---

## 4. Subcollection Operations (Comments on Listings)

Firebase has subcollections, Supabase doesn't. Instead, use a `comments` table with a `listing_id` foreign key.

### Read Comments for a Listing

**Firebase:**
```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const commentsRef = collection(
  db,
  'healthcare_personnel_listings',
  listingId,
  'comments'
);
const snapshot = await getDocs(commentsRef);
const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { data: comments, error } = await supabase
  .from('comments')
  .select('*')
  .eq('listing_id', listingId)
  .eq('listing_type', 'healthcare_personnel')
  .order('created_at', { ascending: false });
```

---

### Add Comment to a Listing

**Firebase:**
```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const commentsRef = collection(
  db,
  'healthcare_personnel_listings',
  listingId,
  'comments'
);
await addDoc(commentsRef, {
  userId: user.uid,
  content: 'Great doctor!',
  createdAt: new Date(),
});
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('comments')
  .insert({
    user_id: user.id,
    listing_id: listingId,
    listing_type: 'healthcare_personnel',
    content: 'Great doctor!',
    created_at: new Date().toISOString(),
  });

if (error) throw error;
```

---

## 5. Handling Timestamps

Firestore returns `Timestamp` objects. Supabase returns ISO 8601 strings.

### Convert Timestamps

**Firebase:**
```typescript
import { Timestamp } from 'firebase/firestore';

const user = await getDoc(...);
const profile = user.data();

// Convert
const createdAt = profile.createdAt instanceof Timestamp 
  ? profile.createdAt.toDate() 
  : profile.createdAt;
```

**Supabase:**
```typescript
import { convertTimestampsToDates } from '@/lib/supabase';

const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Convert
const profile = convertTimestampsToDates(user);
const createdAt = profile.createdAt; // Now a Date object
```

---

## 6. Batch Operations

### Batch Update Multiple Records

**Firebase:**
```typescript
import { writeBatch, collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const batch = writeBatch(db);
const q = query(collection(db, 'users'), where('role', '==', 'pending'));
const snapshot = await getDocs(q);

snapshot.docs.forEach(docSnap => {
  batch.update(doc(db, 'users', docSnap.id), { 
    accountStatus: 'active' 
  });
});

await batch.commit();
```

**Supabase:**
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('users')
  .update({ account_status: 'active' })
  .eq('role', 'pending');

if (error) throw error;
```

---

## 7. Transactions (Advanced)

Supabase doesn't have transactions like Firestore. Use the simpler approach:

```typescript
// If you need true transactions, use RLS policies to enforce consistency
// Or use Supabase Functions (PostgreSQL functions) for complex operations

// Simple approach - just do operations sequentially:
const { error: error1 } = await supabase.from('users').update(...).eq('id', userId);
if (error1) throw error1;

const { error: error2 } = await supabase.from('listings').update(...).eq('id', listingId);
if (error2) throw error2;
```

---

## 8. Error Handling Pattern

### Consistent Error Handling

**Supabase Pattern (use everywhere):**
```typescript
try {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin');

  if (error) {
    console.error('❌ [OPERATION_NAME] Database error:', error);
    throw error;
  }

  console.log('✅ [OPERATION_NAME] Success');
  return data;
} catch (err) {
  console.error('❌ [OPERATION_NAME] Unexpected error:', err);
  throw err;
}
```

---

## Quick Reference Table

| Operation | Firebase | Supabase |
|-----------|----------|----------|
| **Read** | `getDocs(q)` | `.select()` |
| **Get one** | `getDoc(ref)` | `.select().single()` |
| **Create** | `addDoc(ref, data)` | `.insert(data)` |
| **Update** | `updateDoc(ref, data)` | `.update(data).eq(...)` |
| **Delete** | `deleteDoc(ref)` | `.delete().eq(...)` |
| **Filter** | `where(...)` | `.eq()`, `.neq()`, `.gt()`, etc |
| **Order** | `orderBy(...)` | `.order(...)` |
| **Limit** | `limit(n)` | `.limit(n)` |
| **Field names** | camelCase | snake_case |
| **Timestamps** | `Timestamp` object | ISO 8601 string |

---

## Common Conversion Gotchas

1. **Field Names**: Firestore uses `userId`, Supabase uses `user_id`
2. **Timestamps**: Convert strings to Date objects using `convertTimestampsToDates()`
3. **Document IDs**: Firestore uses `doc.id`, Supabase uses `data.id`
4. **Errors**: Supabase returns errors in the response, not throw exceptions (check `error` property)
5. **Undefined fields**: Supabase returns `null` instead of missing fields
6. **Subcollections**: Use separate tables with foreign keys instead
7. **Auth user ID**: Firebase uses `.uid`, Supabase uses `.id`

---

## Testing Your Conversion

After converting a file, test with these checks:

```typescript
// 1. Check imports
// ✓ Should import from @/lib/supabase
// ✗ Should NOT import from @/lib/firebase

// 2. Check field names
// ✓ user_id, created_at, account_status
// ✗ userId, createdAt, accountStatus

// 3. Check error handling
// ✓ if (error) throw error
// ✗ No try/catch for getDocs, etc

// 4. Check timestamps
// ✓ convertTimestampsToDates(data)
// ✗ data.createdAt instanceof Timestamp

// 5. Run lint
npm run lint
```
