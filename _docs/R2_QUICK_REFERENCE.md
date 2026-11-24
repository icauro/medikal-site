# Cloudflare R2 - Quick Reference

## Setup Checklist

- [ ] Create R2 bucket in Cloudflare dashboard
- [ ] Generate R2 API token (access key + secret key)
- [ ] Add environment variables to `.env.local`:
  ```env
  CLOUDFLARE_R2_ACCOUNT_ID=
  CLOUDFLARE_R2_ACCESS_KEY_ID=
  CLOUDFLARE_R2_SECRET_ACCESS_KEY=
  CLOUDFLARE_R2_BUCKET_NAME=
  NEXT_PUBLIC_R2_PUBLIC_URL=
  ```
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Restart dev server (`npm run dev`)
- [ ] Test upload on `/profile` page

## Core Files

| File | Purpose |
|------|---------|
| [lib/r2.ts](lib/r2.ts) | R2 client & utilities |
| [app/api/upload/route.ts](app/api/upload/route.ts) | Upload endpoint |
| [lib/hooks/useImageUpload.ts](lib/hooks/useImageUpload.ts) | Upload hook |
| [app/profile/page.tsx](app/profile/page.tsx) | Profile UI with upload |

## API Endpoint

**POST** `/api/upload`

Headers:
```
Authorization: Bearer {auth_token}
Content-Type: multipart/form-data
```

Body:
```
file: [binary]
type: 'profile' | 'review' (optional)
```

Response:
```json
{
  "success": true,
  "url": "https://...",
  "fileName": "...",
  "type": "profile"
}
```

## Using the Upload Hook

```tsx
import { useImageUpload } from '@/lib/hooks/useImageUpload';

function MyComponent() {
  const { upload, isLoading, error, success } = useImageUpload();

  const handleUpload = async (file: File) => {
    const result = await upload(file, 'profile');
    if (result.success) {
      console.log('URL:', result.url);
    }
  };

  return <input type="file" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />;
}
```

## Using R2 Utilities (Server-side)

```typescript
import { uploadToR2, deleteFromR2, generateUserProfileImageKey } from '@/lib/r2';

// Upload
const key = generateUserProfileImageKey('user-id', 'photo.jpg');
const url = await uploadToR2(key, buffer, 'image/jpeg');

// Delete
await deleteFromR2(key);
```

## Environment Variables

```env
# Required
CLOUDFLARE_R2_ACCOUNT_ID                 # From Cloudflare Account Settings
CLOUDFLARE_R2_ACCESS_KEY_ID              # From R2 API token
CLOUDFLARE_R2_SECRET_ACCESS_KEY          # From R2 API token
CLOUDFLARE_R2_BUCKET_NAME                # Your bucket name
NEXT_PUBLIC_R2_PUBLIC_URL                # https://pub-{hash}.r2.dev (public read URL)
```

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Upload successful |
| 400 | Invalid request (missing file) |
| 401 | Not authenticated |
| 413 | File too large (>5MB) |
| 415 | Unsupported file type |
| 500 | Server error |

## Allowed File Types

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/webp` (.webp)
- `image/gif` (.gif)

## Max File Size

**5MB per file**

## Logging

Look for emoji-prefixed logs:
- `💾 [R2]` - Upload started
- `✅ [R2]` - Success
- `🚫 [R2]` - Error
- `🗑️ [R2]` - Delete

## Testing

```bash
npm run dev
# Go to http://localhost:3000/login
# Log in
# Go to http://localhost:3000/profile
# Click "Upload Photo"
```

## Troubleshooting

**Issue**: Auth error
→ Ensure user is logged in

**Issue**: File type error
→ Use JPEG, PNG, WebP, or GIF

**Issue**: File size error
→ Image must be < 5MB

**Issue**: Env var error
→ Add vars to `.env.local` and restart server

**Issue**: Image not loading
→ Verify `NEXT_PUBLIC_R2_PUBLIC_URL` is correct

## Documentation

- [Complete Setup Guide](CLOUDFLARE_R2_SETUP.md)
- [Implementation Summary](R2_INTEGRATION_SUMMARY.md)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

## Key Features

✅ JWT authentication required  
✅ File type validation  
✅ Size limit enforcement  
✅ Automatic old image cleanup  
✅ User profile auto-update  
✅ Comprehensive error handling  
✅ Full TypeScript support  
✅ Ready for production  

---
**Last Updated**: January 28, 2026
