"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, query, collection, where, getDocs, limit } from "firebase/firestore";
import { UserProfile, UserRole, MEDICAL_FACILITY_TYPES, PersonalMedicalFacilityData, OpenMedicalFacilityData, MedicalFacilityType } from "@/lib/types";
import { listCountries } from "countries-ts";

const COUNTRIES = listCountries();

interface MedicalFacilityUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: () => void;
}

export default function MedicalFacilityUserModal({ isOpen, onClose, user, onSuccess }: MedicalFacilityUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [role, setRole] = useState<UserRole>(user.role || 'medical_facility');
  const [status, setStatus] = useState(user.accountStatus);
  const [personalData, setPersonalData] = useState<Partial<PersonalMedicalFacilityData>>(user.personalMedicalFacilityData || {});
  const [initialOpenDataId, setInitialOpenDataId] = useState<string>(user.personalMedicalFacilityData?.openMedicalFacilityDataId || "");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenMedicalFacilityData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'medical_facility');
      setStatus(user.accountStatus);
      const data = user.personalMedicalFacilityData || ({} as PersonalMedicalFacilityData);
      setPersonalData(data);
      setInitialOpenDataId(data.openMedicalFacilityDataId || "");
    }
  }, [user]);

  useEffect(() => {
    const searchOpenData = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const q = query(
          collection(db, "open_medical_facility_data"),
          where("name", ">=", searchQuery),
          where("name", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as OpenMedicalFacilityData)));
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
      const currentOpenDataId = personalData.openMedicalFacilityDataId;

      // 1. Update User Document
      await updateDoc(doc(db, "users", user.uid), {
        role,
        accountStatus: status,
        personalMedicalFacilityData: personalData,
        updatedAt: new Date()
      });

      // 2. Handle Two-Way Link Sync (Repair & Sync)
      if (currentOpenDataId) {
        try {
          // Always ensure the linked listing points back to this user
          await updateDoc(doc(db, "open_medical_facility_data", currentOpenDataId), {
            personalMedicalFacilityDataId: user.uid
          });
        } catch (e) { console.error("Could not sync link to open facility:", e); }
      }

      // If we switched away from an old listing, unlink it
      if (initialOpenDataId && initialOpenDataId !== currentOpenDataId) {
        try {
          await updateDoc(doc(db, "open_medical_facility_data", initialOpenDataId), {
            personalMedicalFacilityDataId: null
          });
        } catch (e) { console.error("Could not unlink old open facility data:", e); }
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
          <h2 className="text-xl font-bold text-white">Edit Medical Facility User</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}
          
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">User UID</p>
              <code className="text-xs text-emerald-400 font-mono">{user.uid}</code>
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
              <h3 className="text-xs font-bold text-zinc-500 uppercase">Facility Business Information</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <input 
                  type="checkbox" 
                  id="verified-facility"
                  checked={personalData.verified || false} 
                  onChange={(e) => setPersonalData({...personalData, verified: e.target.checked})} 
                  className="h-3 w-3 accent-emerald-500" 
                />
                <label htmlFor="verified-facility" className="text-[10px] font-bold text-emerald-400 uppercase cursor-pointer">Verified Facility</label>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Facility Name</label>
                    <input type="text" value={personalData.name || ""} onChange={(e) => setPersonalData({...personalData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Facility Type</label>
                    <select value={personalData.facilityType || "Clinic"} onChange={(e) => setPersonalData({...personalData, facilityType: e.target.value as MedicalFacilityType})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                      {MEDICAL_FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Contact Person</label>
                    <input type="text" value={personalData.contactPerson || ""} onChange={(e) => setPersonalData({...personalData, contactPerson: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tax ID / License</label>
                    <input type="text" value={personalData.taxIdNumber || ""} onChange={(e) => setPersonalData({...personalData, taxIdNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Owner Name</label>
                    <input type="text" value={personalData.ownerName || ""} onChange={(e) => setPersonalData({...personalData, ownerName: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Registration No</label>
                    <input type="text" value={personalData.registrationNumber || ""} onChange={(e) => setPersonalData({...personalData, registrationNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Established Year</label>
                    <input type="number" value={personalData.establishedYear || ""} onChange={(e) => setPersonalData({...personalData, establishedYear: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Phone</label>
                    <input type="text" value={personalData.phone || ""} onChange={(e) => setPersonalData({...personalData, phone: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email</label>
                    <input type="email" value={personalData.email || ""} onChange={(e) => setPersonalData({...personalData, email: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Website</label>
                    <input type="text" value={personalData.website || ""} onChange={(e) => setPersonalData({...personalData, website: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
                    <select 
                      value={personalData.country || ""} 
                      onChange={(e) => setPersonalData({...personalData, country: e.target.value, city: ""})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.label}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
                    <input 
                      type="text"
                      value={personalData.city || ""}
                      onChange={(e) => setPersonalData({...personalData, city: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500"
                      placeholder={personalData.country ? "Enter City" : "Select Country First"}
                      disabled={!personalData.country}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Address</label>
                  <textarea value={personalData.address || ""} onChange={(e) => setPersonalData({...personalData, address: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500 h-20 text-sm" />
                </div>
              </div>

              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 space-y-4">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Link to Public Facility Listing</label>
                {personalData.openMedicalFacilityDataId ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded flex justify-between items-center">
                    <span className="text-white text-xs">Linked to ID: {personalData.openMedicalFacilityDataId}</span>
                    <button onClick={() => setPersonalData({...personalData, openMedicalFacilityDataId: ""})} className="text-[10px] text-zinc-500 hover:text-red-400 font-bold uppercase">Unlink</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" placeholder="Search public facilities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-xs outline-none focus:border-emerald-500" />
                    {searchResults.length > 0 && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded divide-y divide-zinc-700 overflow-hidden">
                        {searchResults.map(result => (
                          <button key={result.id} onClick={() => { setPersonalData({...personalData, openMedicalFacilityDataId: result.id}); setSearchResults([]); setSearchQuery(""); }} className="w-full p-2 text-left hover:bg-zinc-700 flex justify-between items-center transition-colors">
                            <span className="text-white text-xs">{result.name}</span>
                            <span className="text-emerald-500 text-[10px] font-bold uppercase">Link</span>
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
          <button onClick={handleUpdate} disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
