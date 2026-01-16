"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  MEDICAL_SPECIALIZATIONS, 
  MEDICAL_FACILITY_TYPES, 
  MedicalSpecialization, 
  MedicalFacilityType, 
  PersonnelType,
  MedicalProcedureType,
  MEDICAL_PROCEDURES
} from '@/lib/types';
import { Country, City } from "country-state-city";

const COUNTRIES = Country.getAllCountries();

export default function ProfilePage() {
  const { user, userProfile, loading, logout, deleteAccount, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userProfile?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(userProfile?.accountStatus === 'pending_personal_data');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form Data States
  const [personnelData, setPersonnelData] = useState(userProfile?.personalHealthcarePersonnelData || {
    name: userProfile?.displayName || '',
    title: '',
    specialization: 'Plastic, Reconstructive and Aesthetic Surgery' as MedicalSpecialization,
    bio: '',
    experience: 0,
    procedureTags: [] as string[],
    medicalFacilityIds: [] as string[],
    links: [] as string[],
    verified: false,
    city: '',
    country: ''
  });

  const [facilityData, setFacilityData] = useState(userProfile?.personalMedicalFacilityData || {
    name: userProfile?.displayName || '',
    facilityType: 'Clinic' as MedicalFacilityType,
    address: '',
    city: '',
    country: '',
    phone: '',
    email: userProfile?.email || '',
    website: '',
    taxIdNumber: '',
    verified: false
  });

  const [agencyData, setAgencyData] = useState(userProfile?.personalAgencyData || {
    name: userProfile?.displayName || '',
    address: '',
    city: '', country: '',
    phone: '', email: userProfile?.email || '',
    website: '',
    taxIdNumber: '',
    verified: false
  });

  const [patientData, setPatientData] = useState(userProfile?.patientInfo || {
    preferredLanguage: 'English',
    emergencyContact: { name: '', phone: '' }
  });

  const [personnelCities, setPersonnelCities] = useState<any[]>([]);
  const [facilityCities, setFacilityCities] = useState<any[]>([]);
  const [agencyCities, setAgencyCities] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.personalHealthcarePersonnelData) {
        setPersonnelData({
          ...personnelData,
          ...userProfile.personalHealthcarePersonnelData,
          procedureTags: userProfile.personalHealthcarePersonnelData.procedureTags || [],
          name: userProfile.personalHealthcarePersonnelData.name || userProfile.displayName || ''
        });
      } else if (userProfile.role === 'healthcare_personnel') {
        setPersonnelData(prev => ({
          ...prev,
          name: prev.name || userProfile.displayName || '',
        }));
      }

      if (userProfile.personalMedicalFacilityData) {
        setFacilityData({
          ...facilityData,
          ...userProfile.personalMedicalFacilityData,
          name: userProfile.personalMedicalFacilityData.name || userProfile.displayName || '',
          email: userProfile.personalMedicalFacilityData.email || userProfile.email || ''
        });
      } else if (userProfile.role === 'medical_facility') {
        setFacilityData(prev => ({
          ...prev,
          name: prev.name || userProfile.displayName || '',
          email: prev.email || userProfile.email || '',
        }));
      }

      if (userProfile.personalAgencyData) {
        setAgencyData({
          ...agencyData,
          ...userProfile.personalAgencyData,
          name: userProfile.personalAgencyData.name || userProfile.displayName || '',
          email: userProfile.personalAgencyData.email || userProfile.email || ''
        });
      } else if (userProfile.role === 'agency') {
        setAgencyData(prev => ({
          ...prev,
          name: prev.name || userProfile.displayName || '',
          email: prev.email || userProfile.email || '',
        }));
      }

      if (userProfile.patientInfo) setPatientData(userProfile.patientInfo);
      
      if (userProfile.accountStatus === 'pending_personal_data') {
        setIsEditingProfile(true);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (personnelData.country) {
      const country = COUNTRIES.find(c => c.name === personnelData.country);
      if (country) {
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setPersonnelCities(countryCities || []);
      } else {
        setPersonnelCities([]);
      }
    } else {
      setPersonnelCities([]);
    }
  }, [personnelData.country]);

  useEffect(() => {
    if (facilityData.country) {
      const country = COUNTRIES.find(c => c.name === facilityData.country);
      if (country) {
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setFacilityCities(countryCities || []);
      } else {
        setFacilityCities([]);
      }
    } else {
      setFacilityCities([]);
    }
  }, [facilityData.country]);

  useEffect(() => {
    if (agencyData.country) {
      const country = COUNTRIES.find(c => c.name === agencyData.country);
      if (country) {
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setAgencyCities(countryCities || []);
      } else {
        setAgencyCities([]);
      }
    } else {
      setAgencyCities([]);
    }
  }, [agencyData.country]);

  useEffect(() => {
    if (userProfile?.displayName) {
      setNewName(userProfile.displayName);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isSavingName || isSavingProfile || !syncError) {
      return;
    }

    const timer = setTimeout(() => setSyncError(''), 7000);
    return () => clearTimeout(timer);
  }, [syncError, isSavingName, isSavingProfile]);

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

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    setIsSavingProfile(true);
    setSyncError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        updatedAt: new Date(),
        // Once edited and saved, user is active but pending verification
        accountStatus: 'active'
      };

      if (userProfile.role === 'healthcare_personnel') {
        updates.personalHealthcarePersonnelData = { ...personnelData, updatedAt: new Date() };
      } else if (userProfile.role === 'medical_facility') {
        updates.personalMedicalFacilityData = { ...facilityData, updatedAt: new Date() };
      } else if (userProfile.role === 'agency') {
        updates.personalAgencyData = { ...agencyData, updatedAt: new Date() };
      } else if (userProfile.role === 'patient') {
        updates.patientInfo = { ...patientData };
      }

      await updateDoc(userRef, updates);
      console.log('✅ [PROFILE] Profile data updated');
      setIsEditingProfile(false);
      await refreshUserProfile();
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update profile:', error);
      setSyncError('Failed to save profile changes');
    } finally {
      setIsSavingProfile(false);
    }
  };

  console.log('👤 [PROFILE] Profile page rendered', {
    hasProfile: !!userProfile,
    role: userProfile?.role,
    status: userProfile?.accountStatus,
    isEditing: isEditingProfile,
    hasPersonnelData: !!userProfile?.personalHealthcarePersonnelData
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
    } catch (error) {
      console.error('❌ [PROFILE] Account deletion failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      setDeleteError(errorMessage);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
          <p className="text-zinc-500 max-w-md">
            We couldn't load your profile data. Please try logging in again.
          </p>
          <div className="pt-4 flex gap-4 justify-center">
            <button
              onClick={() => refreshUserProfile()}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold transition-all"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowPendingPersonalData={true}>
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
              {/* Verification Notice */}
              {(userProfile.role && userProfile.role !== 'patient' && userProfile.role !== 'admin') && (
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-300">Verification Required</h3>
                    <p className="text-xs text-blue-400/80 leading-relaxed">
                      Your professional profile will be publicly visible and fully approved after our team verifies your credentials. 
                      You can still update your information below in the meantime.
                    </p>
                  </div>
                </div>
              )}

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
              {(userProfile.role === 'healthcare_personnel' || userProfile.personalHealthcarePersonnelData) && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                      ⚕️ Healthcare Personnel Info
                    </h3>
                    <button 
                      onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                      className={`px-4 py-1.5 rounded text-xs px-6 font-bold transition-all ${
                        isEditingProfile 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isSavingProfile ? 'Saving...' : (isEditingProfile ? 'Save Changes' : 'Edit Profile')}
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                      <div className="col-span-full mb-2">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Listing Name</label>
                        <p className="text-white text-lg font-bold">{personnelData.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Specialization</label>
                        <p className="text-white text-sm">{personnelData.specialization || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Experience</label>
                        <p className="text-white text-sm">{(personnelData as any).experience || 0} years</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                        <p className={`text-sm ${personnelData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                          {personnelData.verified ? '✅ Verified' : '⏳ Pending'}
                        </p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Location</label>
                        <p className="text-white text-sm">{(personnelData.city && personnelData.country) ? `${personnelData.city}, ${personnelData.country}` : 'N/A'}</p>
                      </div>
                      <div className="col-span-full">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Bio</label>
                        <p className="text-zinc-300 text-sm italic">{personnelData.bio || 'No bio provided'}</p>
                      </div>
                      <div className="col-span-full">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1">Treatments</label>
                        <div className="flex flex-wrap gap-1">
                          {(personnelData as any).procedureTags?.length > 0 ? (
                            (personnelData as any).procedureTags.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-900/40 text-blue-300 text-[10px] rounded border border-blue-800/50">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 text-[10px]">No treatments listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Professional Title & Full Name</label>
                        <input 
                          type="text"
                          value={personnelData.name}
                          onChange={(e) => setPersonnelData({...personnelData, name: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                          placeholder="Dr. John Doe / Prof. Dr. Jane Dow"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Medical Specialization</label>
                        <select 
                          value={personnelData.specialization}
                          onChange={(e) => setPersonnelData({...personnelData, specialization: e.target.value as MedicalSpecialization})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                        >
                          {MEDICAL_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Years of Experience</label>
                        <input 
                          type="number"
                          value={(personnelData as any).experience}
                          onChange={(e) => setPersonnelData({...personnelData, experience: parseInt(e.target.value) || 0})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Country</label>
                        <select 
                          value={personnelData.country || ''}
                          onChange={(e) => setPersonnelData({...personnelData, country: e.target.value, city: ""})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none h-10"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => (
                            <option key={c.isoCode} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">City</label>
                        <select 
                          value={personnelData.city || ''}
                          onChange={(e) => setPersonnelData({...personnelData, city: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none h-10"
                          disabled={!personnelData.country}
                        >
                          <option value="">{personnelData.country ? "Select City" : "Select Country First"}</option>
                          {personnelCities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-full space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Professional Bio</label>
                        <textarea 
                          value={personnelData.bio || ''}
                          onChange={(e) => setPersonnelData({...personnelData, bio: e.target.value})}
                          rows={3}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-blue-500 outline-none resize-none"
                          placeholder="Tell patients about your expertise, education, and achievements..."
                        />
                      </div>
                      <div className="col-span-full space-y-2">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Treatments / Procedures Provided</label>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-black/50 border border-zinc-800 rounded">
                          {MEDICAL_PROCEDURES.map(proc => (
                            <button
                              key={proc}
                              type="button"
                              onClick={() => {
                                const currentTags = (personnelData as any).procedureTags || [];
                                const newTags = currentTags.includes(proc)
                                  ? currentTags.filter((t: string) => t !== proc)
                                  : [...currentTags, proc];
                                setPersonnelData({...personnelData, procedureTags: newTags});
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] border transition-all ${
                                ((personnelData as any).procedureTags || []).includes(proc)
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'
                              }`}
                            >
                              {proc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {userProfile.role === 'patient' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                      👤 Patient Information
                    </h3>
                    <button 
                      onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                      className={`px-4 py-1.5 rounded text-xs px-6 font-bold transition-all ${
                        isEditingProfile 
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isSavingProfile ? 'Saving...' : (isEditingProfile ? 'Save Changes' : 'Edit Profile')}
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Language</label>
                        <p className="text-white text-sm capitalize">{patientData.preferredLanguage || 'N/A'}</p>
                      </div>
                      {patientData.emergencyContact && (
                        <>
                          <div>
                            <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Emergency Contact</label>
                            <p className="text-white text-sm">{patientData.emergencyContact.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Emergency Phone</label>
                            <p className="text-white text-sm">{patientData.emergencyContact.phone || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Preferred Language</label>
                        <select 
                          value={patientData.preferredLanguage}
                          onChange={(e) => setPatientData({...patientData, preferredLanguage: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-cyan-500 outline-none"
                        >
                          <option value="English">English</option>
                          <option value="Turkish">Turkish</option>
                          <option value="German">German</option>
                          <option value="Arabic">Arabic</option>
                        </select>
                      </div>
                      <div className="space-y-4 md:col-span-2 border-t border-zinc-800 pt-4 mt-2">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Contact Name</label>
                            <input 
                              type="text"
                              value={patientData.emergencyContact?.name || ''}
                              onChange={(e) => setPatientData({
                                ...patientData, 
                                emergencyContact: { ...(patientData.emergencyContact || {name:'', phone:''}), name: e.target.value }
                              })}
                              className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-cyan-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Contact Phone</label>
                            <input 
                              type="tel"
                              value={patientData.emergencyContact?.phone || ''}
                              onChange={(e) => setPatientData({
                                ...patientData, 
                                emergencyContact: { ...(patientData.emergencyContact || {name:'', phone:''}), phone: e.target.value }
                              })}
                              className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-cyan-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(userProfile.role === 'medical_facility' || userProfile.personalMedicalFacilityData) && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                      🏥 Medical Facility Info
                    </h3>
                    <button 
                      onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                      className={`px-4 py-1.5 rounded text-xs px-6 font-bold transition-all ${
                        isEditingProfile 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isSavingProfile ? 'Saving...' : (isEditingProfile ? 'Save Changes' : 'Edit Profile')}
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Official Facility Name</label>
                        <p className="text-white text-sm font-semibold">{facilityData.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                        <p className={`text-sm ${facilityData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                          {facilityData.verified ? '✅ Verified' : '⏳ Pending'}
                        </p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Tax ID / License</label>
                        <p className="text-white text-sm font-mono">{facilityData.taxIdNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Location</label>
                        <p className="text-white text-sm">{(facilityData.city && facilityData.country) ? `${facilityData.city}, ${facilityData.country}` : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Website</label>
                        <p className="text-blue-400 text-sm truncate">{facilityData.website || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Official Facility Name</label>
                        <input 
                          type="text"
                          value={facilityData.name}
                          onChange={(e) => setFacilityData({...facilityData, name: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Facility Tax ID / License</label>
                        <input 
                          type="text"
                          value={facilityData.taxIdNumber || ''}
                          onChange={(e) => setFacilityData({...facilityData, taxIdNumber: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Website URL</label>
                        <input 
                          type="url"
                          value={facilityData.website || ''}
                          onChange={(e) => setFacilityData({...facilityData, website: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Country</label>
                        <select 
                          value={facilityData.country || ''}
                          onChange={(e) => setFacilityData({...facilityData, country: e.target.value, city: ""})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none h-10"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => (
                            <option key={c.isoCode} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">City</label>
                        <select 
                          value={facilityData.city || ''}
                          onChange={(e) => setFacilityData({...facilityData, city: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none h-10"
                          disabled={!facilityData.country}
                        >
                          <option value="">{facilityData.country ? "Select City" : "Select Country First"}</option>
                          {facilityCities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-full space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Address</label>
                        <textarea 
                          value={facilityData.address || ''}
                          onChange={(e) => setFacilityData({...facilityData, address: e.target.value})}
                          rows={2}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(userProfile.role === 'agency' || userProfile.personalAgencyData) && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-purple-400">
                      ✈️ Agency Information
                    </h3>
                    <button 
                      onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                      className={`px-4 py-1.5 rounded text-xs px-6 font-bold transition-all ${
                        isEditingProfile 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isSavingProfile ? 'Saving...' : (isEditingProfile ? 'Save Changes' : 'Edit Profile')}
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Agency Name</label>
                        <p className="text-white text-sm font-semibold">{agencyData.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Verification</label>
                        <p className={`text-sm ${agencyData.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                          {agencyData.verified ? '✅ Verified' : '⏳ Pending'}
                        </p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Tax ID</label>
                        <p className="text-white text-sm font-mono">{agencyData.taxIdNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider block">Location</label>
                        <p className="text-white text-sm">{(agencyData.city && agencyData.country) ? `${agencyData.city}, ${agencyData.country}` : 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Agency Name</label>
                        <input 
                          type="text"
                          value={agencyData.name}
                          onChange={(e) => setAgencyData({...agencyData, name: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Tax ID / Business License</label>
                        <input 
                          type="text"
                          value={agencyData.taxIdNumber || ''}
                          onChange={(e) => setAgencyData({...agencyData, taxIdNumber: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Website</label>
                        <input 
                          type="url"
                          value={agencyData.website || ''}
                          onChange={(e) => setAgencyData({...agencyData, website: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">Country</label>
                        <select 
                          value={agencyData.country || ''}
                          onChange={(e) => setAgencyData({...agencyData, country: e.target.value, city: ""})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-purple-500 outline-none h-10"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => (
                            <option key={c.isoCode} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] uppercase tracking-wider">City</label>
                        <select 
                          value={agencyData.city || ''}
                          onChange={(e) => setAgencyData({...agencyData, city: e.target.value})}
                          className="w-full bg-black border border-zinc-700 rounded p-2 text-sm focus:border-purple-500 outline-none h-10"
                          disabled={!agencyData.country}
                        >
                          <option value="">{agencyData.country ? "Select City" : "Select Country First"}</option>
                          {agencyCities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
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
                  {deleteError && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                      {deleteError}
                    </div>
                  )}
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
                        disabled={isDeleting}
                        className="w-full px-2 py-1 bg-black border border-red-900/50 rounded text-xs text-white disabled:opacity-50"
                        placeholder="Type DELETE"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            if (input.value === 'DELETE') handleDeleteAccount();
                            else setDeleteError('Type DELETE');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteError('');
                          }} 
                          disabled={isDeleting}
                          className="flex-1 py-1 bg-zinc-800 rounded text-[10px] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            const input = document.getElementById('deleteConfirmText') as HTMLInputElement;
                            if (input?.value === 'DELETE') handleDeleteAccount();
                            else setDeleteError('Type DELETE');
                          }}
                          disabled={isDeleting}
                          className="flex-1 py-1 bg-red-600 hover:bg-red-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? 'DELETING...' : 'DELETE'}
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

function getRoleColor(role: string) {
  switch (role) {
    case 'admin': return 'text-red-400';
    case 'healthcare_personnel': return 'text-blue-400';
    case 'medical_facility': return 'text-emerald-400';
    case 'agency': return 'text-purple-400';
    case 'patient': return 'text-cyan-400';
    default: return 'text-zinc-400';
  }
}
