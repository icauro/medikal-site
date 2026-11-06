# Cloudflare R2 Setup Guide

This document explains how to configure Cloudflare R2 for user image storage in the Medikal Portal project.

## Overview

Cloudflare R2 is an object storage solution compatible with the S3 API. It stores all user-uploaded images (profile pictures, review images, etc.) with better performance and cost efficiency compared to traditional cloud storage.

## Prerequisites

1. A Cloudflare account with R2 enabled
2. An R2 bucket created
3. An API token for R2 access

## Step 1: Create an R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2** in the left sidebar
3. Click **Create bucket**
4. Choose a unique bucket name (e.g., `medikal-storage`)
5. Choose the appropriate region
6. Click **Create bucket**

## Step 2: Create an API Token for R2

1. In the Cloudflare dashboard, go to **R2 Settings**
2. Scroll to **API tokens** section
3. Click **Create API token**
4. Configure the token:
   - **Scope**: Object Read/Write permission (or limit to your bucket)
   - **TTL**: Set an appropriate expiration (or leave empty for no expiration)
5. Copy the generated credentials:
   - **Access Key ID**
   - **Secret Access Key**
6. Save these securely

## Step 3: Configure Environment Variables

Add the following variables to your `.env.local` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name

# Public URL for accessing uploaded files
# This is the public endpoint for your bucket
# Format: https://{bucket-name}.{domain}.com (custom domain) 
#         or https://{bucket-name}.r2.cloudflarestorage.com (default)
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-bucket-name.your-domain.com
```

### Finding Your Credentials

**Account ID**:
- Go to Cloudflare Dashboard → Account Settings → Accounts
- Copy your Account ID

**Bucket's Public URL**:
- Go to R2 → Your Bucket → Settings
- Under "Domain", use either:
  - **Default domain**: `https://{bucket-name}.r2.cloudflarestorage.com`
  - **Custom domain**: If you've configured one (requires additional setup)

## Step 4: (Optional) Set Up a Custom Domain for R2

For better user experience and branding:

1. In your R2 bucket settings, click **Connect domain**
2. Choose between:
   - **Cloudflare subdomain**: Automatic, uses `{bucket}.{your-domain}.com`
   - **Custom CNAME**: Point your own domain to R2

This allows files to be accessed as `https://cdn.yourdomain.com/users/...` instead of the default Cloudflare URL.

## API Endpoints

### Upload Image

**Endpoint**: `POST /api/upload`

**Headers**:
```
Authorization: Bearer {supabase_auth_token}
Content-Type: multipart/form-data
```

**Request Body**:
```
form-data:
  - file: [binary file]
  - type: 'profile' | 'review' (optional, defaults to 'profile')
```

**Response** (Success - 200):
```json
{
  "success": true,
  "url": "https://your-bucket.com/users/{user-id}/profile-{timestamp}-{filename}",
  "fileName": "original-filename.jpg",
  "type": "profile"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Error description"
}
```

**Error Status Codes**:
- `400`: No file provided or invalid request
- `401`: Unauthorized (missing/invalid auth token)
- `413`: File size exceeds 5MB limit
- `415`: Unsupported file type (only JPEG, PNG, WebP, GIF allowed)
- `500`: Server error

## Usage in Components

### Profile Picture Upload

The profile page (`app/profile/page.tsx`) includes a built-in image upload feature:

```tsx
// The useImageUpload hook handles the upload
const { upload, isLoading, error, success } = useImageUpload();

// Upload a file
const handleFileChange = async (file: File) => {
  const result = await upload(file, 'profile');
  if (result.success) {
    console.log('Image URL:', result.url);
    // Image automatically updates in user profile
  }
};
```

### Custom Upload Implementation

For other components needing image uploads:

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';

export function MyComponent() {
  const { upload, isLoading, error } = useImageUpload();

  const handleUpload = async (file: File) => {
    const result = await upload(file, 'review');
    if (result.success) {
      console.log('Uploaded to:', result.url);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
    />
  );
}
```

## File Organization

Files are organized in R2 by type and user:

```
users/
├── {user-id}/
│   ├── profile-1704067200000-avatar.jpg
│   └── profile-1704153600000-new-avatar.png

reviews/
├── {user-id}/
│   ├── {listing-id}/
│   │   ├── 1704067200000-review-image-1.jpg
│   │   └── 1704153600000-review-image-2.jpg
```

## Database Integration

When a profile picture is uploaded:

1. File is uploaded to R2
2. Public URL is returned
3. User's `photo_url` field in the `users` table is updated automatically
4. Old profile picture is deleted from R2 (if one existed)

## Security Considerations

1. **JWT Authentication**: All uploads require a valid Supabase JWT token
2. **File Type Validation**: Only image files (JPEG, PNG, WebP, GIF) are accepted
3. **File Size Limit**: Maximum 5MB per file
4. **User Isolation**: Files are stored in user-specific directories
5. **API Token**: Keep your R2 API credentials secure and rotate regularly
6. **RLS Integration**: Supabase RLS policies ensure only authenticated users can upload

## Testing Upload Functionality

1. Start the dev server: `npm run dev`
2. Log in to your account at `http://localhost:3000/login`
3. Navigate to `/profile`
4. Click "Upload Photo" to test image uploads
5. Verify the image appears in your profile
6. Check Cloudflare R2 dashboard to see the uploaded file

## Troubleshooting

### "Missing or invalid authorization header"
- Ensure you're logged in
- Check that the auth token is valid

### "File type not supported"
- Only JPEG, PNG, WebP, and GIF are allowed
- Check your file format

### "File size exceeds 5MB limit"
- Your file is too large
- Compress the image before uploading

### "CLOUDFLARE_R2_ACCOUNT_ID environment variable is not set"
- Add missing environment variables to `.env.local`
- Restart the dev server after adding env vars

### Images not loading
- Verify `NEXT_PUBLIC_R2_PUBLIC_URL` is correct
- Check that your R2 bucket has public read access (if needed)
- Verify the bucket name and domain in Cloudflare R2 settings

## Cost Estimation

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015 per GB per month
- **Requests**: $0.36 per million read requests, $4.50 per million write requests
- **Egress**: Included with Cloudflare (first 100GB free per month)

For typical usage (1000 users with 2-3 profile images each, ~500KB per image):
- Storage: ~1.5-2GB = ~$0.02-0.03/month
- Minimal request costs

## Monitoring

Monitor R2 usage in the Cloudflare dashboard:
1. Go to **R2** → Your Bucket → **Analytics**
2. Check storage usage, request counts, and egress
3. Set up alerts for unusual activity

## Related Files

- [lib/r2.ts](lib/r2.ts) - R2 client initialization and utilities
- [app/api/upload/route.ts](app/api/upload/route.ts) - Upload API endpoint
- [lib/hooks/useImageUpload.ts](lib/hooks/useImageUpload.ts) - Client-side upload hook
- [app/profile/page.tsx](app/profile/page.tsx) - Profile page with image upload UI

## Support

For issues with:
- **Cloudflare R2**: See [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- **Upload API**: Check server logs and error messages in browser console
- **Image display**: Verify public URL and bucket permissions
