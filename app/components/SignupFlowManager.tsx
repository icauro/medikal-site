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
 * - Pending approval (for professional roles)
 */
export default function SignupFlowManager({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, acceptGDPR, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showGDPR, setShowGDPR] = useState(false);

  useEffect(() => {
    if (loading || !user || !userProfile) return;

    console.log('🚦 [SIGNUP_FLOW] Checking account status:', {
      status: userProfile.accountStatus,
      role: userProfile.role,
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

    // Admin users bypass all checks
    if (userProfile.role === 'admin' && (userProfile.accountStatus === 'active' || !userProfile.accountStatus)) {
      console.log('✅ [SIGNUP_FLOW] Admin user, allowing access');
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
        // Redirect based on role
        if (userProfile.role === 'doctor' && pathname !== '/signup/doctor-application') {
          console.log('📝 [SIGNUP_FLOW] Doctor application required, redirecting...');
          router.push('/signup/doctor-application');
        } else if (userProfile.role === 'clinic' && pathname !== '/signup/clinic-application') {
          console.log('📝 [SIGNUP_FLOW] Clinic application required, redirecting...');
          router.push('/signup/clinic-application');
        } else if (userProfile.role === 'agency' && pathname !== '/signup/agency-application') {
          console.log('📝 [SIGNUP_FLOW] Agency application required, redirecting...');
          router.push('/signup/agency-application');
        }
        break;

      case 'pending_approval':
        // Redirect based on role to respective pending pages
        const pendingPages = [
          '/doctor/pending-approval',
          '/clinic/pending-approval',
          '/agency/pending-approval'
        ];
        const shouldRedirect = !pendingPages.some(page => pathname === page) && !isAllowedPath;

        if (shouldRedirect) {
          if (userProfile.role === 'doctor') {
            console.log('⏳ [SIGNUP_FLOW] Doctor approval pending, redirecting...');
            router.push('/doctor/pending-approval');
          } else if (userProfile.role === 'clinic') {
            console.log('⏳ [SIGNUP_FLOW] Clinic approval pending, redirecting...');
            router.push('/clinic/pending-approval');
          } else if (userProfile.role === 'agency') {
            console.log('⏳ [SIGNUP_FLOW] Agency approval pending, redirecting...');
            router.push('/agency/pending-approval');
          }
        }
        break;

      case 'active':
        console.log('✅ [SIGNUP_FLOW] Account active');
        // If on signup pages but account is active, redirect to home/profile
        const signupPendingPages = [
          '/signup/',
          '/doctor/pending-approval',
          '/clinic/pending-approval',
          '/agency/pending-approval'
        ];
        const isOnSignupPage = signupPendingPages.some(page => pathname.startsWith(page) || pathname === page);
        
        if (isOnSignupPage) {
          console.log('🔄 [SIGNUP_FLOW] Account active, redirecting away from signup pages');
          router.push('/profile');
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
          '/doctor/pending-approval',
          '/clinic/pending-approval',
          '/agency/pending-approval'
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
          '/doctor/pending-approval',
          '/clinic/pending-approval',
          '/agency/pending-approval'
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
