"use client";

/**
 * 👤 UserCRUDModal - Dynamic User Management Modal
 * 
 * Purpose: Handles CRUD operations for ALL user types across all roles.
 * This modal dynamically adapts its fields based on the user's role:
 * - patient: Basic patient info (preferred language, emergency contacts)
 * - healthcare_personnel: Personnel type, specialization, location, listing link
 * - medical_facility: Facility type, location, listing link
 * - agency: Location, listing link
 * - admin: Basic role/status changes
 * 
 * Note: This is for managing USER RECORDS in the `users` collection.
 * For managing PUBLIC LISTING records, use the corresponding ListingCRUDModal:
 * - HealthcarePersonnelListingCRUDModal
 * - MedicalFacilityListingCRUDModal
 * - AgencyListingCRUDModal
 */

import { useState, useEffect } from "react";
import { UserProfile, UserRole, MedicalSpecialization, MEDICAL_SPECIALIZATIONS, HealthcarePersonnelAccountData, MedicalFacilityAccountData, AgencyAccountData, PatientAccountData, HealthcarePersonnelListing, MedicalFacilityListing, AgencyListing, PersonnelType, MedicalFacilityType } from "@/lib/types";
import { Country, State } from "country-state-city";
import { COUNTRIES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

interface UserCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: () => void;
}

