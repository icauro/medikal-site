"use client";

import { useState, useEffect, useMemo } from "react";
import slugify from "slugify";
import { MEDICAL_FACILITY_TYPES, MedicalFacilityListing, MedicalFacilityType, MedicalSpecialization } from "@/lib/types";
import { COUNTRIES } from "@/lib/constants";
import { convertToSnakeCase } from "@/lib/supabase";
import { Country, State } from "country-state-city";
import { supabase } from "@/lib/supabase";
import { logDatabaseRejection, logDatabaseSuccess, getErrorMessageForUI, parseSupabaseError } from "@/lib/logging";
import { useAuth } from "@/lib/contexts/AuthContext";

interface MedicalFacilityListingCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDataRecord?: MedicalFacilityListing | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function MedicalFacilityListingCRUDModal({ 
  isOpen, 
  onClose, 
  openDataRecord,
  mode, 
  onSuccess 
}: MedicalFacilityListingCRUDModalProps) {
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

  // Facility search and data
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [allFacilities, setAllFacilities] = useState<any[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(false);

  const [openData, setOpenData] = useState<Partial<MedicalFacilityListing>>({
    name: "",
    facilityType: "Hospital",
    country: "Turkey",
    province: "Istanbul",
    city: "",
    rating: 0,
    reviewCount: 0,
    googlePlaceId: "",
    googleReviewsEmbedUrl: "",
    userId: ""
  });
  const [initialUserId, setInitialUserId] = useState("");
  const [provinces, setProvinces] = useState<any[]>([]);

  // Load facility data from JSON
  useEffect(() => {
    const loadFacilityData = async () => {
      try {
        setFacilityLoading(true);
        // Load from the merged facilities JSON file
        const response = await fetch('/merged_medical_facilities.json');
        if (response.ok) {
          const facilities = await response.json();
          setAllFacilities(facilities);
        } else {
          console.warn('Could not load facility data from JSON file');
          setAllFacilities([]);
        }
      } catch (error) {
        console.error('Error loading facility data:', error);
        setAllFacilities([]);
      } finally {
        setFacilityLoading(false);
      }
    };

    loadFacilityData();
  }, []);

  // Fuzzy search for facilities
  const fuzzySearch = (query: string, text: string): boolean => {
    if (!query || !text) return false;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower.includes(queryLower)) return true;

    // Fuzzy match - check if all query words are in the text
    const queryWords = queryLower.split(/\s+/);
    return queryWords.every(word =>
      textLower.includes(word) ||
      // Allow for common prefixes to be ignored
      textLower.replace(/^(özel|devlet|t\.c\.|vakıf|üniversite|şehir|dr\.?|prof\.?|doç\.?|uzm\.?)\s+/gi, '').includes(word)
    );
  };

  // Filtered facilities based on search
  const filteredFacilities = useMemo(() => {
    if (!facilitySearchTerm.trim() || facilitySearchTerm.length < 2) return [];

    return allFacilities
      .filter(facility =>
        fuzzySearch(facilitySearchTerm, facility.name)
      )
      .slice(0, 20); // Limit to 20 results
  }, [facilitySearchTerm, allFacilities]);

  // Auto-fill facility data when selected
  const handleFacilitySelect = (facility: any) => {
    setOpenData({
      ...openData,
      name: facility.name,
      facilityType: facility.facilityType,
      city: facility.city,
      province: facility.province,
      country: facility.country
    });
    setFacilitySearchTerm(facility.name);
    setShowFacilityDropdown(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && openDataRecord) {
        setOpenData({
          ...openDataRecord,
          facilityType: openDataRecord.facilityType || "Hospital",
          city: openDataRecord.city || "",
          rating: openDataRecord.rating || 0,
          reviewCount: openDataRecord.reviewCount || 0,
          googlePlaceId: openDataRecord.googlePlaceId || "",
          googleReviewsEmbedUrl: openDataRecord.googleReviewsEmbedUrl || "",
          userId: openDataRecord.userId || ""
        });
        // Facility search term'ini de güncelle
        setFacilitySearchTerm(openDataRecord.name || "");
        setInitialUserId(openDataRecord.userId || "");
      } else {
        setOpenData({
          name: "",
          facilityType: "Hospital",
          country: "Turkey",
          province: "Istanbul",
          city: "",
          rating: 0,
          reviewCount: 0,
          googlePlaceId: "",
          googleReviewsEmbedUrl: "",
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
      setError("Facility Name is required.");
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

      const { id, ...dataToSave } = payload;
      
      // Convert camelCase to snake_case for database
      const dataWithSnakeCase = convertToSnakeCase(dataToSave);
      
      console.log('📝 [LISTING_CRUD] Payload being sent:', {
        original: dataToSave,
        snakeCase: dataWithSnakeCase,
        mode
      });
      
      let savedId = openData.id;

      // Add/Update facility listing
      if (mode === 'edit' && openData.id) {
        const { error: updateError } = await supabase
          .from('medical_facility_listings')
          .update(dataWithSnakeCase)
          .eq('id', openData.id);
        
        if (updateError) throw updateError;
        console.log('✅ [LISTING_CRUD] Facility listing updated:', openData.id);
      } else {
        const { data, error: insertError } = await supabase
          .from('medical_facility_listings')
          .insert([dataWithSnakeCase])
          .select();
        
        if (insertError) throw insertError;
        if (data && data.length > 0) {
          savedId = data[0].id;
          console.log('✅ [LISTING_CRUD] Facility listing created:', savedId);
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
          .from('medical_facility_listings')
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

      // If we switched away from an old user, unlink them
      if (initialUserId && initialUserId !== currentUserId && initialUserId) {
        console.log("🔗 [LINK] Unlinking old user:", initialUserId);
        // Check if this listing was linked to the old user
        const { data: oldLink } = await supabase
          .from('medical_facility_listings')
          .select('id')
          .eq('user_id', initialUserId)
          .neq('id', savedId);
        
        if (oldLink && oldLink.length > 0) {
          const { error: unlinkError } = await supabase
            .from('medical_facility_listings')
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
      // Log the rejection with full context for debugging
      logDatabaseRejection({
        operation: mode === 'edit' ? 'UPDATE' : 'INSERT',
        table: 'medical_facility_listings',
        recordId: openData.id,
        userId: user?.id,
        userRole: user?.role,
        error: err,
        additionalContext: {
          facilityName: openData.name,
          mode,
        }
      });

      // Get user-friendly error message
      const errorMessage = getErrorMessageForUI(err, 'Failed to save listing');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!openData.id || !confirm("Are you sure you want to delete this public listing?")) return;
    setLoading(true);
    try {
      // Delete facility listing
      const { error: deleteError } = await supabase
        .from('medical_facility_listings')
        .delete()
        .eq('id', openData.id);

      if (deleteError) throw deleteError;

      // Log successful deletion
      logDatabaseSuccess({
        operation: 'DELETE',
        table: 'medical_facility_listings',
        recordId: openData.id,
        userId: user?.id,
        message: `Facility "${openData.name}" deleted`
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      // Log the rejection with full context
      logDatabaseRejection({
        operation: 'DELETE',
        table: 'medical_facility_listings',
        recordId: openData.id,
        userId: user?.id,
        userRole: user?.role,
        error: err,
        additionalContext: {
          facilityName: openData.name,
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
            {mode === 'create' ? 'Add Public Facility Listing' : `Edit Facility Listing: ${openData.name}`}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/20 text-red-300 text-sm rounded border-2 border-red-500/50 font-semibold">
              ⚠️ Error: {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Facility Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search existing facilities..."
                value={facilitySearchTerm}
                onChange={(e) => {
                  setFacilitySearchTerm(e.target.value);
                  setShowFacilityDropdown(true);
                  // Also update the name field
                  setOpenData({...openData, name: e.target.value});
                }}
                onFocus={() => setShowFacilityDropdown(true)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500"
              />
              {facilityLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                </div>
              )}
              {showFacilityDropdown && filteredFacilities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredFacilities.map((facility, index) => (
                    <button
                      key={`${facility.name}-${index}`}
                      type="button"
                      onClick={() => handleFacilitySelect(facility)}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
                    >
                      <div className="font-medium text-white">{facility.name}</div>
                      <div className="text-sm text-zinc-400">{facility.facilityType} • {facility.province}</div>
                    </button>
                  ))}
                </div>
              )}
              {showFacilityDropdown && facilitySearchTerm.length >= 2 && filteredFacilities.length === 0 && !facilityLoading && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg p-4 text-center">
                  <div className="text-zinc-400">No facilities found matching "{facilitySearchTerm}"</div>
                </div>
              )}
            </div>
            {facilitySearchTerm && !showFacilityDropdown && (
              <p className="text-xs text-zinc-500">Or type a custom facility name</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Facility Type</label>
            <select value={openData.facilityType || "Hospital"} onChange={(e) => setOpenData({...openData, facilityType: e.target.value as MedicalFacilityType})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
              {MEDICAL_FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500"
                disabled={!openData.country}
              >
                <option value="">{openData.country ? "Select Province" : "Select Country First"}</option>
                {provinces.map((province, idx) => <option key={`${province.name}-${idx}`} value={province.name}>{province.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
            <input type="text" value={openData.city || ""} onChange={(e) => setOpenData({...openData, city: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
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
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Review Rating</label>
              <input type="number" step="0.1" max="5" value={openData.rating || 0} onChange={(e) => setOpenData({...openData, rating: parseFloat(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Reviews</label>
              <input type="number" value={openData.reviewCount || 0} onChange={(e) => setOpenData({...openData, reviewCount: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none text-sm" />
            </div>
          </div>

          {/* User Link Field - At Bottom */}
          <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 mt-4">
            <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1 flex items-center gap-1">
              <span>👤</span> Link to Private User Account (UID)
            </label>
            <input 
              type="text" 
              placeholder="Paste User UID (e.g. abc123def456)"
              value={openData.userId || ""} 
              onChange={(e) => setOpenData({...openData, userId: e.target.value.trim() || undefined})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none focus:border-emerald-500 text-sm" 
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
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-bold transition-all disabled:opacity-50">
              {loading ? "Saving..." : "Save Public Facility"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
