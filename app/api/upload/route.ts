import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateUserProfileImageKey, deleteFromR2 } from '@/lib/r2';
import { supabase } from '@/lib/supabase';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/upload
 * 
 * Handles image uploads to Cloudflare R2 and updates user profile in Supabase
 * 
 * Request body:
 * - file: FormData file input
 * - type: 'profile' | 'review' (optional, defaults to 'profile')
 * 
 * Returns:
 * - 200: { success: true, url: string, fileName: string }
 * - 400: { success: false, error: string } (invalid file or missing auth)
 * - 401: { success: false, error: string } (not authenticated)
 * - 413: { success: false, error: string } (file too large)
 * - 415: { success: false, error: string } (unsupported file type)
 * - 500: { success: false, error: string } (server error)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      console.log('🚫 [UPLOAD] Invalid token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    console.log('👤 [UPLOAD] User authenticated:', userId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadType = (formData.get('type') as string) || 'profile';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 413 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not supported. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 415 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique key for R2
    const r2Key = generateUserProfileImageKey(userId, file.name);

    // Upload to R2
    const fileUrl = await uploadToR2(r2Key, buffer, file.type);

    // For profile uploads, update user's photo_url in Supabase
    if (uploadType === 'profile') {
      // First, delete the old profile image if it exists
      const { data: userData } = await supabase
        .from('users')
        .select('photo_url')
        .eq('id', userId)
        .single();

      if (userData?.photo_url) {
        try {
          // Extract the R2 key from the old URL and delete it
          const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
          if (userData.photo_url.startsWith(baseUrl)) {
            const oldKey = userData.photo_url.substring(baseUrl.length + 1);
            await deleteFromR2(oldKey);
            console.log('🗑️ [UPLOAD] Deleted old profile image:', oldKey);
          }
        } catch (deleteError) {
          console.log('⚠️ [UPLOAD] Failed to delete old image, continuing anyway:', deleteError);
        }
      }

      // Update user's photo_url in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          photo_url: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('🚫 [UPLOAD] Failed to update user profile:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to save image URL to profile' },
          { status: 500 }
        );
      }

      console.log('✅ [UPLOAD] Profile picture updated:', { userId, fileUrl });
    }

    return NextResponse.json(
      {
        success: true,
        url: fileUrl,
        fileName: file.name,
        type: uploadType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('🚫 [UPLOAD] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ready',
      message: 'Upload API is ready',
      info: 'POST to this endpoint with FormData containing "file" to upload images to Cloudflare R2',
    },
    { status: 200 }
  );
}
