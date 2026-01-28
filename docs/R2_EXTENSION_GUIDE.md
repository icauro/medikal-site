# Extending R2 Image Storage to Other Features

This guide shows how to extend Cloudflare R2 image storage beyond profile pictures to other parts of the application.

## Current Implementation

Currently, R2 is integrated for:
- ✅ User profile pictures (`/profile` page)

## How to Add Review Images

### 1. Update the AddReview Component

**File**: `app/add-review/page.tsx`

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';

export function ReviewForm() {
  const { upload, isLoading, error } = useImageUpload();
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  const handleImageUpload = async (file: File) => {
    const result = await upload(file, 'review');
    if (result.success) {
      setReviewImages([...reviewImages, result.url]);
    }
  };

  const handleSubmitReview = async () => {
    // Submit review with attached images
    await supabase.from('comments').insert({
      user_id: user.id,
      listing_id: listingId,
      content: reviewText,
      image_urls: reviewImages, // Store image URLs
    });
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        disabled={isLoading}
      />
      <div className="flex gap-2 flex-wrap">
        {reviewImages.map((url) => (
          <img key={url} src={url} alt="review" className="w-16 h-16 object-cover rounded" />
        ))}
      </div>
    </div>
  );
}
```

### 2. Update Database Schema

Add image URL support to the `comments` table:

```sql
ALTER TABLE public.comments ADD COLUMN image_urls TEXT[] DEFAULT '{}';
```

## How to Add Facility/Listing Images

### 1. Create a New Hook for Facility Images

**File**: `lib/hooks/useFacilityImageUpload.ts`

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export function useFacilityImageUpload() {
  const { user } = useAuth();
  const [state, setState] = useState({
    isLoading: false,
    error: null as string | null,
    success: false,
  });

  const upload = useCallback(
    async (file: File, facilityId: string) => {
      setState({ isLoading: true, error: null, success: false });

      if (!user) {
        setState({ isLoading: false, error: 'Not authenticated', success: false });
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No access token');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'facility');
        formData.append('facility_id', facilityId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        setState({ isLoading: false, error: null, success: true });
        return data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        setState({ isLoading: false, error: errorMsg, success: false });
        return { success: false, error: errorMsg };
      }
    },
    [user]
  );

  return { upload, ...state };
}
```

### 2. Update API Endpoint

Modify `app/api/upload/route.ts` to handle facility images:

```typescript
export async function POST(request: NextRequest) {
  // ... existing validation ...

  const uploadType = (formData.get('type') as string) || 'profile';
  const facilityId = formData.get('facility_id') as string;

  if (uploadType === 'facility') {
    if (!facilityId) {
      return NextResponse.json({ success: false, error: 'facility_id required' }, { status: 400 });
    }

    const r2Key = generateFacilityImageKey(facilityId, file.name);
    const fileUrl = await uploadToR2(r2Key, buffer, file.type);

    // Update facility listing
    const { error: updateError } = await supabase
      .from('medical_facility_listings')
      .update({ image: fileUrl })
      .eq('id', facilityId);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update facility' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, url: fileUrl }, { status: 200 });
}
```

### 3. Add Key Generator

In `lib/r2.ts`:

```typescript
export function generateFacilityImageKey(facilityId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `facilities/${facilityId}/${timestamp}-${sanitized}`;
}
```

## How to Add Healthcare Personnel Images

Similar pattern:

```typescript
// In lib/r2.ts
export function generatePersonnelImageKey(personnelId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `personnel/${personnelId}/${timestamp}-${sanitized}`;
}

// In app/api/upload/route.ts
if (uploadType === 'personnel') {
  const personnelId = formData.get('personnel_id') as string;
  const r2Key = generatePersonnelImageKey(personnelId, file.name);
  const fileUrl = await uploadToR2(r2Key, buffer, file.type);

  // Update healthcare_personnel_listings or users table
  const { error } = await supabase
    .from('healthcare_personnel_listings')
    .update({ image: fileUrl })
    .eq('id', personnelId);

  // ... error handling ...
}
```

## How to Add Agency Images

```typescript
// In lib/r2.ts
export function generateAgencyImageKey(agencyId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `agencies/${agencyId}/${timestamp}-${sanitized}`;
}

// In app/api/upload/route.ts
if (uploadType === 'agency') {
  const agencyId = formData.get('agency_id') as string;
  const r2Key = generateAgencyImageKey(agencyId, file.name);
  const fileUrl = await uploadToR2(r2Key, buffer, file.type);

  const { error } = await supabase
    .from('agency_listings')
    .update({ image: fileUrl })
    .eq('id', agencyId);
}
```

## Generic Reusable Upload Component

Create a component that works for any entity:

