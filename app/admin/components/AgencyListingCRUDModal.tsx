"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Country, State } from "country-state-city";
import { COUNTRIES } from "@/lib/constants";
import { AgencyListing } from "@/lib/types";

interface AgencyListingCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDataRecord?: AgencyListing | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function AgencyListingCRUDModal({ 
  isOpen, 
  onClose, 
  openDataRecord,
  mode, 
  onSuccess 
}: AgencyListingCRUDModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialUserId, setInitialUserId] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<any[]>([]);

  const [openData, setOpenData] = useState<Partial<AgencyListing>>({
    name: "",
    address: "",
    province: "Istanbul",
    country: "Turkey",
    phone: "",
    email: "",
    website: "",
    rating: 0,
    reviewCount: 0,
    googlePlaceId: "",
    googleReviewsEmbedUrl: "",
    userId: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && openDataRecord) {
        setOpenData({
          ...openDataRecord,
          address: openDataRecord.address || "",
          phone: openDataRecord.phone || "",
          email: openDataRecord.email || "",
          website: openDataRecord.website || "",
          rating: openDataRecord.rating || 0,
          reviewCount: openDataRecord.reviewCount || 0,
          googlePlaceId: openDataRecord.googlePlaceId || "",
          googleReviewsEmbedUrl: openDataRecord.googleReviewsEmbedUrl || ""
        });
        setInitialUserId(openDataRecord.userId || null);
      } else {
        setOpenData({
          name: "",
          address: "",
          province: "Istanbul",
          country: "Turkey",
          phone: "",
          email: "",
          website: "",
          rating: 0,
          reviewCount: 0,
          googlePlaceId: "",
          googleReviewsEmbedUrl: "",
          userId: undefined
        });
        setInitialUserId("");
      }
    }
  }, [isOpen, mode, openDataRecord]);

  useEffect(() => {
    if (openData.country) {
      const country = COUNTRIES.find(c => c.name === openData.country);
      if (country) {
        const countryProvinces = State.getStatesOfCountry(country.isoCode);
        setProvinces(countryProvinces || []);
      } else {
        setProvinces([]);
      }
    } else {
      setProvinces([]);
    }
  }, [openData.country]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!openData.name) {
      setError("Agency Name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const slug = openData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const currentUserId = openData.userId;

      const payload = {
        ...openData,
        slug,
        updatedAt: serverTimestamp(),
        ...(!openData.id && mode === 'create' ? { createdAt: serverTimestamp() } : {})
      };

      // Remove undefined userId to prevent Firestore error
      if (payload.userId === undefined || payload.userId === '') {
        delete payload.userId;
      }

      const { id, ...dataToSave } = payload;
      let savedId = openData.id;

      if (mode === 'edit' && openData.id) {
        await updateDoc(doc(db, "agency_listings", openData.id), dataToSave);
      } else {
        const docRef = await addDoc(collection(db, "agency_listings"), dataToSave);
        savedId = docRef.id;
      }

      // 2. Handle Two-Way Link Sync (Repair & Sync)
      console.log("🔗 [LINK] Processing two-way link for listing:", savedId, "to user:", currentUserId);
      if (currentUserId && savedId) {
        try {
          // Always ensure the user doc knows about this listing
          await updateDoc(doc(db, "users", currentUserId), {
            "agencyAccountData.listingId": savedId
          });
          console.log("✅ [LINK] Synced user document:", currentUserId);
        } catch (e) { 
          console.error("🚫 [LINK] Could not link user:", e); 
        }
      }

      // If we switched away from an old user, unlink them
      if (initialUserId && initialUserId !== currentUserId) {
        try {
          await updateDoc(doc(db, "users", initialUserId), {
            "agencyAccountData.listingId": null
          });
          console.log("✅ [LINK] Unlinked old user:", initialUserId);
        } catch (e) { 
          console.error("⚠️ [LINK] Could not unlink old user:", e); 
        }
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
    if (!openData.id || !confirm("Are you sure you want to delete this public agency listing?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "agency_listings", openData.id));
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
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? 'Add Public Agency Listing' : `Edit Agency Listing: ${openData.name}`}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Agency Name</label>
            <input type="text" value={openData.name || ""} onChange={(e) => setOpenData({...openData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-orange-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
              <select 
                value={openData.country || ""} 
                onChange={(e) => setOpenData({...openData, country: e.target.value, province: ""})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Province/State</label>
              <select 
                value={openData.province || ""} 
                onChange={(e) => setOpenData({...openData, province: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-orange-500"
                disabled={!openData.country}
              >
                <option value="">{openData.country ? "Select Province/State" : "Select Country First"}</option>
                {provinces.map((province, idx) => <option key={`${province.name}-${idx}`} value={province.name}>{province.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-orange-500">Full Address</label>
            <input type="text" value={openData.address || ""} onChange={(e) => setOpenData({...openData, address: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-orange-500">Public Phone</label>
              <input type="text" value={openData.phone || ""} onChange={(e) => setOpenData({...openData, phone: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-orange-500">Public Email</label>
              <input type="email" value={openData.email || ""} onChange={(e) => setOpenData({...openData, email: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-orange-500">Website URL</label>
            <input type="text" value={openData.website || ""} onChange={(e) => setOpenData({...openData, website: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Google Place ID</label>
              <input type="text" value={openData.googlePlaceId || ""} onChange={(e) => setOpenData({...openData, googlePlaceId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" placeholder="ChIJ..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Reviews Embed URL</label>
              <input type="text" value={openData.googleReviewsEmbedUrl || ""} onChange={(e) => setOpenData({...openData, googleReviewsEmbedUrl: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Review Rating</label>
                <input type="number" step="0.1" max="5" value={openData.rating || 0} onChange={(e) => setOpenData({...openData, rating: parseFloat(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Reviews</label>
                <input type="number" value={openData.reviewCount || 0} onChange={(e) => setOpenData({...openData, reviewCount: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
              </div>
            </div>
          </div>

          {/* User Link Field - At Bottom */}
          <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 mt-4">
            <label className="block text-[10px] font-bold text-orange-500 uppercase mb-1 flex items-center gap-1">
              <span>👤</span> Link to Private User Account (UID)
            </label>
            <input 
              type="text" 
              placeholder="Paste User UID (e.g. abc123def456)"
              value={openData.userId || ""} 
              onChange={(e) => setOpenData({...openData, userId: e.target.value.trim() || undefined})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-orange-500 text-sm" 
            />
            <p className="mt-2 text-[10px] text-zinc-500">
              When linked, this listing will automatically appear in the user&apos;s private profile dashboard.
            </p>
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
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-bold transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Public Listing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
