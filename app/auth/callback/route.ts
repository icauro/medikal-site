import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(
        `${requestUrl.origin}?error=Missing_Supabase_Config`
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('🔐 [AUTH] Code exchange error:', error);
        return NextResponse.redirect(
          `${requestUrl.origin}?error=CodeExchangeFailed`
        );
      }

      console.log('✅ [AUTH] Session created successfully from OAuth code');
      return NextResponse.redirect(`${requestUrl.origin}/signup/role-selection`);
    } catch (error) {
      console.error('❌ [AUTH] Unexpected error during code exchange:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}?error=UnexpectedError`
      );
    }
  }

  // If no code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
