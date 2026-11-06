# Cloudflare R2 Integration - Implementation Summary

## Overview

Cloudflare R2 object storage has been successfully integrated into the Medikal Portal for user image uploads. This provides secure, cost-effective storage for profile pictures and other user-generated images.

## What Was Implemented

### 1. **Core R2 Module** - [lib/r2.ts](../lib/r2.ts)
   - S3-compatible client initialization for Cloudflare R2
   - `uploadToR2()` - Upload files with content type and size validation
   - `deleteFromR2()` - Remove files from R2
   - `fileExistsInR2()` - Check file existence
   - `generateUserProfileImageKey()` - Generate unique storage paths for profile images
   - `generateReviewImageKey()` - Generate paths for review/comment images
   - `extractKeyFromUrl()` - Parse R2 URLs back to object keys
   - Full error logging with emoji prefixes for debugging

### 2. **Upload API Endpoint** - [app/api/upload/route.ts](../app/api/upload/route.ts)
   - Secure endpoint requiring JWT authentication
   - Accepts multipart form data with file and type (profile/review)
   - Validates:
     - Authentication (Bearer token required)
     - File size (max 5MB)
     - MIME types (JPEG, PNG, WebP, GIF only)
   - Features:
     - Automatically updates user's `photo_url` in Supabase for profile uploads
     - Deletes old profile images when new ones are uploaded
     - Returns public URL for uploaded file
     - Comprehensive error handling with specific HTTP status codes

### 3. **Upload Hook** - [lib/hooks/useImageUpload.ts](../lib/hooks/useImageUpload.ts)
   - Client-side React hook for easy integration
   - `useImageUpload()` returns:
     - `upload(file, type)` - Upload function
     - `isLoading` - Loading state
     - `error` - Error message
     - `success` - Success flag
     - `reset()` - Reset upload state
   - Handles authentication token retrieval from session
   - Progress simulation for user feedback
   - Type-safe with TypeScript

### 4. **Profile Page Integration** - [app/profile/page.tsx](../app/profile/page.tsx)
   - New "Profile Picture" section at the top of profile page
   - Features:
     - Display current profile picture (with emoji fallback)
     - Click-to-upload button
     - Upload progress indicator (spinning loader)
     - Success/error message display
     - File type and size restrictions shown
     - Automatic profile refresh after successful upload

### 5. **Environment Configuration** - [_docs/CLOUDFLARE_R2_SETUP.md](CLOUDFLARE_R2_SETUP.md)
   - Complete setup guide for Cloudflare R2
   - Step-by-step bucket and API token creation
   - Environment variable documentation
   - Custom domain setup instructions
   - Cost estimation and monitoring guide
   - Troubleshooting section

### 6. **Dependencies**
   - Added `@aws-sdk/client-s3@^3.616.0` to package.json
   - Installed with `npm install --legacy-peer-deps`

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name

# Public URL for accessing files (can be custom domain or Cloudflare domain)
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-bucket-name.r2.cloudflarestorage.com
```

## Architecture

```
User Profile Page
       ↓
useImageUpload hook (client)
       ↓
POST /api/upload (auth required)
       ↓
Validate file (size, type, auth)
       ↓
Upload to R2 via S3Client
       ↓
Update user.photo_url in Supabase
       ↓
Delete old image from R2
       ↓
Return public URL to client
       ↓
Refresh user profile & display
```

## File Organization in R2

```
medikal-storage/ (your bucket)
├── users/
│   ├── uuid-1/
│   │   ├── profile-1704067200000-avatar.jpg
│   │   └── profile-1704153600000-new-avatar.png
│   ├── uuid-2/
│   │   └── profile-1704240000000-pic.jpg
│
└── reviews/
    ├── uuid-1/
    │   ├── facility-uuid-1/
    │   │   ├── 1704067200000-review-1.jpg
    │   │   └── 1704153600000-review-2.jpg
```

## Usage Examples

### Upload from Profile Page
Simply click the "Upload Photo" button on `/profile` - the UI is fully integrated.

### Upload from Custom Component

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';

export function MyComponent() {
  const { upload, isLoading, error, success } = useImageUpload();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload(file, 'profile');
    if (result.success) {
      console.log('Upload successful:', result.url);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={isLoading} />
      {isLoading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Upload successful!</p>}
    </div>
  );
}
```

### Using R2 Utilities Directly (Server-side)

```typescript
import { uploadToR2, deleteFromR2, generateUserProfileImageKey } from '@/lib/r2';

// Upload a file
const key = generateUserProfileImageKey(userId, fileName);
const url = await uploadToR2(key, buffer, 'image/jpeg');

// Delete a file
await deleteFromR2(key);
```

## Security Features

1. **JWT Authentication**: All uploads require valid Supabase session token
2. **File Validation**: Only specific image types accepted (JPEG, PNG, WebP, GIF)
3. **Size Limit**: Maximum 5MB per file
4. **User Isolation**: Files stored in user-specific directories
5. **Database Integration**: Only authenticated users can update their profile picture
6. **Automatic Cleanup**: Old images deleted when new ones uploaded

## Error Handling

The implementation includes comprehensive error handling:

| Error | HTTP Status | Message |
|-------|------------|---------|
| No auth header | 401 | "Missing or invalid authorization header" |
| Invalid token | 401 | "Invalid or expired authentication token" |
| No file in request | 400 | "No file provided" |
| File too large | 413 | "File size exceeds 5MB limit" |
| Unsupported type | 415 | "File type not supported. Allowed: JPEG, PNG, WebP, GIF" |
| R2 upload failure | 500 | Specific R2 error message |
| Database update failure | 500 | "Failed to save image URL to profile" |

