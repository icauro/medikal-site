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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, userProfile, loading, requiredRole, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || (requiredRole && userProfile?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};