"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function UserMenu() {
  const { user, userProfile, logout, loading } = useAuth();

  console.log('👤 [USERMENU] UserMenu rendered', {
    loading: loading,
    hasUser: !!user,
    hasProfile: !!userProfile,
    userRole: userProfile?.role
  });

  if (loading) {
    console.log('⏳ [USERMENU] Showing loading state');
    return (
      <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse"></div>
    );
  }

  if (!user || !userProfile) {
    console.log('🔗 [USERMENU] Showing login link (no authenticated user)');
    return (
      <Link
        href="/login"
        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
      >
        Login
      </Link>
    );
  }

  console.log('👤 [USERMENU] Showing authenticated user menu', {
    displayName: userProfile.displayName,
    role: userProfile.role,
    email: userProfile.email
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'doctor': return 'text-blue-400';
      case 'patient': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        {userProfile.photoURL ? (
          <Image
            src={userProfile.photoURL}
            alt={userProfile.displayName}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden md:block">
          <div className="text-white text-sm font-medium">
            {userProfile.displayName}
          </div>
          <div className={`text-xs capitalize ${getRoleColor(userProfile.role)}`}>
            {userProfile.role}
          </div>
        </div>
      </Link>
      <button
        onClick={async () => {
          console.log('🚪 [USERMENU] User initiated logout');

          try {
            await logout();
            console.log('✅ [USERMENU] Logout completed successfully');
          } catch (error) {
            console.error('❌ [USERMENU] Logout failed:', error);
          }
        }}
        className="text-zinc-400 hover:text-white transition-colors text-sm"
        title="Sign Out"
      >
        Sign Out
      </button>
    </div>
  );
}
