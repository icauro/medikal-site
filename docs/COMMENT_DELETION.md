# Comment Deletion & Account Cleanup System

## Overview

The Medikal Site implements a comprehensive system for handling deleted comments and user account removal with proper data cleanup and cascade deletion support.

## Key Features

### 1. **Soft-Delete Comments** (Default)
When a user deletes a comment:
- Comment is marked with `isDeleted: true`
- Comment remains in the database (preserving history and data integrity)
- Comment is hidden from the UI (shows "[Comment deleted]" placeholder)
- Timestamp is updated to reflect the deletion

**Benefits:**
- ✅ Preserves comment history for audits
- ✅ Maintains reply count accuracy
- ✅ Prevents orphaned replies
- ✅ Allows comment recovery if needed

### 2. **Cascade Deletion of Replies**
When a comment is deleted, all its nested replies are also soft-deleted:
- Parent comment marked as `isDeleted: true`
- All direct replies in `comments/{commentId}/replies` marked as `isDeleted: true`
- Both parent and replies update their `updatedAt` timestamp

**Firestore Path:**
```
healthcare_personnel_listings/{listingId}/
  comments/{commentId}/
    replies/{replyId}
```

### 3. **Account Deletion Cleanup**
When a user deletes their account via `AuthContext.deleteAccount()`:

#### Step 1: Delete User-Owned Collections
- `support_tickets` (hard-deleted)
- `treatment_plans` (hard-deleted)

#### Step 2: Soft-Delete Comments & Replies
The system iterates through all three listing collections and soft-deletes:
- Any comment where `userId === deletedUserId`
- Any reply within those comments where `userId === deletedUserId`

**Affected Collections:**
- `healthcare_personnel_listings/{id}/comments/{commentId}/replies`
- `medical_facility_listings/{id}/comments/{commentId}/replies`
- `agency_listings/{id}/comments/{commentId}/replies`

#### Step 3: Delete User Profile
- User document in `/users` collection deleted

#### Step 4: Delete Firebase Auth Account
- Firebase Authentication user account deleted
- Cannot be undone without password recovery

## Implementation Details

### Comment Deletion Function
**File:** `app/components/UserCommentsSection.tsx`

```typescript
const handleDeleteComment = async (commentId: string) => {
  // 1. Mark comment as deleted
  await updateDoc(doc(db, listingPath, entityId, "comments", commentId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
  
  // 2. Cascade delete all replies
  const repliesRef = collection(db, listingPath, entityId, "comments", commentId, "replies");
  const repliesSnapshot = await getDocs(repliesRef);
  
  const deleteRepliesPromises = repliesSnapshot.docs.map((doc) =>
    updateDoc(doc.ref, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    })
  );
  
  await Promise.all(deleteRepliesPromises);
  loadComments(); // Refresh UI
};
```

### Account Deletion Cleanup
**File:** `lib/contexts/AuthContext.tsx`

```typescript
const deleteAccount = async () => {
  // ... [steps 1-2] ...
  
  // Soft-delete user's comments and replies
  const listingCollections = [
    'healthcare_personnel_listings',
    'medical_facility_listings',
    'agency_listings',
  ];

  for (const listingCollection of listingCollections) {
    const listingsSnapshot = await getDocs(collection(db, listingCollection));
    
    for (const listingDoc of listingsSnapshot.docs) {
      const commentsRef = collection(db, listingCollection, listingDoc.id, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      for (const commentDoc of commentsSnapshot.docs) {
        if (commentDoc.data().userId === user.uid) {
          // Soft-delete comment
          await updateDoc(commentDoc.ref, {
            isDeleted: true,
            updatedAt: Timestamp.now(),
          });
          
          // Soft-delete user's replies
          const repliesRef = collection(db, listingCollection, listingDoc.id, 'comments', commentDoc.id, 'replies');
          const repliesSnapshot = await getDocs(repliesRef);
          
          const deleteRepliesPromises = repliesSnapshot.docs
            .filter(replyDoc => replyDoc.data().userId === user.uid)
            .map(replyDoc => 
              updateDoc(replyDoc.ref, {
                isDeleted: true,
                updatedAt: Timestamp.now(),
              })
            );
          
          await Promise.all(deleteRepliesPromises);
        }
      }
    }
  }
};
```

## UI Handling

### Deleted Comment Display
**File:** `app/components/UserCommentsSection.tsx`

Deleted comments show a placeholder:
```jsx
<p className="text-zinc-200 text-sm mt-2 leading-relaxed break-words">
  {comment.isDeleted ? (
    <span className="text-zinc-500 italic">[Comment deleted]</span>
  ) : (
    comment.content
  )}
</p>
```

### Filtering Deleted Comments
Comments are filtered out during loading:
```typescript
const loadedComments = snapshot.docs
  .filter((doc) => !doc.data().isDeleted) // Hidden from UI
  .map((doc) => ({...}));

const loadedReplies = snapshot.docs
  .filter((doc) => !doc.data().isDeleted) // Hidden from UI
  .map((doc) => ({...}));
```

## Firestore Rules

**Location:** `firebase/firestore.rules`

Comment operations (update/delete) require user ownership or admin role:
```
allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
```

This prevents unauthorized deletion or soft-deletion marking.

## Data Schema

### UserComment Fields
```typescript
export interface UserComment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoUrl?: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  score: number;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;  // ← Soft-delete flag
  createdAt: Date;
  updatedAt: Date;    // ← Updated on deletion
}
```

## Logging

Console logging with emoji prefixes for debugging:
- 📋 `[COMMENTS]` - Comment operations
- ✅ `[DELETE]` - Successful deletions
- 🗑️ `[DELETE]` - Deletion process steps
- ❌ `[DELETE]` - Errors during deletion

Example:
```
📋 [COMMENTS] Soft-deleted comment abc123 and 3 replies
✅ [DELETE] Soft-deleted 42 comments and replies
```

## Security Considerations

### What Happens to Comments After Account Deletion
1. **Comments Remain** - Soft-deleted but not removed
2. **Attributed to "[Deleted User]"** - Author info becomes placeholder text
3. **Replies Preserved** - Nested replies remain visible (if not by deleted user)
4. **Vote Data Kept** - Vote history maintained for analytics

### Data Privacy
- ✅ User's personal profile deleted immediately
- ✅ User's support tickets hard-deleted
- ✅ User's treatment plans hard-deleted
- ✅ User's comments soft-deleted (non-destructive)
- ✅ Firebase Auth account permanently deleted

### Audit Trail
Comments with `isDeleted: true` and updated `updatedAt` timestamp provide:
- Deletion history
- Timestamp of deletion
- Original content preserved (if needed for recovery)

## Best Practices

1. **Always use soft-delete** for public comments (preserve context)
2. **Filter deleted comments** before rendering (hide from users)
3. **Cascade delete replies** when parent is deleted (data consistency)
4. **Update timestamps** on deletion (tracking when removed)
5. **Log deletion operations** (audit trail)
6. **Test account deletion** with comments/replies in database

## Future Enhancements

Potential improvements:
- [ ] Admin ability to hard-delete comments (irreversible)
- [ ] Comment recovery window (soft-delete → hard-delete after 30 days)
- [ ] Edit history tracking (show edits/deletions timeline)
- [ ] Comment undelete functionality
- [ ] Bulk comment deletion for admins
- [ ] Comment export before account deletion