export default function UserCRUDModal({ isOpen, onClose, user, onSuccess }: UserCRUDModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [role, setRole] = useState<UserRole>(user.role || 'patient');
  const [status, setStatus] = useState(user.accountStatus);
  
  // Role-specific data states
  const [personnelData, setPersonnelData] = useState<Partial<HealthcarePersonnelAccountData>>({});
  const [facilityData, setFacilityData] = useState<Partial<MedicalFacilityAccountData>>({});
  const [agencyData, setAgencyData] = useState<Partial<AgencyAccountData>>({});
  const [patientData, setPatientData] = useState<Partial<PatientAccountData>>({});
  
  // Listing search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [initialListingId, setInitialListingId] = useState<string>("");
  
  // Location states
  const [provinces, setProvinces] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'patient');
      setStatus(user.accountStatus);
      
      // Initialize role-specific data
      if (user.role === 'healthcare_personnel') {
        const data = user.healthcarePersonnelAccountData || ({} as HealthcarePersonnelAccountData);
        setPersonnelData(data);
        setInitialListingId(data.listingId || "");
      } else if (user.role === 'medical_facility') {
        const data = user.medicalFacilityAccountData || ({} as MedicalFacilityAccountData);
        setFacilityData(data);
        setInitialListingId(data.listingId || "");
      } else if (user.role === 'agency') {
        const data = user.agencyAccountData || ({} as AgencyAccountData);
        setAgencyData(data);
        setInitialListingId(data.listingId || "");
      } else if (user.role === 'patient') {
        setPatientData(user.patientAccountData || {
          preferredLanguage: 'English',
          emergencyContact: { name: '', phone: '' },
          medicalHistory: []
        });
      }
    }
  }, [user]);

  // Update provinces when country changes
  useEffect(() => {
    let country = '';
    if (role === 'healthcare_personnel') country = personnelData.country || '';
    else if (role === 'medical_facility') country = facilityData.country || '';
    else if (role === 'agency') country = agencyData.country || '';

    if (country) {
      const countryObj = COUNTRIES.find(c => c.name === country);
      if (countryObj) {
        const countryProvinces = State.getStatesOfCountry(countryObj.isoCode);
        setProvinces(countryProvinces || []);
      } else {
        setProvinces([]);
      }
    } else {
      setProvinces([]);
    }
  }, [role, personnelData.country, facilityData.country, agencyData.country]);

  // Listing search
  useEffect(() => {
    const searchListings = async () => {
      if (searchQuery.length < 2 || role === 'patient' || role === 'admin') {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let table = 'healthcare_personnel_listings';
        if (role === 'medical_facility') table = 'medical_facility_listings';
        if (role === 'agency') table = 'agency_listings';

        const { data, error } = await supabase
          .from(table)
          .select('id, name, slug')
          .ilike('name', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        const results = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug
        }));

        setSearchResults(results);
      } catch (err) {
        console.error("🔍 Listing search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchListings, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, role]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const updates: any = {
        role,
        account_status: status,
        updated_at: new Date().toISOString()
      };

      // Add role-specific data
      if (role === 'healthcare_personnel') updates.healthcare_personnel_account_data = personnelData;
      else if (role === 'medical_facility') updates.medical_facility_account_data = facilityData;
      else if (role === 'agency') updates.agency_account_data = agencyData;
      else if (role === 'patient') updates.patient_account_data = patientData;

      // Update user document
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ [PROFILE] Failed to update user:', updateError);
        throw updateError;
      }

      console.log("✅ [USER_CRUD] User updated successfully:", user.id);
      
      // Handle Two-Way Link Sync (when user is linked to a listing)
      console.log("🔗 [LINK] Processing two-way link sync for user:", user.id);
      
      // All linking logic would go here but is kept for future implementation

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('🚫 [USER_CRUD] Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        fullError: JSON.stringify(err)
      });
      setError(err?.message || err?.details || 'Failed to update user');
      console.error('🚫 [USER_CRUD] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentData = role === 'healthcare_personnel' ? personnelData :
                      role === 'medical_facility' ? facilityData :
                      role === 'agency' ? agencyData : patientData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit User - {user.displayName}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-500/20 text-red-300 text-sm rounded border-2 border-red-500/50 font-semibold">
              ⚠️ Error: {error}
            </div>
          )}
          
          {/* User Info */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">User UID</p>
              <code className="text-xs text-white font-mono">{user.id}</code>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(user.id)}
              className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 rounded transition-colors"
            >
              Copy UID
            </button>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
            >
              <option value="patient">Patient</option>
              <option value="healthcare_personnel">Healthcare Personnel</option>
              <option value="medical_facility">Medical Facility</option>
              <option value="agency">Agency</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Account Status */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Account Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
            >
              <option value="pending_gdpr">Pending GDPR</option>
              <option value="pending_role">Pending Role</option>
              <option value="pending_personal_data">Pending Personal Data</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Healthcare Personnel Fields */}
          {role === 'healthcare_personnel' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Personnel Type</label>
                <select
                  value={personnelData.personnelType || 'doctor'}
                  onChange={(e) => setPersonnelData({ ...personnelData, personnelType: e.target.value as PersonnelType })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="specialist">Specialist</option>
                  <option value="therapist">Therapist</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Specialization</label>
                <select
                  value={personnelData.specialization || ''}
                  onChange={(e) => setPersonnelData({ ...personnelData, specialization: e.target.value as MedicalSpecialization })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                >
                  <option value="">Select Specialization</option>
                  {MEDICAL_SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Country</label>
                  <select
                    value={personnelData.country || ''}
                    onChange={(e) => setPersonnelData({ ...personnelData, country: e.target.value, province: '' })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Province/State</label>
                  <select
                    value={personnelData.province || ''}
                    onChange={(e) => setPersonnelData({ ...personnelData, province: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                    disabled={!provinces.length}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => (
                      <option key={p.isoCode} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Link to Listing</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                />
                {isSearching && <p className="text-xs text-zinc-500 mt-1">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-zinc-700 rounded bg-zinc-800 max-h-40 overflow-y-auto">
                    {searchResults.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => {
                          setPersonnelData({ ...personnelData, listingId: listing.id });
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-700 text-sm text-white border-b border-zinc-700 last:border-0"
                      >
                        {listing.name}
                      </button>
                    ))}
                  </div>
                )}
                {personnelData.listingId && (
                  <p className="text-xs text-green-500 mt-1">✓ Linked: {personnelData.listingId}</p>
                )}
              </div>
            </>
          )}

          {/* Medical Facility Fields */}
          {role === 'medical_facility' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Facility Type</label>
                <select
                  value={facilityData.facilityType || 'hospital'}
                  onChange={(e) => setFacilityData({ ...facilityData, facilityType: e.target.value as MedicalFacilityType })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="diagnostic_center">Diagnostic Center</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Country</label>
                  <select
                    value={facilityData.country || ''}
                    onChange={(e) => setFacilityData({ ...facilityData, country: e.target.value, province: '' })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Province/State</label>
                  <select
                    value={facilityData.province || ''}
                    onChange={(e) => setFacilityData({ ...facilityData, province: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                    disabled={!provinces.length}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => (
                      <option key={p.isoCode} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Link to Listing</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                />
                {isSearching && <p className="text-xs text-zinc-500 mt-1">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-zinc-700 rounded bg-zinc-800 max-h-40 overflow-y-auto">
                    {searchResults.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => {
                          setFacilityData({ ...facilityData, listingId: listing.id });
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-700 text-sm text-white border-b border-zinc-700 last:border-0"
                      >
                        {listing.name}
                      </button>
                    ))}
                  </div>
                )}
                {facilityData.listingId && (
                  <p className="text-xs text-green-500 mt-1">✓ Linked: {facilityData.listingId}</p>
                )}
              </div>
            </>
          )}

          {/* Agency Fields */}
          {role === 'agency' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Country</label>
                  <select
                    value={agencyData.country || ''}
                    onChange={(e) => setAgencyData({ ...agencyData, country: e.target.value, province: '' })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Province/State</label>
                  <select
                    value={agencyData.province || ''}
                    onChange={(e) => setAgencyData({ ...agencyData, province: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                    disabled={!provinces.length}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => (
                      <option key={p.isoCode} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Link to Listing</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                />
                {isSearching && <p className="text-xs text-zinc-500 mt-1">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-zinc-700 rounded bg-zinc-800 max-h-40 overflow-y-auto">
                    {searchResults.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => {
                          setAgencyData({ ...agencyData, listingId: listing.id });
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-700 text-sm text-white border-b border-zinc-700 last:border-0"
                      >
                        {listing.name}
                      </button>
                    ))}
                  </div>
                )}
                {agencyData.listingId && (
                  <p className="text-xs text-green-500 mt-1">✓ Linked: {agencyData.listingId}</p>
                )}
              </div>
            </>
          )}

          {/* Patient Fields */}
          {role === 'patient' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Preferred Language</label>
                <input
                  type="text"
                  value={patientData.preferredLanguage || 'English'}
                  onChange={(e) => setPatientData({ ...patientData, preferredLanguage: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={patientData.emergencyContact?.name || ''}
                    onChange={(e) => setPatientData({ 
                      ...patientData, 
                      emergencyContact: { ...patientData.emergencyContact, name: e.target.value } as any
                    })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={patientData.emergencyContact?.phone || ''}
                    onChange={(e) => setPatientData({ 
                      ...patientData, 
                      emergencyContact: { ...patientData.emergencyContact, phone: e.target.value } as any
                    })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-sm font-semibold transition-colors"
          >
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </div>
    </div>
  );
}
