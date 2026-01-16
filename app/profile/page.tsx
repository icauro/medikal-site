"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: newName.trim(),
        updatedAt: new Date()
      });
      console.log('✅ [PROFILE] Display name updated');
      setIsEditingName(false);
      // Wait for AuthContext to sync or manually trigger if needed
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
      uid: userProfile.uid,
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
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-6 mb-6">
                  {userProfile.photoURL ? (
                    <Image
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-zinc-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-3xl font-bold border-2 border-zinc-800">
                      {userProfile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      {isEditingName ? (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-black border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 md:flex-none"
                            autoFocus
                          />
                          <button
                            onClick={handleUpdateName}
                            disabled={isSavingName}
                            className="p-1 px-3 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {isSavingName ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setNewName(userProfile.displayName);
                            }}
                            className="p-1 px-3 bg-zinc-800 rounded text-sm hover:bg-zinc-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <h2 className="text-2xl font-bold">{userProfile.displayName}</h2>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                            title="Edit public name"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <p className="text-zinc-400 text-sm">{userProfile.email}</p>
                      {userProfile.role && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getRoleColor(userProfile.role)} bg-zinc-800 border border-zinc-700`}>
                          {userProfile.role === 'admin' ? '👑 ' : userProfile.role === 'healthcare_personnel' ? '⚕️ ' : '👤 '}
                          {userProfile.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Member Since</label>
                    <p className="text-white text-sm font-medium">
                      {userProfile.createdAt?.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Last Active</label>
                    <p className="text-white text-sm font-medium">
                      {userProfile.updatedAt?.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) || '-'}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Email status</label>
                    <p className="text-green-500 text-sm font-medium">Verified</p>
                  </div>
                  <div className="hidden md:block">
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">User ID</label>
                    <p className="text-zinc-400 text-[10px] font-mono truncate">{userProfile.uid}</p>
                  </div>
                </div>
              </div>

              {/* Role-Specific Information */}
              {userProfile.personalHealthcarePersonnelData && (
                <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
                    ⚕️ Healthcare Personnel Info
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Type</label>
                      <p className="text-white text-sm">{userProfile.personalHealthcarePersonnelData.personnelType}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Specialization</label>
                      <p className="text-white text-sm">{userProfile.personalHealthcarePersonnelData.specialization}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">License</label>
                      <p className="text-white text-sm font-mono">{userProfile.personalHealthcarePersonnelData.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                      <p className={`text-sm ${userProfile.personalHealthcarePersonnelData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {userProfile.personalHealthcarePersonnelData.verified ? '✅ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                    {userProfile.personalHealthcarePersonnelData.yearsOfExperience && (
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Experience</label>
                        <p className="text-white text-sm">{userProfile.personalHealthcarePersonnelData.yearsOfExperience} years</p>
                      </div>
                    )}
                    {userProfile.personalHealthcarePersonnelData.currentMedicalFacility && (
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Current Facility</label>
                        <p className="text-white text-sm">{userProfile.personalHealthcarePersonnelData.currentMedicalFacility}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userProfile.patientInfo && (
                <div className="bg-cyan-900/10 border border-cyan-900/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-400">
                    👤 Patient Information
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Language</label>
                      <p className="text-white text-sm capitalize">{userProfile.patientInfo.preferredLanguage}</p>
                    </div>
                    {userProfile.patientInfo.emergencyContact && (
                      <>
                        <div>
                          <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Emergency Contact</label>
                          <p className="text-white text-sm">{userProfile.patientInfo.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Emergency Phone</label>
                          <p className="text-white text-sm">{userProfile.patientInfo.emergencyContact.phone}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {userProfile.personalMedicalFacilityData && (
                <div className="bg-green-900/10 border border-green-900/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-green-400">
                    🏥 Medical Facility info
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Name</label>
                      <p className="text-white text-sm">{userProfile.personalMedicalFacilityData.name}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Type</label>
                      <p className="text-white text-sm">{userProfile.personalMedicalFacilityData.facilityType}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                      <p className={`text-sm ${userProfile.personalMedicalFacilityData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {userProfile.personalMedicalFacilityData.verified ? '✅ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                    <div className="col-span-2">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Location</label>
                        <p className="text-white text-sm">{userProfile.personalMedicalFacilityData.city}, {userProfile.personalMedicalFacilityData.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfile.personalAgencyData && (
                <div className="bg-purple-900/10 border border-purple-900/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-400">
                    ✈️ Agency Information
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Agency Name</label>
                      <p className="text-white text-sm">{userProfile.personalAgencyData.name}</p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                      <p className={`text-sm ${userProfile.personalAgencyData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {userProfile.personalAgencyData.verified ? '✅ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Location</label>
                      <p className="text-white text-sm">{userProfile.personalAgencyData.city}, {userProfile.personalAgencyData.country}</p>
                    </div>
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
                        className="w-full px-2 py-1 bg-black border border-red-900/50 rounded text-xs text-white"
                        placeholder="Type DELETE"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1 bg-zinc-800 rounded text-[10px]">Cancel</button>
                        <button 
                          onClick={() => {
                            const input = document.getElementById('deleteConfirmText') as HTMLInputElement;
                            if (input?.value === 'DELETE') handleDeleteAccount();
                            else setDeleteError('Type DELETE');
                          }}
                          className="flex-1 py-1 bg-red-600 rounded text-[10px] font-bold"
                        >
                          DELETE
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
