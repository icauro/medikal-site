"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { MedicalSpecialization, MEDICAL_SPECIALIZATIONS, OpenHealthcarePersonnelData, PersonnelType } from "@/lib/types";
import { Country, City } from "country-state-city";

const COUNTRIES = Country.getAllCountries();

interface OpenHealthcarePersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDataRecord?: OpenHealthcarePersonnelData | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function OpenHealthcarePersonnelModal({ 
  isOpen, 
  onClose, 
  openDataRecord,
  mode, 
  onSuccess 
}: OpenHealthcarePersonnelModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openData, setOpenData] = useState<Partial<OpenHealthcarePersonnelData>>({
    name: "",
    personnelType: "Doctor",
    specialization: "Plastic, Reconstructive and Aesthetic Surgery",
    bio: "",
    city: "Istanbul",
    country: "Turkey",
    rating: 0,
    reviewCount: 0,
    googlePlaceId: "",
    googleReviewsEmbedUrl: "",
    image: "",
    links: [],
    personalHealthcarePersonnelDataId: ""
  });
  const [cities, setCities] = useState<any[]>([]);
  const [initialUserId, setInitialUserId] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && openDataRecord) {
        setOpenData({
          ...openDataRecord,
          rating: openDataRecord.rating || 0,
          reviewCount: openDataRecord.reviewCount || 0,
          googlePlaceId: openDataRecord.googlePlaceId || "",
          googleReviewsEmbedUrl: openDataRecord.googleReviewsEmbedUrl || "",
          image: openDataRecord.image || "",
          links: openDataRecord.links || [],
          specialization: openDataRecord.specialization || "Plastic, Reconstructive and Aesthetic Surgery"
        });
        setInitialUserId(openDataRecord.personalHealthcarePersonnelDataId || "");
      } else {
        setOpenData({
          name: "",
          personnelType: "Doctor",
          specialization: "Plastic, Reconstructive and Aesthetic Surgery",
          bio: "",
          city: "Istanbul",
          country: "Turkey",
          rating: 0,
          reviewCount: 0,
          googlePlaceId: "",
          googleReviewsEmbedUrl: "",
          image: "",
          links: [],
          personalHealthcarePersonnelDataId: ""
        });
        setInitialUserId("");
      }
    }
  }, [isOpen, mode, openDataRecord]);

  useEffect(() => {
    if (openData.country) {
      const country = COUNTRIES.find(c => c.name === openData.country);
      if (country) {
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setCities(countryCities || []);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [openData.country]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!openData.name) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const slug = openData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const currentUserId = openData.personalHealthcarePersonnelDataId;
      
      const payload = {
        ...openData,
        slug,
        updatedAt: serverTimestamp(),
        ...(!openData.id && mode === 'create' ? { createdAt: serverTimestamp() } : {})
      };

      // Remove ID from payload before saving to Firestore
      const { id, ...dataToSave } = payload;

      let savedId = openData.id;

      if (mode === 'edit' && openData.id) {
        await updateDoc(doc(db, "open_healthcare_personnel_data", openData.id), dataToSave);
      } else {
        const docRef = await addDoc(collection(db, "open_healthcare_personnel_data"), dataToSave);
        savedId = docRef.id;
      }

      // 2. Handle Two-Way Link Sync (Repair & Sync)
      if (currentUserId && savedId) {
        try {
          // Always ensure the user doc knows about this listing
          await updateDoc(doc(db, "users", currentUserId), {
            "personalHealthcarePersonnelData.openHealthcarePersonnelDataId": savedId
          });
        } catch (e) { console.error("Could not link user:", e); }
      }

      // If we switched away from an old user, unlink them
      if (initialUserId && initialUserId !== currentUserId) {
        try {
          await updateDoc(doc(db, "users", initialUserId), {
            "personalHealthcarePersonnelData.openHealthcarePersonnelDataId": null
          });
        } catch (e) { console.error("Could not unlink old user:", e); }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!openData.id || !confirm("Are you sure you want to delete this public listing? This will not delete the user account.")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "open_healthcare_personnel_data", openData.id));
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
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? 'Add Public Personnel Listing' : `Edit Public Listing: ${openData.name}`}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Full Name</label>
              <input type="text" value={openData.name || ""} onChange={(e) => setOpenData({...openData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Personnel Type</label>
              <select value={openData.personnelType || "Doctor"} onChange={(e) => setOpenData({...openData, personnelType: e.target.value as PersonnelType})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                <option value="Doctor">Doctor</option>
                <option value="Patient Coordinator">Patient Coordinator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Specialization</label>
              <select value={openData.specialization || ""} onChange={(e) => setOpenData({...openData, specialization: e.target.value as MedicalSpecialization})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                {MEDICAL_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
              <select 
                value={openData.country || ""} 
                onChange={(e) => setOpenData({...openData, country: e.target.value, city: ""})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
              <select 
                value={openData.city || ""} 
                onChange={(e) => setOpenData({...openData, city: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500"
                disabled={!openData.country}
              >
                <option value="">{openData.country ? "Select City" : "Select Country First"}</option>
                {cities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Rating</label>
              <input type="number" step="0.1" min="0" max="5" value={openData.rating || 0} onChange={(e) => setOpenData({...openData, rating: parseFloat(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Review Count</label>
              <input type="number" value={openData.reviewCount || 0} onChange={(e) => setOpenData({...openData, reviewCount: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Google Place ID</label>
              <input type="text" value={openData.googlePlaceId || ""} onChange={(e) => setOpenData({...openData, googlePlaceId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" placeholder="ChIJ..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Reviews Embed URL</label>
              <input type="text" value={openData.googleReviewsEmbedUrl || ""} onChange={(e) => setOpenData({...openData, googleReviewsEmbedUrl: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Personnel Image URL</label>
              <input type="text" value={openData.image || ""} onChange={(e) => setOpenData({...openData, image: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Links (Comma Separated)</label>
              <input 
                type="text" 
                value={openData.links?.join(', ') || ""} 
                onChange={(e) => setOpenData({...openData, links: e.target.value.split(',').map(l => l.trim()).filter(l => l !== "")})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" 
                placeholder="website.com, linkedin.com..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Bio / Description (Public)</label>
            <textarea value={openData.bio || ""} onChange={(e) => setOpenData({...openData, bio: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none h-32 text-sm" placeholder="Professional biography..." />
          </div>

          <div className="p-4 bg-zinc-800/20 border border-zinc-800 rounded mt-4">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Link to Private User Account</label>
            <input 
              type="text" 
              placeholder="Paste User UID (e.g. from Users tab)" 
              value={openData.personalHealthcarePersonnelDataId || ""} 
              onChange={(e) => setOpenData({...openData, personalHealthcarePersonnelDataId: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-xs outline-none focus:border-blue-500" 
            />
            <p className="text-[10px] text-zinc-500 mt-2 italic">Linking syncs status & shared data between public and private views.</p>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-between gap-3">
          {mode === 'edit' ? (
            <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors uppercase font-bold">
              Delete Listing
            </button>
          ) : <div></div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Public Listing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