**File**: `app/components/ImageUploadWidget.tsx`

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadWidgetProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
  label?: string;
  maxSize?: number; // in MB
}

export function ImageUploadWidget({
  onImageUpload,
  currentImage,
  label = 'Upload Image',
  maxSize = 5,
}: ImageUploadWidgetProps) {
  const { upload, isLoading, error, success } = useImageUpload();
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const result = await upload(file, 'profile'); // Can be parameterized
    if (result.success) {
      onImageUpload(result.url);
      setPreview(result.url);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      
      {preview && (
        <Image
          src={preview}
          alt="Preview"
          width={120}
          height={120}
          className="w-24 h-24 object-cover rounded border"
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={isLoading}
        className="block text-sm"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-500">✅ Uploaded</p>}
      {isLoading && <p className="text-xs text-blue-500">⏳ Uploading...</p>}
    </div>
  );
}
```

Usage:

```tsx
<ImageUploadWidget
  onImageUpload={(url) => setFacilityImage(url)}
  currentImage={facility.image}
  label="Facility Photo"
/>
```

## Advanced: Batch Upload Multiple Images

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';

export function BatchImageUpload() {
  const { upload, isLoading } = useImageUpload();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await upload(files[i], 'review');
      if (result.success && result.url) {
        urls.push(result.url);
      }
    }

    setUploadedUrls([...uploadedUrls, ...urls]);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleMultipleFiles(e.target.files)}
        disabled={isLoading}
      />
      <div className="grid grid-cols-3 gap-2">
        {uploadedUrls.map((url) => (
          <img key={url} src={url} alt="" className="w-24 h-24 object-cover rounded" />
        ))}
      </div>
    </div>
  );
}
```

## Database Updates for Each Feature

### For Comments/Reviews
```sql
ALTER TABLE public.comments 
ADD COLUMN image_urls TEXT[] DEFAULT '{}',
ADD COLUMN thumbnail_url TEXT;
```

### For Facilities
```sql
-- Already exists, but ensure:
-- medical_facility_listings has 'image' field
```

### For Healthcare Personnel
```sql
-- Already exists, but ensure:
-- healthcare_personnel_listings has 'image' field
```

### For Agencies
```sql
-- Already exists, but ensure:
-- agency_listings has 'image' field
```

## Key Patterns

1. **Unique Keys**: Each entity type has a dedicated key generator
   - `users/{id}/profile-...`
   - `reviews/{user}/...`
   - `facilities/{id}/...`
   - `personnel/{id}/...`
   - `agencies/{id}/...`

2. **Upload Type Parameter**: API endpoint handles multiple types
   - `type: 'profile'` → update `users.photo_url`
   - `type: 'review'` → store in comment metadata
   - `type: 'facility'` → update `medical_facility_listings.image`
   - etc.

3. **Auto-cleanup**: When updating entities, delete old images
4. **User Isolation**: All images owned by users are in user-specific paths
5. **Validation**: All uploads require authentication and file validation

## Error Handling Pattern

Every image feature should follow this pattern:

```tsx
const { upload, isLoading, error, success } = useImageUpload();

// Validate
if (!file) return; // No file
if (file.size > 5 * 1024 * 1024) return; // Too large

// Upload
const result = await upload(file, 'your-type');

// Handle result
if (result.success) {
  // Update database
  await db.update({ imageUrl: result.url });
} else {
  // Show error
  showError(result.error);
}
```

## Testing Batch Uploads

```bash
# In dev environment, test with multiple images
npm run dev
# Go to your new image feature
# Upload 3-5 images
# Check R2 dashboard to verify all files exist
# Check database to verify URLs were saved correctly
```

## Performance Considerations

- **Image Optimization**: Consider resizing before upload (future enhancement)
- **Parallel Uploads**: Upload multiple files concurrently for batch operations
- **Caching**: Leverage Cloudflare's CDN for fast image delivery
- **Progress Tracking**: Implement real upload progress for large files

## Migration Notes

If you have existing images stored elsewhere:

```typescript
// Script to migrate images to R2
async function migrateImagesToR2(oldImageUrl: string, entityId: string, type: string) {
  // Fetch old image
  const response = await fetch(oldImageUrl);
  const buffer = await response.arrayBuffer();

  // Upload to R2
  const key = generateKey(entityId, 'migrated.jpg'); // Adjust type-specific
  const newUrl = await uploadToR2(key, Buffer.from(buffer), 'image/jpeg');

  // Update database
  await updateEntityImage(entityId, type, newUrl);
}
```

---

## Related Documentation

- [R2 Integration Summary](R2_INTEGRATION_SUMMARY.md)
- [Cloudflare R2 Setup](CLOUDFLARE_R2_SETUP.md)
- [Quick Reference](R2_QUICK_REFERENCE.md)