## Testing

### Manual Testing Steps

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Create a test Cloudflare R2 bucket**:
   - Go to Cloudflare Dashboard → R2
   - Create new bucket (e.g., `medikal-test`)
   - Create API token with access to this bucket

3. **Add environment variables** to `.env.local`:
   ```env
   CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
   CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
   CLOUDFLARE_R2_BUCKET_NAME=medikal-test
   NEXT_PUBLIC_R2_PUBLIC_URL=https://medikal-test.r2.cloudflarestorage.com
   ```

4. **Restart dev server** (env vars need reload)

5. **Test upload**:
   - Go to http://localhost:3000/login
   - Sign up or log in
   - Navigate to http://localhost:3000/profile
   - Click "Upload Photo" and select an image
   - Verify image appears in profile
   - Check Cloudflare R2 dashboard to see the file

6. **Verify database update**:
   - Check that `users.photo_url` was updated with the R2 URL

### Automated Testing (Vitest)

To add tests for the upload functionality:

```typescript
import { describe, it, expect } from 'vitest';
import { uploadToR2, generateUserProfileImageKey } from '@/lib/r2';

describe('R2 Integration', () => {
  it('should generate correct key format', () => {
    const key = generateUserProfileImageKey('user-123', 'photo.jpg');
    expect(key).toMatch(/^users\/user-123\/profile-\d+-photo\.jpg$/);
  });

  // Add more tests as needed
});
```

## Database Schema

The implementation uses the existing `users` table:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  ...
  photo_url TEXT,  -- Stores R2 public URL
  ...
);
```

No schema changes required - the `photo_url` field already exists.

## Future Enhancements

Possible improvements for future versions:

1. **Image Optimization**: Resize and compress images before uploading
2. **Multiple Uploads**: Allow batch uploads
3. **Image Cropping**: Client-side image editor before upload
4. **CDN Integration**: Use Cloudflare's image optimization service
5. **Review Images**: Extend upload functionality to reviews and comments
6. **Medical Facility Images**: Upload facility/listing images
7. **Progress Bar**: Replace simulated progress with actual upload tracking
8. **Image Gallery**: Browse and manage uploaded images
9. **Expiration Policies**: Auto-delete old images after set period
10. **Analytics**: Track upload metrics and usage patterns

## Monitoring & Maintenance

### Monitor R2 Usage
1. Cloudflare Dashboard → R2 → Your Bucket → Analytics
2. Check storage, request counts, and egress
3. Set up alerts for unusual activity

### Cost Tracking
- Monthly storage cost: ~$0.015 per GB
- Request costs are minimal for typical usage
- Egress is free within Cloudflare network

### Cleanup Tasks
- Old images are automatically deleted when new ones uploaded
- Consider implementing cleanup for abandoned/inactive accounts
- Monitor for orphaned files (users with URLs but no file in R2)

## Troubleshooting

### Common Issues

**Upload fails with "Missing or invalid authorization header"**
- Ensure user is logged in
- Check browser network tab for Authorization header
- Verify Supabase session is active

**"File type not supported" error**
- Ensure file is JPEG, PNG, WebP, or GIF
- Check file extension matches content

**"File size exceeds 5MB limit"**
- Compress image before uploading
- Consider client-side compression

**Uploaded file not visible in profile**
- Wait for page refresh
- Check browser cache
- Verify `NEXT_PUBLIC_R2_PUBLIC_URL` is correct
- Check R2 bucket permissions

**"CLOUDFLARE_R2_ACCOUNT_ID environment variable is not set"**
- Add all required env vars to `.env.local`
- Restart dev server after changes
- Check for typos in variable names

## Related Documentation

- [Cloudflare R2 Setup Guide](CLOUDFLARE_R2_SETUP.md) - Complete setup instructions
- [Copilot Instructions](../.github/copilot-instructions.md) - Project conventions
- [Supabase Integration](./TechnicalGuides/database/supabase-integration.md) - Database architecture

## Files Modified/Created

- ✅ Created: [lib/r2.ts](../lib/r2.ts)
- ✅ Created: [app/api/upload/route.ts](../app/api/upload/route.ts)
- ✅ Created: [lib/hooks/useImageUpload.ts](../lib/hooks/useImageUpload.ts)
- ✅ Modified: [app/profile/page.tsx](../app/profile/page.tsx)
- ✅ Modified: [package.json](../package.json) - Added @aws-sdk/client-s3
- ✅ Created: [_docs/CLOUDFLARE_R2_SETUP.md](CLOUDFLARE_R2_SETUP.md)

## Next Steps

1. **Get Cloudflare R2 Credentials**:
   - Follow [CLOUDFLARE_R2_SETUP.md](CLOUDFLARE_R2_SETUP.md)
   - Create bucket and API token

2. **Configure Environment Variables**:
   - Add credentials to `.env.local`
   - Restart dev server

3. **Test Upload Functionality**:
   - Navigate to `/profile`
   - Test image upload
   - Verify in R2 dashboard

4. **Deploy to Production**:
   - Add env vars to production environment
   - Test end-to-end
   - Monitor usage

5. **Extend to Other Features**:
   - Add review image uploads
   - Add facility/listing images
   - Implement image optimization

---

**Implementation Date**: January 28, 2026
**AWS SDK Version**: @aws-sdk/client-s3@^3.616.0
**Status**: ✅ Complete and Ready for Testing
