"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  console.log('👤 [PROFILE] Profile page rendered', {
    hasProfile: !!userProfile,
    profileData: userProfile ? {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      role: userProfile.role,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt
    } : null
  });

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'doctor': return 'text-blue-400';
      case 'patient': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  const handleLogout = async () => {
    console.log('🚪 [PROFILE] User initiated logout');
    try {
      await logout();
      console.log('✅ [PROFILE] Logout successful, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('❌ [PROFILE] Logout failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      console.log('🗑️ [PROFILE] User confirmed account deletion');
      await deleteAccount();
      console.log('✅ [PROFILE] Account deleted successfully, redirecting to home');
      router.push('/');
    } catch (error: any) {
      console.error('❌ [PROFILE] Account deletion failed:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Logout */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">My Profile</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          {userProfile && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-zinc-900 rounded-lg p-6 md:p-8 border border-zinc-800">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                  {userProfile.photoURL ? (
                    <Image
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-zinc-800"
                    />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-zinc-800">
                      {userProfile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{userProfile.displayName}</h2>
                    <p className="text-zinc-400 mb-3">{userProfile.email}</p>
                    {userProfile.role && (
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold capitalize ${getRoleColor(userProfile.role)} bg-zinc-800 border border-zinc-700`}>
                        {userProfile.role === 'admin' ? '👑 ' : userProfile.role === 'doctor' ? '👨‍⚕️ ' : '👤 '}
                        {userProfile.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Email Address</label>
                    <p className="text-white font-medium">{userProfile.email}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Display Name</label>
                    <p className="text-white font-medium">{userProfile.displayName}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Account Type</label>
                    <p className="text-white font-medium capitalize">{userProfile.role || 'Pending'}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">User ID</label>
                    <p className="text-white font-mono text-sm truncate">{userProfile.uid}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Member Since</label>
                    <p className="text-white font-medium">
                      {userProfile.createdAt?.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) || 'Unknown'}
                    </p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Last Active</label>
                    <p className="text-white font-medium">
                      {userProfile.updatedAt?.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role-Specific Information */}
              {userProfile.doctorInfo && (
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    👨‍⚕️ Doctor Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Specialization</label>
                      <p className="text-white">{userProfile.doctorInfo.specialization}</p>
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">License Number</label>
                      <p className="text-white font-mono">{userProfile.doctorInfo.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Verification Status</label>
                      <p className={userProfile.doctorInfo.verified ? 'text-green-400' : 'text-yellow-400'}>
                        {userProfile.doctorInfo.verified ? '✅ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                    {userProfile.doctorInfo.experience && (
                      <div>
                        <label className="text-blue-300 text-sm block mb-1">Years of Experience</label>
                        <p className="text-white">{userProfile.doctorInfo.experience} years</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userProfile.patientInfo && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    👤 Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-green-300 text-sm block mb-1">Preferred Language</label>
                      <p className="text-white capitalize">{userProfile.patientInfo.preferredLanguage}</p>
                    </div>
                    {userProfile.patientInfo.emergencyContact && (
                      <>
                        <div>
                          <label className="text-green-300 text-sm block mb-1">Emergency Contact</label>
                          <p className="text-white">{userProfile.patientInfo.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-green-300 text-sm block mb-1">Emergency Phone</label>
                          <p className="text-white">{userProfile.patientInfo.emergencyContact.phone}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {userProfile.adminInfo && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    👑 Admin Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-red-300 text-sm block mb-1">Permissions</label>
                      <p className="text-white">{userProfile.adminInfo.permissions.join(', ')}</p>
                    </div>
                    <div>
                      <label className="text-red-300 text-sm block mb-1">Last Admin Login</label>
                      <p className="text-white">
                        {userProfile.adminInfo.lastLogin?.toLocaleDateString() || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors font-medium"
                  >
                    🏠 Home
                  </Link>
                  <Link
                    href="/support"
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors font-medium"
                  >
                    💬 Support
                  </Link>
                  {userProfile.role === 'doctor' && (
                    <>
                      <Link
                        href="/doctor/verify"
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors font-medium"
                      >
                        ✅ Verify Account
                      </Link>
                    </>
                  )}
                  {userProfile.role === 'admin' && (
                    <>
                      <Link
                        href="/admin"
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                      >
                        👑 Admin Dashboard
                      </Link>
                      <Link
                        href="/admin/verifications"
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors font-medium"
                      >
                        ✅ Verifications
                      </Link>
                      <Link
                        href="/admin/support"
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
                      >
                        🎫 Manage Tickets
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Danger Zone - Delete Account */}
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2 text-red-400">⚠️ Danger Zone</h3>
                <p className="text-zinc-400 mb-4 text-sm">
                  {userProfile.role === 'doctor' || userProfile.role === 'admin'
                    ? 'Deleting your account will remove your personal data, but your doctor profile, clinic information, and reviews will remain on the site as they belong to the platform.'
                    : 'Once you delete your account, there is no going back. All your data will be permanently deleted.'}
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded-lg transition-colors font-medium border border-red-700"
                  >
                    🗑️ Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                      <p className="font-semibold text-red-300 mb-2">Are you absolutely sure?</p>
                      <p className="text-sm text-red-200 mb-3">
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </p>
                      {userProfile.role === 'doctor' && (
                        <p className="text-sm text-yellow-300 mb-3">
                          <strong>Note:</strong> Your doctor profile page, clinic listings, and patient reviews will remain visible on the site as they are part of the platform's public directory.
                        </p>
                      )}
                      <p className="text-sm text-zinc-300">
                        Type <strong className="text-white">DELETE</strong> below to confirm:
                      </p>
                      <input
                        type="text"
                        id="deleteConfirmText"
                        className="w-full mt-2 px-3 py-2 bg-zinc-900 border border-red-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Type DELETE"
                        disabled={isDeleting}
                      />
                    </div>

                    {deleteError && (
                      <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
                        {deleteError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError('');
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const input = document.getElementById('deleteConfirmText') as HTMLInputElement;
                          if (input?.value === 'DELETE') {
                            handleDeleteAccount();
                          } else {
                            setDeleteError('Please type DELETE to confirm');
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
