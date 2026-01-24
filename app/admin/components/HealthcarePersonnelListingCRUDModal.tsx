"use client";

import { useState, useEffect } from "react";
import slugify from "slugify";
import { MedicalSpecialization, MEDICAL_SPECIALIZATIONS, HealthcarePersonnelListing, PersonnelType } from "@/lib/types";
import { COUNTRIES } from "@/lib/constants";
import { convertToSnakeCase } from "@/lib/supabase";
import { Country, State } from "country-state-city";
import { supabase } from "@/lib/supabase";
import { logDatabaseRejection, logDatabaseSuccess, getErrorMessageForUI } from "@/lib/logging";
import { useAuth } from "@/lib/contexts/AuthContext";

interface HealthcarePersonnelListingCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDataRecord?: HealthcarePersonnelListing | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function HealthcarePersonnelListingCRUDModal({ 
  isOpen, 
  onClose, 
  openDataRecord,
  mode, 
  onSuccess 
}: HealthcarePersonnelListingCRUDModalProps) {
  let user;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (e) {
    // In test environments or outside AuthProvider, user will be undefined
    user = undefined;
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openData, setOpenData] = useState<Partial<HealthcarePersonnelListing>>({
    name: "",
    personnelType: "Doctor",
    specialization: "Plastic, Reconstructive and Aesthetic Surgery",
    country: "Turkey",
    rating: 0,
    reviewCount: 0,
    googlePlaceId: "",
    image: "",
    userId: ""
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [initialUserId, setInitialUserId] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && openDataRecord) {
        setOpenData({
          ...openDataRecord,
          rating: openDataRecord.rating || 0,
          reviewCount: openDataRecord.reviewCount || 0,
          googlePlaceId: openDataRecord.googlePlaceId || "",
          image: openDataRecord.image || "",
          specialization: openDataRecord.specialization || "Plastic, Reconstructive and Aesthetic Surgery"
        });
        setInitialUserId(openDataRecord.userId || "");
      } else {
        setOpenData({
          name: "",
          personnelType: "Doctor",
          specialization: "Plastic, Reconstructive and Aesthetic Surgery",
          country: "Turkey",
          rating: 0,
          reviewCount: 0,
          googlePlaceId: "",
          image: "",
          userId: ""
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
      setError("Name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const slug = slugify(openData.name, { lower: true, strict: true, locale: 'tr' });
      const currentUserId = openData.userId;
      
      const payload = {
        ...openData,
        slug,
        updated_at: new Date().toISOString(),
        ...(!openData.id && mode === 'create' ? { created_at: new Date().toISOString() } : {})
      };

      // Remove undefined userId to prevent Supabase error
      if (payload.userId === undefined || payload.userId === '') {
        delete payload.userId;
      }

      // Remove ID from payload before saving to Supabase
      const { id, ...dataToSave } = payload;
      
      // Convert camelCase to snake_case for database
      const dataWithSnakeCase = convertToSnakeCase(dataToSave);

      let savedId = openData.id;

      // Add/Update personnel listing
      if (mode === 'edit' && openData.id) {
        const { error: updateError } = await supabase
          .from('healthcare_personnel_listings')
          .update(dataWithSnakeCase)
          .eq('id', openData.id);
        
        if (updateError) throw updateError;
        console.log('✅ [LISTING_CRUD] Personnel listing updated:', openData.id);
      } else {
        const { data, error: insertError } = await supabase
          .from('healthcare_personnel_listings')
          .insert([dataWithSnakeCase])
          .select();
        
        if (insertError) throw insertError;
        if (data && data.length > 0) {
          savedId = data[0].id;
          console.log('✅ [LISTING_CRUD] Personnel listing created:', savedId);
        }
      }

      // Handle Two-Way Link Sync (Repair & Sync)
      console.log("🔗 [LINK] Link sync check:", {
        currentUserId,
        savedId,
        shouldLink: !!(currentUserId && savedId)
      });
      
      if (currentUserId && savedId) {
        console.log("🔗 [LINK] Syncing user to listing:", currentUserId, "->", savedId);
        const { error: userLinkError } = await supabase
          .from('healthcare_personnel_listings')
          .update({ user_id: currentUserId })
          .eq('id', savedId);
        
        if (userLinkError) {
          console.error("🚫 [LINK] Could not link user:", userLinkError);
        } else {
          console.log("✅ [LINK] Synced user document:", currentUserId);
        }
      } else {
        console.log("ℹ️ [LINK] Skipping link - missing currentUserId or savedId");
      }

      if (initialUserId && initialUserId !== currentUserId && initialUserId) {
        console.log("🔗 [LINK] Unlinking old user:", initialUserId);
        // Check if this listing was linked to the old user
        const { data: oldLink } = await supabase
          .from('healthcare_personnel_listings')
          .select('id')
          .eq('user_id', initialUserId)
          .neq('id', savedId);
        
        if (oldLink && oldLink.length > 0) {
          const { error: unlinkError } = await supabase
            .from('healthcare_personnel_listings')
            .update({ user_id: null })
            .eq('user_id', initialUserId)
            .eq('id', oldLink[0].id);
          
          if (unlinkError) {
            console.error("⚠️ [LINK] Could not unlink old user:", unlinkError);
          } else {
            console.log("✅ [LINK] Unlinked old user:", initialUserId);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      logDatabaseRejection({
        operation: mode === 'edit' ? 'UPDATE' : 'INSERT',
        table: 'healthcare_personnel_listings',
        recordId: openData.id,
        userId: user?.id,
        userRole: user?.role,
        error: err,
        additionalContext: {
          personnelName: openData.name,
          mode,
        }
      });
      const errorMessage = getErrorMessageForUI(err, 'Failed to save listing');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!openData.id || !confirm("Are you sure you want to delete this public listing? This will not delete the user account.")) return;
    setLoading(true);
    try {
      // Delete personnel listing
      const { error: deleteError } = await supabase
        .from('healthcare_personnel_listings')
        .delete()
        .eq('id', openData.id);

      if (deleteError) throw deleteError;
      
      logDatabaseSuccess({
        operation: 'DELETE',
        table: 'healthcare_personnel_listings',
        recordId: openData.id,
        userId: user?.id,
        message: `Personnel "${openData.name}" deleted`
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      logDatabaseRejection({
        operation: 'DELETE',
        table: 'healthcare_personnel_listings',
        recordId: openData.id,
        userId: user?.id,
        userRole: user?.role,
        error: err,
        additionalContext: {
          personnelName: openData.name,
        }
      });
      const errorMessage = getErrorMessageForUI(err, 'Failed to delete listing');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? 'Add Public Personnel Listing' : `Edit Personnel Listing: ${openData.name}`}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/20 text-red-300 text-sm rounded border-2 border-red-500/50 font-semibold">
              ⚠️ Error: {error}
            </div>
          )}

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
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
              <select 
                value={openData.country || ""} 
                onChange={(e) => setOpenData({...openData, country: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Personnel Image URL</label>
              <input type="text" value={openData.image || ""} onChange={(e) => setOpenData({...openData, image: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" placeholder="https://..." />
            </div>
          </div>

          {/* User Link Field - At Bottom */}
          <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 mt-4">
            <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1 flex items-center gap-1">
              <span>👤</span> Link to Private User Account (UID)
            </label>
            <input 
              type="text" 
              placeholder="Paste User UID (e.g. abc123def456)"
              value={openData.userId || ""} 
              onChange={(e) => setOpenData({...openData, userId: e.target.value.trim() || undefined})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-blue-500 text-sm" 
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
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Public Listing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
