"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, query, collection, where, getDocs, limit } from "firebase/firestore";
import { UserProfile, UserRole, MedicalSpecialization, MEDICAL_SPECIALIZATIONS, PersonalHealthcarePersonnelData, OpenHealthcarePersonnelData, PersonnelType } from "@/lib/types";
import { Country, City } from "country-state-city";

const COUNTRIES = Country.getAllCountries();

interface HealthcarePersonnelUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: () => void;
}

export default function HealthcarePersonnelUserModal({ isOpen, onClose, user, onSuccess }: HealthcarePersonnelUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [role, setRole] = useState<UserRole>(user.role || 'healthcare_personnel');
  const [status, setStatus] = useState(user.accountStatus);
  const [personalData, setPersonalData] = useState<Partial<PersonalHealthcarePersonnelData>>(user.personalHealthcarePersonnelData || {});
  const [initialOpenDataId, setInitialOpenDataId] = useState<string>(user.personalHealthcarePersonnelData?.openHealthcarePersonnelDataId || "");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenHealthcarePersonnelData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'healthcare_personnel');
      setStatus(user.accountStatus);
      const data = user.personalHealthcarePersonnelData || ({} as PersonalHealthcarePersonnelData);
      setPersonalData(data);
      setInitialOpenDataId(data.openHealthcarePersonnelDataId || "");
    }
  }, [user]);

  useEffect(() => {
    if (personalData.country) {
      const country = COUNTRIES.find(c => c.name === personalData.country);
      if (country) {
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setCities(countryCities || []);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [personalData.country]);

  useEffect(() => {
    const searchOpenData = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const q = query(
          collection(db, "open_healthcare_personnel_data"),
          where("name", ">=", searchQuery),
          where("name", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as OpenHealthcarePersonnelData)));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchOpenData, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentOpenDataId = personalData.openHealthcarePersonnelDataId;

      // 1. Update User Document
      await updateDoc(doc(db, "users", user.uid), {
        role,
        accountStatus: status,
        personalHealthcarePersonnelData: personalData,
        updatedAt: new Date()
      });

      // 2. Handle Two-Way Link Sync (Repair & Sync)
      if (currentOpenDataId) {
        try {
          // Always ensure the linked listing points back to this user
          await updateDoc(doc(db, "open_healthcare_personnel_data", currentOpenDataId), {
            personalHealthcarePersonnelDataId: user.uid
          });
        } catch (e) { console.error("Could not sync link to open data:", e); }
      }

      // If we switched away from an old listing, unlink it
      if (initialOpenDataId && initialOpenDataId !== currentOpenDataId) {
        try {
          await updateDoc(doc(db, "open_healthcare_personnel_data", initialOpenDataId), {
            personalHealthcarePersonnelDataId: null
          });
        } catch (e) { console.error("Could not unlink old open data:", e); }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Healthcare Personnel User</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}
          
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">User UID</p>
              <code className="text-xs text-blue-400 font-mono">{user.uid}</code>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(user.uid)}
              className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 rounded transition-colors"
            >
              Copy UID
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Account Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                <option value="patient">Patient</option>
                <option value="healthcare_personnel">Healthcare Personnel</option>
                <option value="medical_facility">Medical Facility</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                <option value="active">Active</option>
                <option value="pending_personal_data">Pending Data</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase">Professional Profile</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <input 
                  type="checkbox" 
                  id="verified-personnel"
                  checked={personalData.verified || false} 
                  onChange={(e) => setPersonalData({...personalData, verified: e.target.checked})} 
                  className="h-3 w-3 accent-blue-500" 
                />
                <label htmlFor="verified-personnel" className="text-[10px] font-bold text-blue-400 uppercase cursor-pointer">Verified Profile</label>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Personal Information Section */}
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Personal Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                    <input type="text" value={personalData.name || ""} onChange={(e) => setPersonalData({...personalData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Phone Number</label>
                    <input type="text" value={personalData.phoneNumber || ""} onChange={(e) => setPersonalData({...personalData, phoneNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Date of Birth</label>
                    <input type="date" value={personalData.dateOfBirth || ""} onChange={(e) => setPersonalData({...personalData, dateOfBirth: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">National ID / Passport</label>
                    <input type="text" value={personalData.nationalIdNumber || ""} onChange={(e) => setPersonalData({...personalData, nationalIdNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
                    <select 
                      value={personalData.country || ""} 
                      onChange={(e) => setPersonalData({...personalData, country: e.target.value, city: ""})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
                    <select 
                      value={personalData.city || ""} 
                      onChange={(e) => setPersonalData({...personalData, city: e.target.value})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500"
                      disabled={!personalData.country}
                    >
                      <option value="">{personalData.country ? "Select City" : "Select Country First"}</option>
                          {cities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Credentials Section */}
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Professional Credentials</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Type</label>
                    <select value={personalData.personnelType || "Doctor"} onChange={(e) => setPersonalData({...personalData, personnelType: e.target.value as PersonnelType})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                      <option value="Doctor">Doctor</option>
                      <option value="Patient Coordinator">Patient Coordinator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Specialization</label>
                    <select value={personalData.specialization || ""} onChange={(e) => setPersonalData({...personalData, specialization: e.target.value as MedicalSpecialization})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                      {MEDICAL_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">License Number</label>
                    <input type="text" value={personalData.licenseNumber || ""} onChange={(e) => setPersonalData({...personalData, licenseNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Experience (Years)</label>
                    <input type="number" value={personalData.yearsOfExperience || 0} onChange={(e) => setPersonalData({...personalData, yearsOfExperience: parseInt(e.target.value) || 0})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Medical School</label>
                    <input type="text" value={personalData.medicalSchool || ""} onChange={(e) => setPersonalData({...personalData, medicalSchool: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Graduation Year</label>
                    <input type="number" value={personalData.graduationYear || ""} onChange={(e) => setPersonalData({...personalData, graduationYear: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Employment Section */}
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Employment & Position</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Current Facility</label>
                    <input type="text" value={personalData.currentMedicalFacility || ""} onChange={(e) => setPersonalData({...personalData, currentMedicalFacility: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Position</label>
                    <input type="text" value={personalData.position || ""} onChange={(e) => setPersonalData({...personalData, position: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Link to Public Listing</label>
                {personalData.openHealthcarePersonnelDataId ? (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded flex justify-between items-center">
                    <span className="text-white text-xs">Linked to ID: {personalData.openHealthcarePersonnelDataId}</span>
                    <button onClick={() => setPersonalData({...personalData, openHealthcarePersonnelDataId: ""})} className="text-[10px] text-zinc-500 hover:text-red-400 font-bold uppercase">Unlink</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" placeholder="Search public listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-xs outline-none focus:border-blue-500" />
                    {searchResults.length > 0 && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded divide-y divide-zinc-700 overflow-hidden">
                        {searchResults.map(result => (
                          <button key={result.id} onClick={() => { setPersonalData({...personalData, openHealthcarePersonnelDataId: result.id}); setSearchResults([]); setSearchQuery(""); }} className="w-full p-2 text-left hover:bg-zinc-700 flex justify-between items-center transition-colors">
                            <span className="text-white text-xs">{result.name}</span>
                            <span className="text-blue-500 text-[10px] font-bold uppercase">Link</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
          <button onClick={handleUpdate} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
