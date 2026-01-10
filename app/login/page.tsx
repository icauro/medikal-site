"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, signInWithGoogle, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addAccount = searchParams.get('addAccount') === 'true';

  console.log('📱 [LOGIN] Login page rendered', {
    hasUser: !!user,
    loading: loading,
    addAccount: addAccount,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server'
  });

  useEffect(() => {
    console.log('🔄 [LOGIN] Checking authentication state...');

    // If user is logged in but NOT trying to add another account, redirect to home
    if (user && !addAccount) {
      console.log('✅ [LOGIN] User already authenticated, redirecting to home', {
        uid: user.uid,
        email: user.email
      });
      router.push('/');
    } else {
      console.log('ℹ️ [LOGIN] No authenticated user found or adding new account');
    }
  }, [user, router, addAccount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          {addAccount && user ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Add Another Account</h1>
              <p className="text-zinc-400 mb-6">
                You're currently signed in as <span className="text-white font-medium">{user.email}</span>
              </p>
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  ⚠️ To add another account, you need to sign out first and then sign in with a different Google account.
                </p>
              </div>
              <button
                onClick={async () => {
                  console.log('🚪 [LOGIN] Logging out to add new account');
                  try {
                    await logout();
                    console.log('✅ [LOGIN] Logout successful, ready for new account');
                    // Remove the addAccount parameter and stay on login page
                    router.replace('/login');
                  } catch (error) {
                    console.error('❌ [LOGIN] Logout failed:', error);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out & Add Account
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
              <p className="text-zinc-400 mb-8">
                Sign in with your Google account
              </p>

              <button
                onClick={() => {
                  console.log('🔐 [LOGIN] User initiated Google sign-in');
                  signInWithGoogle().catch((error) => {
                    console.error('❌ [LOGIN] Google sign-in failed:', error);
                  });
                }}
                className="w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
