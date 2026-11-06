# Orphaned R2 URL Edge Case Handling

## Problem Statement
Users' `photo_url` fields in the Supabase database can point to R2 images that no longer exist. This occurs when:
- R2 deletion succeeds but database update fails
- Manual R2 bucket cleanup is performed
- External deletion via Cloudflare dashboard
- Network failures during the cleanup process

Without defensive coding, broken image URLs result in 404 errors and poor UX.

## Solution

### 1. Frontend Image Error Handling (Profile Page)
**File:** [app/profile/page.tsx](../app/profile/page.tsx)

Added graceful fallback when R2 image fails to load:

```tsx
// State to track broken image URLs
const [brokenPhotoUrl, setBrokenPhotoUrl] = useState(false);

// Reset when profile updates
useEffect(() => {
  setBrokenPhotoUrl(false);
}, [userProfile]);

// Error handler - called when Image component fails to load
const handleImageError = () => {
  console.log('🖼️ [PROFILE] Image failed to load from R2, falling back to placeholder');
  setBrokenPhotoUrl(true);
};

// Render logic - show placeholder if load fails
{userProfile.photoURL && !brokenPhotoUrl ? (
  <Image
    src={userProfile.photoURL}
    alt="Profile Picture"
    onError={handleImageError}  // ← Added error handler
    ...
  />
) : (
  <div>👤</div> // ← Fallback to placeholder emoji
)}
```

**How it works:**
1. When `<Image>` component attempts to load the URL and receives a 404/403 error
2. The `onError` callback triggers `handleImageError()`
3. `brokenPhotoUrl` flag is set to `true`
4. Component re-renders, showing placeholder emoji instead
5. Console logs the failure for debugging

### 2. URL Validation Utility (Optional)
**File:** [lib/r2.ts](../lib/r2.ts)

Added `validateR2Url()` function for server-side validation:

```typescript
/**
 * Validate that an R2 public URL points to an existing object
 */
export async function validateR2Url(publicUrl: string): Promise<boolean> {
  const key = extractKeyFromUrl(publicUrl);
  if (!key) return false;

  const exists = await fileExistsInR2(key);
  if (!exists) {
    console.warn('⚠️ [R2] ORPHANED URL - File exists in database but not in R2:', {
      url: publicUrl,
      key,
    });
  }
  return exists;
}
```

**Usage in API endpoints:**
```typescript
// Before storing or displaying a URL from database
if (userProfile.photoUrl) {
  const isValid = await validateR2Url(userProfile.photoUrl);
  if (!isValid) {
    // Clear the orphaned URL from database
    await supabase
      .from('users')
      .update({ photo_url: null })
      .eq('id', userId);
  }
}
```

## Logging

The system uses emoji-prefixed logging for debugging:

| Emoji | Context | Meaning |
|-------|---------|---------|
| 🖼️ | Frontend | Image load error detected |
| ⚠️ | Backend | Orphaned URL detected |
| 🚫 | Any | Error during validation |
| ✅ | Backend | File exists in R2 |

Example logs:
```
🖼️ [PROFILE] Image failed to load from R2, falling back to placeholder
⚠️ [R2] ORPHANED URL - File exists in database but not in R2:
  url: "https://mp-images.r2.cloudflarestorage.com/users/123/profile-1234567890.jpg"
  key: "users/123/profile-1234567890.jpg"
```

## Testing the Edge Case

### Manual Test
1. Upload a profile picture successfully
2. Manually delete the image from R2 bucket in Cloudflare dashboard
3. Refresh the profile page
4. Image should show as placeholder emoji (👤) instead of broken image
5. Check browser console for "Image failed to load from R2" message

### Automated Test (Optional)
```typescript
// Check if validateR2Url detects orphaned URLs
const isValid = await validateR2Url('https://mp-images.../deleted-image.jpg');
console.assert(!isValid, 'Should detect orphaned URL');
```

## Recovery Strategies

### Option 1: Frontend Only (Current)
- User sees placeholder emoji automatically
- No action taken (user can re-upload if desired)
- Minimal performance impact

### Option 2: Cleanup on Load (Optional)
```typescript
// In profile page useEffect
if (userProfile.photoUrl && brokenPhotoUrl) {
  // Clear the orphaned URL from database
  supabase
    .from('users')
    .update({ photo_url: null })
    .eq('id', user.id)
    .then(() => console.log('✅ Cleaned orphaned URL'));
}
```

### Option 3: Scheduled Cleanup (Future)
- Add a cron job or Edge Function that periodically validates all photo_urls
- Delete orphaned entries from database
- Notify users if their images were removed

## Affected Components

- ✅ [app/profile/page.tsx](../app/profile/page.tsx) - Profile picture display with error handling
- ✅ [lib/r2.ts](../lib/r2.ts) - Validation utility functions
- 🔧 [lib/hooks/useImageUpload.ts](../lib/hooks/useImageUpload.ts) - Could use `validateR2Url()` on success
- 🔧 [app/api/upload/route.ts](../app/api/upload/route.ts) - Could validate before storing URLs

## Performance Considerations

- **Frontend**: Image load error is native browser behavior (no extra requests)
- **Backend**: `validateR2Url()` makes one `HeadObjectCommand` request per URL (lightweight)
- **Recommended**: Only validate URLs on-demand, not on every load

## Security Notes

- Uses existing R2 client with AWS SDK (no additional dependencies)
- `fileExistsInR2()` only checks object existence (no data access)
- No sensitive operations, only read checks
- Errors are logged without exposing sensitive data

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Setup Guide](CLOUDFLARE_R2_SETUP.md)
- [R2 Quick Reference](R2_QUICK_REFERENCE.md)
