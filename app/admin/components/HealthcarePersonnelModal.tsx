"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, collection, addDoc, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { UserProfile, DoctorSpecialty, DOCTOR_SPECIALTIES, MedicalProcedureType } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { TURKISH_CITIES } from "@/lib/cities";

interface HealthcarePersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  openDataRecord?: any | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function HealthcarePersonnelModal({ 
  isOpen, 
  onClose, 
  user, 
  openDataRecord,
  mode, 
  onSuccess 
}: HealthcarePersonnelModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'private' | 'open'>('private');

  // Account & Personal Data (Private)
  const [userUid, setUserUid] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountStatus, setAccountStatus] = useState("active");
  const [personalData, setPersonalData] = useState<any>({});
  
  // Open Data (Public)
  const [openData, setOpenData] = useState<any>({});
  const [existingOpenDataId, setExistingOpenDataId] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        if (user) {
          setUserEmail(user.email || "");
          setUserUid(user.uid);
          setDisplayName(user.displayName || "");
          setAccountStatus(user.accountStatus || "active");
          setPersonalData(user.personalHealthcarePersonnelData || {});
          setExistingOpenDataId(user.personalHealthcarePersonnelData?.openHealthcarePersonnelDataId || "");
          setActiveTab('private');
        } else if (openDataRecord) {
          setOpenData(openDataRecord);
          setActiveTab('open');
        }
      } else {
        // Create Mode
        setUserEmail("");
        setUserUid("");
        setDisplayName("");
        setAccountStatus("active");
        setPersonalData({});
        setOpenData({ name: "", personnelType: "Doctor", specialty: "Plastic, Reconstructive and Aesthetic Surgery" });
        setExistingOpenDataId("");
        setActiveTab('private');
      }
    }
  }, [isOpen, mode, user, openDataRecord]);

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    if (!userUid || !userEmail || (!openData.name && activeTab === 'open')) {
      setError("UID, Email, and Name are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Create Open Data Listing first
      const slug = openData.name?.toLowerCase().replace(/\s+/g, '-') || "";
      const openRef = await addDoc(collection(db, "open_healthcare_personnel_data"), {
        name: openData.name || "",
        personnelType: openData.personnelType || 'Doctor',
        specialty: openData.specialty || "Plastic, Reconstructive and Aesthetic Surgery",
        personalHealthcarePersonnelDataId: userUid,
        slug,
        bio: openData.bio || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Create User Profile
      const userRef = doc(db, "users", userUid);
      await setDoc(userRef, {
        uid: userUid,
        email: userEmail,
        displayName: displayName || openData.name || userEmail,
        role: 'healthcare_personnel',
        accountStatus,
        personalHealthcarePersonnelData: {
          ...personalData,
          verified: true,
          openHealthcarePersonnelDataId: openRef.id
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivateData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        accountStatus,
        personalHealthcarePersonnelData: { ...personalData, openHealthcarePersonnelDataId: existingOpenDataId },
        updatedAt: new Date()
      });
      onSuccess();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSaveOpenData = async () => {
    setLoading(true);
    try {
      const payload = {
        ...openData,
        slug: openData.name?.toLowerCase().replace(/\s+/g, '-') || "",
        updatedAt: serverTimestamp(),
        ...(!openData.id ? { createdAt: serverTimestamp() } : {})
      };

      if (openData.id || openDataRecord?.id) {
        await updateDoc(doc(db, "open_healthcare_personnel_data", openData.id || openDataRecord.id), payload);
      } else {
        await addDoc(collection(db, "open_healthcare_personnel_data"), payload);
      }
      onSuccess();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="h-1.5 w-full bg-blue-500" />
        
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'create' ? 'Add Healthcare Personnel' : `Manage ${openData.name || displayName || 'Personnel'}`}
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">{userUid || user?.uid || 'Draft'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500">✕</button>
        </div>

        <div className="flex border-b border-zinc-800">
          <button onClick={() => setActiveTab('private')} className={`px-6 py-3 text-xs font-bold uppercase transition-all border-b-2 ${activeTab === 'private' ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-zinc-500'}`}>1. Private Profile</button>
          <button onClick={() => setActiveTab('open')} className={`px-6 py-3 text-xs font-bold uppercase transition-all border-b-2 ${activeTab === 'open' ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-zinc-500'}`}>2. Public Listing</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}

          {activeTab === 'private' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">UID</label>
                  <input type="text" value={userUid} onChange={(e) => setUserUid(e.target.value)} readOnly={mode === 'edit'} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email</label>
                  <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} readOnly={mode === 'edit'} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Account Status</label>
                  <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                    <option value="active">Active</option>
                    <option value="pending_personal_data">Pending Data</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-widest">Personal Data (Private)</h3>
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Personnel Type</label>
                  <select 
                    value={personalData.personnelType || "Doctor"} 
                    onChange={(e) => setPersonalData({...personalData, personnelType: e.target.value})} 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Patient Coordinator">Patient Coordinator</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Phone</label>
                    <input type="text" value={personalData.phoneNumber || ""} onChange={(e) => setPersonalData({...personalData, phoneNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">License No</label>
                    <input type="text" value={personalData.licenseNumber || ""} onChange={(e) => setPersonalData({...personalData, licenseNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                  </div>
                </div>
              </div>

              {mode === 'edit' ? (
                <button onClick={handleUpdatePrivateData} disabled={loading} className="w-full py-3 bg-blue-600 rounded font-bold uppercase text-xs text-white">Save All Private Changes</button>
              ) : (
                <button onClick={handleCreateAccount} disabled={loading} className="w-full py-3 bg-blue-600 rounded font-bold uppercase text-xs text-white">Initialize Account & Listing</button>
              )}
            </div>
          )}

          {activeTab === 'open' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-widest">Public Listing Details</h3>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Public Name</label>
                <input type="text" value={openData.name || ""} onChange={(e) => setOpenData({...openData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
              </div>
              <div className="pt-2 border-t border-zinc-800/50">
                <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-3">Classification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Type</label>
                    <select value={openData.personnelType || "Doctor"} onChange={(e) => setOpenData({...openData, personnelType: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                      <option value="Doctor">Doctor</option>
                      <option value="Patient Coordinator">Patient Coordinator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Specialty</label>
                    <select value={openData.specialty || ""} onChange={(e) => setOpenData({...openData, specialty: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                      {DOCTOR_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800/50">
                <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-3">Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
                    <select 
                      value={openData.country || ""} 
                      onChange={(e) => setOpenData({...openData, country: e.target.value})} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
                    {openData.country === 'Turkey' ? (
                      <select 
                        value={openData.city || ""} 
                        onChange={(e) => setOpenData({...openData, city: e.target.value})} 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
                      >
                        <option value="">Select City</option>
                        {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={openData.city || ""} onChange={(e) => setOpenData({...openData, city: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" placeholder="e.g. London" />
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800/50">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Bio</label>
                <textarea value={openData.bio || ""} onChange={(e) => setOpenData({...openData, bio: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none h-24" />
              </div>
              <button onClick={handleSaveOpenData} disabled={loading || !openData.name} className="w-full py-3 bg-blue-600 rounded font-bold uppercase text-xs text-white">
                {openData.id || openDataRecord?.id ? 'Update Listing' : 'Publish Listing'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
