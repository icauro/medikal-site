"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import GDPRConsent from './GDPRConsent';

/**
 * SignupFlowManager handles the multi-step signup process
 * - GDPR consent
 * - Role selection
 * - Doctor application (if doctor role)
 * - Pending approval (for doctors)
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

      case 'pending_application':
        if (pathname !== '/signup/doctor-application') {
          console.log('📝 [SIGNUP_FLOW] Doctor application required, redirecting...');
          router.push('/signup/doctor-application');
        }
        break;

      case 'pending_approval':
        if (pathname !== '/doctor/pending-approval' && !isAllowedPath) {
          console.log('⏳ [SIGNUP_FLOW] Approval pending, redirecting to waiting page...');
          router.push('/doctor/pending-approval');
        }
        break;

      case 'active':
        console.log('✅ [SIGNUP_FLOW] Account active');
        // If on signup pages but account is active, redirect to home/profile
        if (pathname.startsWith('/signup/') || pathname === '/doctor/pending-approval') {
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
        if (pathname.startsWith('/signup/') || pathname === '/doctor/pending-approval') {
          router.push('/profile');
        }
        break;

      default:
        console.warn('⚠️ [SIGNUP_FLOW] Unknown account status:', userProfile.accountStatus);
        // Treat unknown status as active for safety
        if (pathname.startsWith('/signup/') || pathname === '/doctor/pending-approval') {
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
