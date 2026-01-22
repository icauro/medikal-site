"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import GDPRConsent from './GDPRConsent';

/**
 * SignupFlowManager handles the multi-step signup process
 * - GDPR consent
 * - Role selection
 * - Professional application (doctor/clinic/agency)
 */
export default function SignupFlowManager({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, acceptGDPR, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showGDPR, setShowGDPR] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // If userProfile is not loaded yet, don't do anything (prevent flash)
    if (!userProfile) {
      console.log('⏳ [SIGNUP_FLOW] Waiting for userProfile to load...');
      return;
    }

    console.log('🚦 [SIGNUP_FLOW] Checking account status:', {
      status: userProfile.accountStatus,
      role: userProfile.role,
      email: userProfile.email,
      pathname,
    });

    // Allow access to certain pages regardless of status
    const allowedPaths = [
      '/login',
      '/support',
      '/about',
      '/blogs',
      '/doctors', // Allow browsing doctors
    ];

    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    // Check if user is admin by email (fallback check)
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdminByEmail = adminEmails.includes(userProfile.email);

    // Admin users bypass all checks
    if (userProfile.role === 'admin' || isAdminByEmail) {
      console.log('✅ [SIGNUP_FLOW] Admin user detected, allowing access', {
        role: userProfile.role,
        isAdminByEmail,
        accountStatus: userProfile.accountStatus,
        email: userProfile.email
      });

      // If admin user is on signup pages, redirect away
      const signupPages = ['/signup/role-selection', '/signup/'];
      if (signupPages.some(page => pathname.startsWith(page))) {
        console.log('🔄 [SIGNUP_FLOW] Admin user on signup page, redirecting to profile');
        router.push('/profile');
        return;
      }

      return;
    }

    // Handle different account statuses
    switch (userProfile.accountStatus) {
      case 'pending_gdpr':
        console.log('📋 [SIGNUP_FLOW] GDPR consent required');
        setShowGDPR(true);
        break;

      case 'pending_role':
        if (pathname !== '/signup/role-selection') {
          console.log('🎭 [SIGNUP_FLOW] Role selection required, redirecting...');
          router.push('/signup/role-selection');
        }
        break;

      case 'pending_personal_data':
        // Professional roles now fill their data directly on the profile page
        if (pathname !== '/profile') {
          console.log('📝 [SIGNUP_FLOW] Profile information required, redirecting to profile...');
          router.push('/profile');
        }
        break;

      case 'active':
        console.log('✅ [SIGNUP_FLOW] Account active', {
          role: userProfile.role,
          hasRole: !!userProfile.role
        });

        // If user has a role and account is active, never show role selection
        const signupPages = ['/signup/role-selection', '/signup/'];
        const isOnSignupPage = signupPages.some(page => pathname.startsWith(page) || pathname === page);

        if (isOnSignupPage) {
          console.log('🔄 [SIGNUP_FLOW] Account active with role, redirecting away from signup pages');
          router.push('/profile');
          return; // Early return to prevent any flash
        }
        break;

      case 'suspended':
        console.log('🚫 [SIGNUP_FLOW] Account suspended');
        if (pathname !== '/account-suspended' && !isAllowedPath) {
          router.push('/account-suspended');
        }
        break;

      case undefined:
      case null:
        // Legacy users without accountStatus - treat as active
        console.log('🔧 [SIGNUP_FLOW] Legacy user without accountStatus, treating as active');
        // If on signup pages, redirect away
        const legacySignupPages = [
          '/signup/',
        ];
        const isOnLegacySignupPage = legacySignupPages.some(page => pathname.startsWith(page) || pathname === page);
        
        if (isOnLegacySignupPage) {
          router.push('/profile');
        }
        break;

      default:
        console.warn('⚠️ [SIGNUP_FLOW] Unknown account status:', userProfile.accountStatus);
        // Treat unknown status as active for safety
        const unknownSignupPages = [
          '/signup/',
        ];
        const isOnUnknownSignupPage = unknownSignupPages.some(page => pathname.startsWith(page) || pathname === page);
        
        if (isOnUnknownSignupPage) {
          router.push('/profile');
        }
    }
  }, [user, userProfile, loading, pathname, router]);

  const handleGDPRAccept = async () => {
    try {
      await acceptGDPR();
      setShowGDPR(false);
      console.log('✅ [SIGNUP_FLOW] GDPR accepted, proceeding to role selection');
      router.push('/signup/role-selection');
    } catch (error) {
      console.error('🚫 [SIGNUP_FLOW] Failed to accept GDPR:', error);
      alert('Failed to save your consent. Please try again.');
    }
  };

  const handleGDPRDecline = async () => {
    console.log('🚫 [SIGNUP_FLOW] GDPR declined, logging out');
    await logout();
    setShowGDPR(false);
    router.push('/');
  };

  return (
    <>
      {showGDPR && (
        <GDPRConsent
          onAccept={handleGDPRAccept}
          onDecline={handleGDPRDecline}
        />
      )}
      {children}
    </>
  );
}
