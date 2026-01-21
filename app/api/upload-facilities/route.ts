import { NextRequest, NextResponse } from 'next/server';

/*
 * DEPRECATED: Medical Facilities Upload API
 * Migration: Firebase Admin → Supabase
 * This endpoint was used to batch upload facilities via admin panel.
 * New implementation should use Supabase direct API with RLS policies.
 * Timeline: 2026-01-21
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Upload facilities API called');
    console.log('ℹ️  Firebase Admin SDK deprecated. Please use Supabase client API instead.');

    return NextResponse.json(
      {
        error: 'This endpoint has been deprecated',
        message: 'Medical facility uploads should now use Supabase API with authenticated requests',
        status: 'deprec ated'
      },
      { status: 410 } // Gone - Permanently Unavailable
    );

  } catch (error) {
    console.error('❌ Upload facilities API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Medical Facilities Upload API (Deprecated)',
    status: 'deprecated',
    migration: 'Use Supabase client API instead',
    timeline: '2026-01-21'
  });
}