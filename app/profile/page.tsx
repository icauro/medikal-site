"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { ImageCropModal } from '@/app/components/ImageCropModal';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { COUNTRIES } from '@/lib/constants';
import { State } from 'country-state-city';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { theme } from '@/lib/theme';

export default function ProfilePage() {
  const { user, userProfile, logout, deleteAccount, refreshUserProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userProfile?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [brokenPhotoUrl, setBrokenPhotoUrl] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const { upload, isLoading: isUploading, error: uploadError, success: uploadSuccess } = useImageUpload();

  // Medical Facility editing state
  const [isEditingFacility, setIsEditingFacility] = useState(
    userProfile?.role === 'medical_facility' && userProfile?.accountStatus === 'pending_personal_data'
  );
  const [isSavingFacility, setIsSavingFacility] = useState(false);
  const [facilityFormData, setFacilityFormData] = useState({
    name: userProfile?.medicalFacilityAccountData?.name || '',
    facilityType: userProfile?.medicalFacilityAccountData?.facilityType || '',
    contactPerson: userProfile?.medicalFacilityAccountData?.contactPerson || '',
    phone: userProfile?.medicalFacilityAccountData?.phone || '',
    email: userProfile?.medicalFacilityAccountData?.email || '',
    address: userProfile?.medicalFacilityAccountData?.address || '',
    website: userProfile?.medicalFacilityAccountData?.website || '',
    country: userProfile?.medicalFacilityAccountData?.country || '',
    province: userProfile?.medicalFacilityAccountData?.province || '',
  });

  // Get provinces for selected country
  const provinces = useMemo(() => {
    if (!facilityFormData.country) return [];
    const country = COUNTRIES.find(c => c.name === facilityFormData.country);
    if (!country) return [];
    return State.getStatesOfCountry(country.isoCode);
  }, [facilityFormData.country]);

  useEffect(() => {
    if (userProfile?.displayName) {
      setNewName(userProfile.displayName);
    }
    // Reset facility form data when user profile changes
    if (userProfile?.medicalFacilityAccountData) {
      setFacilityFormData({
        name: userProfile.medicalFacilityAccountData.name || '',
        facilityType: userProfile.medicalFacilityAccountData.facilityType || '',
        contactPerson: userProfile.medicalFacilityAccountData.contactPerson || '',
        phone: userProfile.medicalFacilityAccountData.phone || '',
        email: userProfile.medicalFacilityAccountData.email || '',
        address: userProfile.medicalFacilityAccountData.address || '',
        website: userProfile.medicalFacilityAccountData.website || '',
        country: userProfile.medicalFacilityAccountData.country || '',
        province: userProfile.medicalFacilityAccountData.province || '',
      });
      // Auto-enable edit mode for pending medical facility users
      if (userProfile.role === 'medical_facility' && userProfile.accountStatus === 'pending_personal_data') {
        setIsEditingFacility(true);
      }
    }
    // Reset broken photo state when user profile changes
    setBrokenPhotoUrl(false);
  }, [userProfile]);

  useEffect(() => {
    if (syncingStatus || !syncError) {
      return;
    }

    const timer = setTimeout(() => setSyncError(''), 7000);
    return () => clearTimeout(timer);
  }, [syncError, syncingStatus]);

  /**
   * Handle image load error - occurs when the R2 image URL is broken or deleted
   * Sets flag to display fallback emoji instead of broken image
   */
  const handleImageError = () => {
    console.log('🖼️ [PROFILE] Image failed to load from R2, falling back to placeholder');
    setBrokenPhotoUrl(true);
  };

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

  const handleUpdateMedicalFacility = async () => {
    if (!user) return;

    setIsSavingFacility(true);
    setSyncError('');
    try {
      // Validate required fields
      if (!facilityFormData.name.trim() || !facilityFormData.country || !facilityFormData.province) {
        setSyncError('Please fill in all required fields (Facility Name, Country, Province)');
        setIsSavingFacility(false);
        return;
      }

      // Update user profile with medical facility data
      const { error } = await supabase
        .from('users')
        .update({
          medical_facility_account_data: {
            name: facilityFormData.name.trim(),
            facilityType: facilityFormData.facilityType,
            contactPerson: facilityFormData.contactPerson.trim(),
            phone: facilityFormData.phone.trim(),
            email: facilityFormData.email.trim(),
            address: facilityFormData.address.trim(),
            website: facilityFormData.website.trim(),
            country: facilityFormData.country,
            province: facilityFormData.province,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      console.log('✅ [PROFILE] Medical facility data saved to database');
      setIsEditingFacility(false);
      await refreshUserProfile();
    } catch (error) {
      console.error('❌ [PROFILE] Failed to save facility data:', error);
      setSyncError('Failed to save facility information. Please try again.');
    } finally {
      setIsSavingFacility(false);
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

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview for crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;
      setSelectedImageSrc(imageSrc);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to File object
      const croppedFile = new File([croppedBlob], 'profile.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload the cropped image
      const result = await upload(croppedFile, 'profile');
      if (result.success) {
        console.log('✅ [PROFILE] Cropped image uploaded successfully:', result.url);
        setShowCropModal(false);
        setSelectedImageSrc(null);
        // Refresh user profile to show new image
        await refreshUserProfile();
      } else {
        console.error('❌ [PROFILE] Upload failed:', result.error);
        setSyncError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Image upload error:', error);
      setSyncError('Failed to upload image');
    }
  };

  return (
    <ProtectedRoute allowPendingPersonalData={true}>
      <div className={`min-h-screen ${theme.gradients.pageBgClasses} text-white p-8`}>
        <div className="max-w-4xl mx-auto">
          {/* Crop Modal */}
          <ImageCropModal
            isOpen={showCropModal}
            imageSrc={selectedImageSrc || ''}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowCropModal(false);
              setSelectedImageSrc(null);
            }}
            aspectRatio={1}
          />
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
              {/* PROFILE PICTURE SECTION */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-bold mb-6 text-white">Profile Picture</h2>
                <div className="flex items-center gap-6">
                  {/* Profile Image */}
                  <div className="relative w-24 h-24">
                    {userProfile.photoURL && !brokenPhotoUrl ? (
                      <Image
                        src={userProfile.photoURL}
                        alt="Profile Picture"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-lg object-cover border border-zinc-700"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="flex-1">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Photo
                          </>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        disabled={isUploading}
                        className="hidden"
                      />
                      <p className="text-xs text-zinc-400">JPG, PNG, WebP or GIF (Max 5MB)</p>
                      {uploadError && (
                        <p className="text-xs text-red-400">
                          <span className="inline-block mr-1">❌</span>
                          {uploadError}
                        </p>
                      )}
                      {uploadSuccess && (
                        <p className="text-xs text-green-400">
                          <span className="inline-block mr-1">✅</span>
                          Photo updated successfully!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCOUNT INFORMATION SECTION */}
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

              {userProfile.role === 'medical_facility' && (
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">Medical Facility Details</h2>
                      {userProfile.accountStatus === 'pending_personal_data' && (
                        <p className="text-sm text-yellow-400 mt-2">
                          ⏳ Please complete your facility information. This is required for verification.
                        </p>
                      )}
                    </div>
                    {!isEditingFacility && userProfile.accountStatus !== 'pending_personal_data' && (
                      <button
                        onClick={() => setIsEditingFacility(true)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {!isEditingFacility ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Name</label>
                        <p className="text-white">{userProfile.medicalFacilityAccountData?.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Type</label>
                        <p className="text-white capitalize">{userProfile.medicalFacilityAccountData?.facilityType || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Contact Person</label>
                        <p className="text-white">{userProfile.medicalFacilityAccountData?.contactPerson || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Phone</label>
                        <p className="text-white">{userProfile.medicalFacilityAccountData?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Email</label>
                        <p className="text-white">{userProfile.medicalFacilityAccountData?.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-400 text-sm font-medium mb-2 block">Address</label>
                        <p className="text-white">{userProfile.medicalFacilityAccountData?.address || 'Not provided'}</p>
                      </div>
                      {userProfile.medicalFacilityAccountData?.website && (
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Website</label>
                          <a href={userProfile.medicalFacilityAccountData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            {userProfile.medicalFacilityAccountData.website}
                          </a>
                        </div>
                      )}
                      {userProfile.medicalFacilityAccountData?.province && (
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Location</label>
                          <p className="text-white">{userProfile.medicalFacilityAccountData.province}, {userProfile.medicalFacilityAccountData.country}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Name</label>
                          <input
                            type="text"
                            value={facilityFormData.name}
                            onChange={(e) => setFacilityFormData({...facilityFormData, name: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Facility Type</label>
                          <input
                            type="text"
                            value={facilityFormData.facilityType}
                            onChange={(e) => setFacilityFormData({...facilityFormData, facilityType: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Contact Person</label>
                          <input
                            type="text"
                            value={facilityFormData.contactPerson}
                            onChange={(e) => setFacilityFormData({...facilityFormData, contactPerson: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Phone</label>
                          <input
                            type="tel"
                            value={facilityFormData.phone}
                            onChange={(e) => setFacilityFormData({...facilityFormData, phone: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Email</label>
                          <input
                            type="email"
                            value={facilityFormData.email}
                            onChange={(e) => setFacilityFormData({...facilityFormData, email: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Address</label>
                          <input
                            type="text"
                            value={facilityFormData.address}
                            onChange={(e) => setFacilityFormData({...facilityFormData, address: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Website</label>
                          <input
                            type="url"
                            value={facilityFormData.website}
                            onChange={(e) => setFacilityFormData({...facilityFormData, website: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Country <span className="text-red-400">*</span></label>
                          <select
                            value={facilityFormData.country}
                            onChange={(e) => {
                              setFacilityFormData({...facilityFormData, country: e.target.value, province: ''});
                            }}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a country...</option>
                            {COUNTRIES.map((country) => (
                              <option key={country.isoCode} value={country.name}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">Province/State <span className="text-red-400">*</span></label>
                          <select
                            value={facilityFormData.province}
                            onChange={(e) => setFacilityFormData({...facilityFormData, province: e.target.value})}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!facilityFormData.country}
                          >
                            <option value="">Select a province/state...</option>
                            {provinces.map((state) => (
                              <option key={state.isoCode} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {syncError && (
                        <p className="text-sm text-red-400">
                          <span className="inline-block mr-1">❌</span>
                          {syncError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateMedicalFacility}
                          disabled={isSavingFacility}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium transition-colors flex items-center gap-2"
                        >
                          {isSavingFacility ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingFacility(false);
                            if (userProfile?.medicalFacilityAccountData) {
                              setFacilityFormData({
                                name: userProfile.medicalFacilityAccountData.name || '',
                                facilityType: userProfile.medicalFacilityAccountData.facilityType || '',
                                contactPerson: userProfile.medicalFacilityAccountData.contactPerson || '',
                                phone: userProfile.medicalFacilityAccountData.phone || '',
                                email: userProfile.medicalFacilityAccountData.email || '',
                                address: userProfile.medicalFacilityAccountData.address || '',
                                website: userProfile.medicalFacilityAccountData.website || '',
                                country: userProfile.medicalFacilityAccountData.country || '',
                                province: userProfile.medicalFacilityAccountData.province || '',
                              });
                            }
                          }}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
