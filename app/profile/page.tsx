"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';

export default function ProfilePage() {
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userProfile?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (userProfile?.displayName) {
      setNewName(userProfile.displayName);
    }
  }, [userProfile]);

  useEffect(() => {
    if (syncingStatus || !syncError) {
      return;
    }

    const timer = setTimeout(() => setSyncError(''), 7000);
    return () => clearTimeout(timer);
  }, [syncError, syncingStatus]);

  const handleUpdateName = async () => {
    if (!user || !newName.trim() || newName === userProfile?.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      // Update user displayName in Supabase
      const { error } = await supabase
        .from('users')
        .update({ display_name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) throw error;
      console.log('✅ [PROFILE] Display name updated');
      setIsEditingName(false);
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update name:', error);
      setSyncError('Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  console.log('👤 [PROFILE] Profile page rendered', {
    hasProfile: !!userProfile,
    profileData: userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.displayName,
      role: userProfile.role,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt
    } : null,
    syncingStatus
  });

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'healthcare_personnel': return 'text-blue-400';
      case 'medical_facility': return 'text-green-400';
      case 'agency': return 'text-purple-400';
      case 'patient': return 'text-cyan-400';
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
      <div className={`min-h-screen ${theme.gradients.pageBgClasses} text-white p-8`}>
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
              {/* COMMON SECTION - Top */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-bold mb-6 text-white">Account Information</h2>
                
                {/* Display Name */}
                <div className="mb-6">
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">Display Name</label>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isSavingName}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
                      >
                        {isSavingName ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setNewName(userProfile.displayName);
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-white text-lg">{userProfile.displayName}</p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">Email</label>
                  <p className="text-white">{userProfile.email}</p>
                </div>

                {/* Role Badge */}
                <div>
                  <label className="text-zinc-400 text-sm font-medium mb-2 block">Role</label>
                  {userProfile.role && (
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize ${getRoleColor(userProfile.role)} bg-zinc-800 border border-zinc-700`}>
                      {userProfile.role === 'admin' ? '👑 ' : userProfile.role === 'healthcare_personnel' ? '⚕️ ' : userProfile.role === 'medical_facility' ? '🏥 ' : '👤 '}
                      {userProfile.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* ROLE-SPECIFIC SECTION - Bottom */}
              {userProfile.role === 'healthcare_personnel' && userProfile.healthcarePersonnelAccountData && (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-bold mb-6 text-white">Healthcare Personnel Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Personnel Type</label>
                      <p className="text-white capitalize">{userProfile.healthcarePersonnelAccountData.personnelType || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Specialization</label>
                      <p className="text-white">{userProfile.healthcarePersonnelAccountData.specialization || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">License Number</label>
                      <p className="text-white">{userProfile.healthcarePersonnelAccountData.licenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Years of Experience</label>
                      <p className="text-white">{userProfile.healthcarePersonnelAccountData.yearsOfExperience?.toString() || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Phone</label>
                      <p className="text-white">{userProfile.healthcarePersonnelAccountData.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Location</label>
                      <p className="text-white">{userProfile.healthcarePersonnelAccountData.province}, {userProfile.healthcarePersonnelAccountData.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfile.role === 'patient' && userProfile.patientAccountData && (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-bold mb-6 text-white">Patient Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Preferred Language</label>
                      <p className="text-white capitalize">{userProfile.patientAccountData.preferredLanguage || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Country</label>
                      <p className="text-white">{userProfile.patientAccountData.country || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Province/State</label>
                      <p className="text-white">{userProfile.patientAccountData.province || 'Not provided'}</p>
                    </div>
                    {userProfile.patientAccountData.emergencyContact && (
                      <>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Emergency Contact Name</label>
                          <p className="text-white">{userProfile.patientAccountData.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Emergency Phone</label>
                          <p className="text-white">{userProfile.patientAccountData.emergencyContact.phone}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {userProfile.role === 'medical_facility' && userProfile.medicalFacilityAccountData && (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-bold mb-6 text-white">Medical Facility Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Name</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Type</label>
                      <p className="text-white capitalize">{userProfile.medicalFacilityAccountData.facilityType || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Contact Person</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.contactPerson || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Phone</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Email</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Address</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.address || 'Not provided'}</p>
                    </div>
                    {userProfile.medicalFacilityAccountData.website && (
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Website</label>
                        <a href={userProfile.medicalFacilityAccountData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {userProfile.medicalFacilityAccountData.website}
                        </a>
                      </div>
                    )}
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Location</label>
                      <p className="text-white">{userProfile.medicalFacilityAccountData.province}, {userProfile.medicalFacilityAccountData.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfile.role === 'agency' && userProfile.agencyAccountData && (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-bold mb-6 text-white">Agency Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Agency Name</label>
                      <p className="text-white">{userProfile.agencyAccountData.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Contact Person</label>
                      <p className="text-white">{userProfile.agencyAccountData.contactPerson || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Phone</label>
                      <p className="text-white">{userProfile.agencyAccountData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Email</label>
                      <p className="text-white">{userProfile.agencyAccountData.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm font-medium mb-2 block">Location</label>
                      <p className="text-white">{userProfile.agencyAccountData.province}, {userProfile.agencyAccountData.country}</p>
                    </div>
                    {userProfile.agencyAccountData.website && (
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Website</label>
                        <a href={userProfile.agencyAccountData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {userProfile.agencyAccountData.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions & Danger Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center text-xs font-medium transition-colors">🏠 Home</Link>
                    <Link href="/support" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center text-xs font-medium transition-colors">💬 Support</Link>
                    {userProfile.role === 'admin' && (
                      <>
                        <Link href="/admin" className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded text-center text-xs font-medium transition-colors">👑 Admin</Link>
                        <Link href="/admin/verifications" className="px-3 py-2 bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 border border-orange-900/50 rounded text-center text-xs font-medium transition-colors">✅ Verify</Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-red-900/70 mb-2">Danger Zone</h3>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-red-500/70 hover:text-red-500 underline transition-colors"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-red-400 uppercase tracking-tight font-bold">Confirm Deletion</p>
                      <input
                        type="text"
                        id="deleteConfirmText"
                        className="w-full px-2 py-1 bg-black border border-red-900/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Type DELETE"
                        onChange={(e) => {
                          // Clear error when user starts typing
                          if (deleteError) setDeleteError('');
                        }}
                      />
                      {deleteError && (
                        <p className="text-[10px] text-red-400">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteError('');
                          }}
                          className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] transition-colors"
                          disabled={isDeleting}
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
                          className="flex-1 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 rounded text-[10px] font-bold transition-colors"
                        >
                          {isDeleting ? 'Deleting...' : 'DELETE'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
