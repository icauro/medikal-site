import { NextResponse } from 'next/server';

/**
 * @deprecated This endpoint has been deprecated as of January 21, 2026
 * Firebase Admin SDK has been removed from the project.
 * Use the admin dashboard (/admin) with UserCRUDModal instead.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'gone',
      message: 'This endpoint has been deprecated',
      details: 'The upload-facilities API is no longer available. Firebase Admin SDK has been removed.',
      alternativeMethod: 'Use the admin dashboard (/admin) with UserCRUDModal to create medical facility accounts',
      timestamp: new Date().toISOString(),
    },
    { status: 410 } // 410 Gone
  );
}

export async function POST() {
  return NextResponse.json(
    {
      status: 'gone',
      message: 'This endpoint has been deprecated',
      details: 'The upload-facilities API is no longer available. Firebase Admin SDK has been removed.',
      alternativeMethod: 'Use the admin dashboard (/admin) with UserCRUDModal to create medical facility accounts',
      timestamp: new Date().toISOString(),
    },
    { status: 410 } // 410 Gone
  );
}
