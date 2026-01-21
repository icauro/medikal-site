import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug API called');

    return NextResponse.json({
      status: 'success',
      message: 'Debug API working - Supabase migration active',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Debug API failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug POST API called');

    const body = await request.json();
    console.log('📦 Received body:', JSON.stringify(body, null, 2));

    return NextResponse.json({
      status: 'success',
      message: 'Debug POST API working',
      received: body,
      note: 'Supabase migration active - Firebase Admin deprecated'
    });

  } catch (error) {
    console.error('❌ Debug POST API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Debug POST API failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}