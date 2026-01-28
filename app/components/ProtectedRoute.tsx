"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
  allowPendingPersonalData?: boolean;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = '/login',
  allowPendingPersonalData = false
}: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  console.log('🛡️ [PROTECTED] ProtectedRoute rendered', {
    requiredRole,
    fallbackPath,
    loading,
    allowPendingPersonalData,
    hasUser: !!user,
    userRole: userProfile?.role,
    accountStatus: userProfile?.accountStatus,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server'
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('🚫 [PROTECTED] Access denied: No authenticated user, redirecting', {
          to: fallbackPath,
          from: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        });
        router.push(fallbackPath);
        return;
      }

      // Admin users bypass all status checks
      if (userProfile?.role === 'admin') {
        console.log('👑 [PROTECTED] Admin user detected, bypassing status checks');
        return;
      }

      // Check if account is not active
      const accountStatus = userProfile?.accountStatus;

      // Special exception for profile page or when explicitly allowed
      if (accountStatus === 'pending_personal_data' && allowPendingPersonalData) {
        console.log('📝 [PROTECTED] Allowing access with pending_personal_data status');
        return;
      }

      if (accountStatus && accountStatus !== 'active' && accountStatus !== 'pending_personal_data') {
        console.log('🚫 [PROTECTED] Account not active, status:', accountStatus);
        return;
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        console.log('🚫 [PROTECTED] Access denied: Insufficient role permissions', {
          requiredRole: requiredRole,
          userRole: userProfile?.role,
          uid: user.id,
          redirectingTo: '/unauthorized'
        });
        router.push('/unauthorized');
        return;
      }

      console.log('✅ [PROTECTED] Access granted', {
        uid: user.id,
        role: userProfile?.role,
        requiredRole: requiredRole
      });
    }
  }, [user, userProfile, loading, requiredRole, router, fallbackPath, allowPendingPersonalData]);

  if (loading) {
    console.log('⏳ [PROTECTED] Showing loading spinner while checking authentication');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // Admin users always get access
  const isAdmin = userProfile?.role === 'admin';
  const isPendingAllowed = allowPendingPersonalData && userProfile?.accountStatus === 'pending_personal_data';
  const hasValidStatus = !userProfile?.accountStatus || userProfile.accountStatus === 'active' || isAdmin || isPendingAllowed;
  const hasRequiredRole = !requiredRole || userProfile?.role === requiredRole;

  if (!user || !hasValidStatus || !hasRequiredRole) {
    console.log('🚫 [PROTECTED] Rendering null (will redirect)', { hasValidStatus, hasRequiredRole, isAdmin, isPendingAllowed });
    return null;
  }

  console.log('✅ [PROTECTED] Rendering protected content');
  return <>{children}</>;
};
