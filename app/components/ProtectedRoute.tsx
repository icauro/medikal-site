"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  console.log('🛡️ [PROTECTED] ProtectedRoute rendered', {
    requiredRole: requiredRole,
    fallbackPath: fallbackPath,
    loading: loading,
    hasUser: !!user,
    userRole: userProfile?.role,
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

      // Check if account is not active (should be handled by SignupFlowManager, but double-check)
      // Treat undefined/null accountStatus as active for legacy users
      const accountStatus = userProfile?.accountStatus;
      if (accountStatus && accountStatus !== 'active') {
        console.log('🚫 [PROTECTED] Account not active, status:', accountStatus);
        // SignupFlowManager will handle the redirect
        return;
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        console.log('🚫 [PROTECTED] Access denied: Insufficient role permissions', {
          requiredRole: requiredRole,
          userRole: userProfile?.role,
          uid: user.uid,
          redirectingTo: '/unauthorized'
        });
        router.push('/unauthorized');
        return;
      }

      console.log('✅ [PROTECTED] Access granted', {
        uid: user.uid,
        role: userProfile?.role,
        requiredRole: requiredRole
      });
    }
  }, [user, userProfile, loading, requiredRole, router, fallbackPath]);

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
  const hasValidStatus = !userProfile?.accountStatus || userProfile.accountStatus === 'active' || isAdmin;
  const hasRequiredRole = !requiredRole || userProfile?.role === requiredRole;

  if (!user || !hasValidStatus || !hasRequiredRole) {
    console.log('🚫 [PROTECTED] Rendering null (will redirect)', { hasValidStatus, hasRequiredRole, isAdmin });
    return null;
  }

  console.log('✅ [PROTECTED] Rendering protected content');
  return <>{children}</>;
};