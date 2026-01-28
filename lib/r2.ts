/**
 * Cloudflare R2 Storage Configuration & Utilities
 * 
 * This module provides utilities for uploading, retrieving, and deleting files
 * from Cloudflare R2 object storage.
 * 
 * Required Environment Variables:
 * - CLOUDFLARE_R2_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_R2_ACCESS_KEY_ID: R2 API token access key
 * - CLOUDFLARE_R2_SECRET_ACCESS_KEY: R2 API token secret key
 * - CLOUDFLARE_R2_BUCKET_NAME: R2 bucket name (e.g., "medikal-storage")
 * - NEXT_PUBLIC_R2_PUBLIC_URL: Public URL for R2 bucket (e.g., "https://your-bucket.your-domain.com")
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

// Initialize R2 Client (compatible with S3 API)
const getR2Client = () => {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('🚫 [R2] Missing required environment variables for R2 initialization');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const getBucketName = (): string => {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME environment variable is not set');
  }
  return bucketName;
};

const getPublicUrl = (): string => {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL environment variable is not set');
  }
  return publicUrl;
};

/**
 * Upload a file to Cloudflare R2
 * 
 * @param key - The object key/path in R2 (e.g., "users/user-id/profile.jpg")
 * @param body - File content (Buffer, Uint8Array, or ReadableStream)
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  try {
    const client = getR2Client();
    if (!client) {
      throw new Error('R2 client failed to initialize');
    }

    const bucketName = getBucketName();
    const publicUrl = getPublicUrl();

    console.log('💾 [R2] Uploading file:', { key, contentType, size: body.length });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);

    const fileUrl = `${publicUrl}/${key}`;
    console.log('✅ [R2] File uploaded successfully:', fileUrl);

    return fileUrl;
  } catch (error) {
    console.error('🚫 [R2] Upload failed:', error);
    throw error;
  }
}

/**
 * Delete a file from Cloudflare R2
 * 
 * @param key - The object key/path in R2 to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const client = getR2Client();
    if (!client) {
      throw new Error('R2 client failed to initialize');
    }

    const bucketName = getBucketName();

    console.log('🗑️ [R2] Deleting file:', { key });

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);

    console.log('✅ [R2] File deleted successfully:', key);
  } catch (error) {
    console.error('🚫 [R2] Delete failed:', error);
    throw error;
  }
}

/**
 * Check if a file exists in Cloudflare R2
 * 
 * @param key - The object key/path in R2
 * @returns true if file exists, false otherwise
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    if (!client) {
      return false;
    }

    const bucketName = getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    if ((error as any)?.name === 'NotFound') {
      return false;
    }
    console.error('🚫 [R2] Error checking file existence:', error);
    return false;
  }
}

/**
 * Generate a unique key for storing user profile images
 * 
 * @param userId - User ID from Supabase
 * @param fileName - Original file name
 * @returns A unique key path for R2 storage
 */
export function generateUserProfileImageKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/profile-${timestamp}-${sanitizedFileName}`;
}

/**
 * Generate a unique key for storing user review/comment images
 * 
 * @param userId - User ID from Supabase
 * @param listingId - Listing ID (facility, personnel, etc.)
 * @param fileName - Original file name
 * @returns A unique key path for R2 storage
 */
export function generateReviewImageKey(
  userId: string,
  listingId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `reviews/${userId}/${listingId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Extract R2 key from a public URL
 * 
 * @param publicUrl - The public URL of the file
 * @returns The R2 object key
 */
export function extractKeyFromUrl(publicUrl: string): string | null {
  try {
    const baseUrl = getPublicUrl();
    if (publicUrl.startsWith(baseUrl)) {
      return publicUrl.substring(baseUrl.length + 1); // +1 to skip the leading slash
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate that an R2 public URL points to an existing object
 * 
 * EDGE CASE HANDLING:
 * When a user's photo_url field in the database points to an R2 image that has been deleted,
 * this can occur due to:
 * - R2 deletion succeeding but database update failing
 * - Manual R2 bucket cleanup
 * - External deletion via Cloudflare dashboard
 * 
 * This function validates the URL actually exists before attempting to display it.
 * 
 * @param publicUrl - The public URL of the file
 * @returns true if the file exists in R2, false otherwise
 */
export async function validateR2Url(publicUrl: string): Promise<boolean> {
  try {
    const key = extractKeyFromUrl(publicUrl);
    if (!key) {
      console.warn('⚠️ [R2] Could not extract R2 key from URL:', publicUrl);
      return false;
    }

    const exists = await fileExistsInR2(key);
    if (!exists) {
      console.warn('⚠️ [R2] ORPHANED URL - File exists in database but not in R2:', {
        url: publicUrl,
        key,
      });
    }
    return exists;
  } catch (error) {
    console.error('🚫 [R2] Error validating URL:', error);
    return false;
  }
}
