"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import Image from 'next/image';

export default function ProfilePage() {
  const { userProfile } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'doctor': return 'text-blue-400';
      case 'patient': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Profile</h1>

          {userProfile && (
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <div className="flex items-center gap-6 mb-8">
                {userProfile.photoURL ? (
                  <Image
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white text-3xl font-medium">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{userProfile.displayName}</h2>
                  <p className="text-zinc-400">{userProfile.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleColor(userProfile.role)} bg-zinc-800`}>
                    {userProfile.role}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Email</label>
                  <p className="text-white">{userProfile.email}</p>
                </div>

                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Display Name</label>
                  <p className="text-white">{userProfile.displayName}</p>
                </div>

                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Role</label>
                  <p className="text-white capitalize">{userProfile.role}</p>
                </div>

                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Member Since</label>
                  <p className="text-white">
                    {userProfile.createdAt?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Last Updated</label>
                  <p className="text-white">
                    {userProfile.updatedAt?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <a
                  href="/"
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors mr-4"
                >
                  Go Home
                </a>
                {userProfile.role === 'doctor' && (
                  <a
                    href="/doctor/dashboard"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Doctor Dashboard
                  </a>
                )}
                {userProfile.role === 'admin' && (
                  <a
                    href="/admin/dashboard"
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Admin Dashboard
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
