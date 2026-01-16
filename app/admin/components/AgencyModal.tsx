"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { TURKISH_CITIES } from "@/lib/cities";

interface AgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  openDataRecord?: any | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function AgencyModal({ isOpen, onClose, user, openDataRecord, mode, onSuccess }: AgencyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'private' | 'open'>('private');

  // Private Data (Account + Personal)
  const [userUid, setUserUid] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [personalData, setPersonalData] = useState<any>({});
  
  // Open Data Listing
  const [openData, setOpenData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        if (user) {
          setUserEmail(user.email || ""); 
          setUserUid(user.uid); 
          setDisplayName(user.displayName || "");
          setPersonalData(user.personalAgencyData || {}); 
          setActiveTab('private');
        } else if (openDataRecord) {
          setOpenData(openDataRecord); 
          setActiveTab('open');
        }
      } else {
        setUserUid(""); setUserEmail(""); setDisplayName(""); setOpenData({}); setActiveTab('private');
      }
    }
  }, [isOpen, mode, user, openDataRecord]);

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    if (!userUid || !userEmail || (!openData.name && activeTab === 'open')) { setError("Required fields missing."); return; }
    setLoading(true);
    try {
      const openRef = await addDoc(collection(db, "open_agency_data"), { ...openData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await setDoc(doc(db, "users", userUid), {
        uid: userUid, email: userEmail, displayName, role: 'agency', accountStatus: 'active',
        personalAgencyData: { ...personalData, verified: true, openAgencyDataId: openRef.id },
        createdAt: new Date(), updatedAt: new Date(),
      });
      onSuccess();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleUpdate = async (field: 'private' | 'open') => {
    setLoading(true);
    try {
      if (field === 'private' && user) {
        await updateDoc(doc(db, "users", user.uid), { 
          displayName, 
          personalAgencyData: personalData,
          updatedAt: new Date() 
        });
      } else if (field === 'open') {
        const id = openData.id || openDataRecord?.id;
        if (id) await updateDoc(doc(db, "open_agency_data", id), { ...openData, updatedAt: serverTimestamp() });
        else await addDoc(collection(db, "open_agency_data"), { ...openData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      onSuccess();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="h-1.5 w-full bg-orange-500" />
        <div className="p-6 border-b border-zinc-800 flex justify-between">
          <h2 className="text-xl font-bold text-white">{mode === 'create' ? 'Add Agency' : 'Manage Agency'}</h2>
          <button onClick={onClose} className="text-zinc-500">✕</button>
        </div>
        <div className="flex border-b border-zinc-800">
          <button onClick={() => setActiveTab('private')} className={`px-6 py-3 text-xs font-bold uppercase ${activeTab === 'private' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-zinc-500'}`}>Private Profile</button>
          <button onClick={() => setActiveTab('open')} className={`px-6 py-3 text-xs font-bold uppercase ${activeTab === 'open' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-zinc-500'}`}>Public Listing</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-red-500/10 text-red-500 mb-4">{error}</div>}
          {activeTab === 'private' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="UID" value={userUid} onChange={e => setUserUid(e.target.value)} readOnly={mode === 'edit'} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" />
                <input placeholder="Email" value={userEmail} onChange={e => setUserEmail(e.target.value)} readOnly={mode === 'edit'} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" />
              </div>
              <input placeholder="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" />
              
              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Private Business Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Contact Person" value={personalData.contactPerson || ""} onChange={e => setPersonalData({...personalData, contactPerson: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" />
                  <input placeholder="Owner Name" value={personalData.ownerName || ""} onChange={e => setPersonalData({...personalData, ownerName: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" />
                </div>
              </div>
              
              <button onClick={mode === 'edit' ? () => handleUpdate('private') : handleCreateAccount} className="w-full p-3 bg-orange-600 font-bold uppercase text-xs text-white rounded transition-colors">
                {mode === 'edit' ? 'Save All Private Changes' : 'Initialize Account'}
              </button>
            </div>
          )}
          {activeTab === 'open' && (
            <div className="space-y-4">
              <input placeholder="Agency Name" value={openData.name || ""} onChange={e => setOpenData({...openData, name: e.target.value})} className="w-full bg-zinc-800 p-2 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
                  <select 
                    value={openData.country || ""} 
                    onChange={e => setOpenData({...openData, country: e.target.value})} 
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
                    <input placeholder="City" value={openData.city || ""} onChange={e => setOpenData({...openData, city: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                  )}
                </div>
              </div>
              <button onClick={() => handleUpdate('open')} className="w-full p-3 bg-orange-600 font-bold">Save Listing</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
