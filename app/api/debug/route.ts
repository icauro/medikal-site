import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET() {
  try {
    console.log('🔍 Debug API called');

    // Test Firebase connection
    console.log('🔗 Testing Firebase connection...');
    const testDoc = await adminDb.collection('test').doc('debug').get();
    console.log('✅ Firebase connection successful');

    // Test auth (optional)
    try {
      console.log('🔐 Testing auth...');
      const auth = getAuth();
      console.log('✅ Auth initialized successfully');
    } catch (authError) {
      console.log('⚠️ Auth test failed:', authError);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Debug API working',
      firebase: 'connected',
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

    // Test Firestore write
    console.log('💾 Testing Firestore write...');
    const testRef = adminDb.collection('test').doc('debug_post');
    await testRef.set({
      testData: body,
      timestamp: new Date(),
      message: 'Debug POST test successful'
    });
    console.log('✅ Firestore write successful');

    return NextResponse.json({
      status: 'success',
      message: 'Debug POST API working',
      received: body,
      firestore: 'write successful'
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