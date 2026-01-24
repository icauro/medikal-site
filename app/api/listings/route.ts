import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Create server-side client (no session persistence overhead)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    console.log('📋 [API] Fetching healthcare listings...');
    const start = Date.now();

    // Fetch all three listing types in parallel with optimized queries
    const [personnelRes, facilitiesRes, agenciesRes] = await Promise.all([
      supabase
        .from('healthcare_personnel_listings')
        .select('id, name, slug, specialization, country, province, image, rating, review_count, user_id')
        .order('rating', { ascending: false })
        .limit(100),
      supabase
        .from('medical_facility_listings')
        .select('id, name, slug, country, province, rating, review_count, user_id, link')
        .order('rating', { ascending: false })
        .limit(100),
      supabase
        .from('agency_listings')
        .select('id, name, slug, country, province, city, image, rating, review_count, user_id')
        .order('rating', { ascending: false })
        .limit(100),
    ]);

    const elapsed = Date.now() - start;
    console.log(`📋 [API] Fetched listings in ${elapsed}ms`);

    // Collect errors
    const errors = [];
    if (personnelRes.error) {
      console.error('🚫 [API] Error fetching personnel:', personnelRes.error);
      errors.push(`personnel: ${personnelRes.error.message}`);
    }
    if (facilitiesRes.error) {
      console.error('🚫 [API] Error fetching facilities:', facilitiesRes.error);
      errors.push(`facilities: ${facilitiesRes.error.message}`);
    }
    if (agenciesRes.error) {
      console.error('🚫 [API] Error fetching agencies:', agenciesRes.error);
      errors.push(`agencies: ${agenciesRes.error.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Failed to fetch some listings',
          details: errors,
          data: {
            personnel: personnelRes.data || [],
            facilities: facilitiesRes.data || [],
            agencies: agenciesRes.data || [],
          },
        },
        {
          status: 200, // Return 200 with partial data
          headers: {
            'Cache-Control': 'public, max-age=300', // 5 minute cache for partial data
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Successfully fetched all listings
    const response = NextResponse.json({
      personnel: personnelRes.data || [],
      facilities: facilitiesRes.data || [],
      agencies: agenciesRes.data || [],
      elapsed,
      timestamp: new Date().toISOString(),
    });

    // Add caching headers for successful responses
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800'); // 10 min cache, 30 min stale
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
