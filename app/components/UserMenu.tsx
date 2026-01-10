"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export default function UserMenu() {
  const { user, userProfile, logout, loading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('👤 [USERMENU] UserMenu rendered', {
    loading: loading,
    hasUser: !!user,
    hasProfile: !!userProfile,
    userRole: userProfile?.role
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    console.log('🚪 [USERMENU] User initiated logout');
    setIsOpen(false);
    try {
      await logout();
      console.log('✅ [USERMENU] Logout completed successfully');
      router.push('/');
    } catch (error) {
      console.error('❌ [USERMENU] Logout failed:', error);
    }
  };

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
        className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors text-sm font-medium rounded-lg"
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

  const getRoleColor = (role: UserRole | null | undefined) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'doctor': return 'text-blue-400';
      case 'patient': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  const getRoleBadgeColor = (role: UserRole | null | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'doctor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'patient': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        {userProfile.photoURL ? (
          <Image
            src={userProfile.photoURL}
            alt={userProfile.displayName}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-zinc-700 hover:ring-zinc-600"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-sm font-medium ring-2 ring-zinc-700 hover:ring-zinc-600">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-white text-sm font-medium">
            {userProfile.displayName}
          </div>
          <div className={`text-xs capitalize ${getRoleColor(userProfile.role)}`}>
            {userProfile.role ?? 'pending role'}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50">
          {/* Current Account Section */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
            <div className="flex items-center gap-3 mb-2">
              {userProfile.photoURL ? (
                <Image
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-lg font-bold">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="text-white font-semibold">{userProfile.displayName}</div>
                <div className="text-zinc-400 text-sm">{userProfile.email}</div>
              </div>
            </div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize border ${getRoleBadgeColor(userProfile.role)}`}>
              {userProfile.role ?? 'pending role'}
            </span>
          </div>

          {/* Profile Link */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 hover:bg-zinc-800 transition-colors text-white border-b border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>View Profile</span>
            </div>
          </Link>

          {/* Logout Button */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 hover:bg-red-900/20 hover:text-red-400 transition-colors text-white rounded flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
