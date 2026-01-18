import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { doc, setDoc, serverTimestamp } from 'firebase-admin/firestore';

interface FacilityData {
  name: string;
  facilityType: string;
  address: string;
  province: string;
  country: string;
  phone?: string;
  slug: string;
  sourceFile: string;
  originalType: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { facilities, batchIndex = 0 } = body;

    if (!Array.isArray(facilities)) {
      return NextResponse.json(
        { error: 'Invalid data: facilities must be an array' },
        { status: 400 }
      );
    }

    console.log(`Processing batch ${batchIndex + 1}, ${facilities.length} facilities`);

    // Validate and upload facilities
    const results = {
      uploaded: 0,
      errors: 0,
      skipped: 0,
      details: [] as string[]
    };

    for (const facility of facilities) {
      try {
        // Validate required fields
        if (!facility.name || !facility.facilityType || !facility.address ||
            !facility.province || !facility.country) {
          results.errors++;
          results.details.push(`Skipped ${facility.name || 'Unknown'}: Missing required fields`);
          continue;
        }

        // Validate facility type
        const validTypes = ['Solo Practice', 'Polyclinic', 'Clinic', 'Health Center', 'Hospital'];
        if (!validTypes.includes(facility.facilityType)) {
          results.errors++;
          results.details.push(`Skipped ${facility.name}: Invalid facility type '${facility.facilityType}'`);
          continue;
        }

        // Create document ID from slug
        const docId = facility.slug || `facility_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Check if facility already exists
        const existingDoc = await adminDb.collection('medical_facility_listings').doc(docId).get();
        if (existingDoc.exists) {
          results.skipped++;
          results.details.push(`Skipped ${facility.name}: Already exists`);
          continue;
        }

        // Prepare document data
        const docData = {
          name: facility.name,
          facilityType: facility.facilityType,
          address: facility.address,
          province: facility.province,
          country: facility.country,
          slug: facility.slug || '',
          phone: facility.phone || null,
          email: null,
          website: null,
          specializations: [],
          rating: null,
          reviewCount: 0,
          googlePlaceId: null,
          googleReviewsEmbedUrl: null,
          userId: null, // No associated user account yet
          verifiedDoctorIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: decodedToken.uid,
          verified: false, // New facilities start as unverified
        };

        // Upload to Firestore
        await adminDb.collection('medical_facility_listings').doc(docId).set(docData);

        results.uploaded++;
        results.details.push(`Uploaded: ${facility.name}`);

      } catch (error) {
        results.errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.details.push(`Error uploading ${facility.name || 'Unknown'}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      batchIndex,
      results,
      message: `Batch ${batchIndex + 1} processed: ${results.uploaded} uploaded, ${results.errors} errors, ${results.skipped} skipped`
    });

  } catch (error) {
    console.error('Upload facilities API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Medical Facilities Upload API',
    usage: 'POST with facilities array and authorization header'
  });
}