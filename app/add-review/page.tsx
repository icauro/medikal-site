"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { theme } from "@/lib/theme";

interface HealthcarePersonnel {
  id: string;
  name: string;
  specialization: string;
  slug: string;
}

interface MedicalFacility {
  id: string;
  name: string;
  facilityType: string;
  province: string;
  slug: string;
}

interface ReviewFormData {
  doctorId: string;
  medicalFacilityId: string;
  categories: string[];
  rating: number;
  experienceText: string;
}

const MEDICAL_CATEGORIES = [
  "Rhinoplasty",
  "Facelift",
  "Hair Transplant",
  "Botox",
  "Dermal Fillers",
  "Laser Hair Removal",
  "Chemical Peel",
  "Microdermabrasion",
  "Tattoo Removal",
  "Acne Treatment",
  "Wrinkle Treatment",
  "Lip Enhancement",
  "Breast Augmentation",
  "Liposuction",
  "Tummy Tuck",
];

export default function AddReviewPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<HealthcarePersonnel[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Medical facility search
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [facilityLoading, setFacilityLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ReviewFormData>({
    doctorId: "",
    medicalFacilityId: "",
    categories: [],
    rating: 0,
    experienceText: "",
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ReviewFormData, boolean>>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || !userProfile)) {
      router.push("/login");
      return;
    }
  }, [user, userProfile, authLoading, router]);

  // Fetch personnel for dropdown
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const { data, error } = await supabase
          .from('healthcare_personnel_listings')
          .select('*');

        if (error) throw error;

        const doctorsList = (data || []).map((doctor: any) => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          slug: doctor.slug
        }));

        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching healthcare personnel:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userProfile) {
      fetchPersonnel();
    }
  }, [user, userProfile]);

  // Filtered doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return doctors;
    const searchLower = doctorSearch.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchLower) ||
        doctor.specialization.toLowerCase().includes(searchLower)
    );
  }, [doctors, doctorSearch]);

  // Get selected doctor
  const selectedDoctor = doctors.find((doc) => doc.id === formData.doctorId);

  // Search medical facilities
  useEffect(() => {
    if (!facilitySearch.trim()) {
      setFacilities([]);
      return;
    }

    const searchFacilities = async () => {
      try {
        const { data, error } = await supabase
          .from('medical_facility_listings')
          .select('*')
          .ilike('name', `%${facilitySearch}%`)
          .limit(10);

        if (error) throw error;

        const facilitiesList = (data || []).map((facility: any) => ({
          id: facility.id,
          name: facility.name,
          facilityType: facility.facility_type,
          province: facility.province,
          slug: facility.slug
        }));

        setFacilities(facilitiesList);
      } catch (error) {
        console.error("Error searching facilities:", error);
        setFacilities([]);
      }
    };

    searchFacilities();
  }, [facilitySearch]);

  // Get selected facility
  const selectedFacility = facilities.find((fac) => fac.id === formData.medicalFacilityId);

  // Form validation
  const validateForm = () => {
    const newErrors: Partial<Record<keyof ReviewFormData, string>> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }

    if (!formData.medicalFacilityId) {
      newErrors.medicalFacilityId = "Please select a medical facility";
    }

    if (formData.categories.length === 0) {
      newErrors.categories = "Please select at least one category";
    }

    if (formData.rating === 0) {
      newErrors.rating = "Please provide a rating";
    }

    if (!formData.experienceText.trim()) {
      newErrors.experienceText = "Please describe your experience";
    } else if (formData.experienceText.trim().length < 20) {
      newErrors.experienceText = "Please write at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Mark all fields as touched to show validation errors
      setTouched({
        doctorId: true,
        medicalFacilityId: true,
        categories: true,
        rating: true,
        experienceText: true,
      });
      return;
    }

    if (!user || !userProfile || !selectedDoctor || !selectedFacility) return;

    setSubmitting(true);

    try {
      // Submit review to database
      const reviewData = {
        user_id: user.id,
        user_display_name: userProfile.displayName,
        facility_id: formData.medicalFacilityId,
        doctor_id: formData.doctorId,
        rating: formData.rating,
        comment: formData.experienceText,
        categories: formData.categories,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (insertError) throw insertError;

    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Sorry, there was an error submitting your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle field changes
  const handleFieldChange = (field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof ReviewFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter((c) => c !== category)
      : [...formData.categories, category];

    handleFieldChange("categories", newCategories);
  };

  // Handle star rating
  const handleStarClick = (rating: number) => {
    handleFieldChange("rating", rating);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={`min-h-screen ${theme.gradients.pageBgClasses} text-white p-4 md:p-8`}>
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Add Your Review</h1>
          <p className="text-zinc-400">
            Share your experience to help other patients make informed decisions
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white">
              Select Doctor <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a doctor..."
                value={doctorSearch}
                onChange={(e) => {
                  setDoctorSearch(e.target.value);
                  setShowDoctorDropdown(true);
                }}
                onFocus={() => setShowDoctorDropdown(true)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDoctorDropdown && filteredDoctors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => {
                        handleFieldChange("doctorId", doctor.id);
                        setDoctorSearch(`${doctor.name} - ${doctor.specialization}`);
                        setShowDoctorDropdown(false);
                        handleFieldBlur("doctorId");
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
                    >
                      <div className="font-medium text-white">{doctor.name}</div>
                      <div className="text-sm text-zinc-400">{doctor.specialization}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {touched.doctorId && errors.doctorId && (
              <p className="text-red-400 text-sm">{errors.doctorId}</p>
            )}
            {selectedDoctor && (
              <p className="text-green-400 text-sm">
                Selected: {selectedDoctor.name} - {selectedDoctor.specialization}
              </p>
            )}
          </div>

          {/* Medical Facility Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white">
              Select Medical Facility <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a medical facility..."
                value={facilitySearch}
                onChange={(e) => {
                  setFacilitySearch(e.target.value);
                  setShowFacilityDropdown(true);
                }}
                onFocus={() => setShowFacilityDropdown(true)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {facilityLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              {showFacilityDropdown && facilities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {facilities.map((facility) => (
                    <button
                      key={facility.id}
                      type="button"
                      onClick={() => {
                        handleFieldChange("medicalFacilityId", facility.id);
                        setFacilitySearch(`${facility.name} - ${facility.facilityType}`);
                        setShowFacilityDropdown(false);
                        handleFieldBlur("medicalFacilityId");
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
                    >
                      <div className="font-medium text-white">{facility.name}</div>
                      <div className="text-sm text-zinc-400">{facility.facilityType} • {facility.province}</div>
                    </button>
                  ))}
                </div>
              )}
              {showFacilityDropdown && facilitySearch.length >= 2 && facilities.length === 0 && !facilityLoading && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg p-4 text-center">
                  <div className="text-zinc-400">No facilities found matching "{facilitySearch}"</div>
                </div>
              )}
            </div>
            {touched.medicalFacilityId && errors.medicalFacilityId && (
              <p className="text-red-400 text-sm">{errors.medicalFacilityId}</p>
            )}
            {selectedFacility && (
              <p className="text-green-400 text-sm">
                Selected: {selectedFacility.name} - {selectedFacility.facilityType} ({selectedFacility.province})
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              Treatment Categories <span className="text-red-400">*</span>
            </label>
            <p className="text-zinc-400 text-sm">
              Select all categories that apply to your experience
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MEDICAL_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-zinc-800 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-blue-600 bg-zinc-900 border-zinc-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-300">{category}</span>
                </label>
              ))}
            </div>
            {touched.categories && errors.categories && (
              <p className="text-red-400 text-sm">{errors.categories}</p>
            )}
          </div>

          {/* Doctor Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              Overall Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="text-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <span
                    className={
                      star <= formData.rating
                        ? "text-yellow-400"
                        : "text-zinc-600 hover:text-zinc-400"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
              <span className="ml-3 text-zinc-400">
                {formData.rating > 0 && `${formData.rating} star${formData.rating === 1 ? "" : "s"}`}
              </span>
            </div>
            {touched.rating && errors.rating && (
              <p className="text-red-400 text-sm">{errors.rating}</p>
            )}
          </div>

          {/* Experience Description */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              Your Experience <span className="text-red-400">*</span>
            </label>
            <p className="text-zinc-400 text-sm">
              Please describe your experience in detail. Minimum 20 characters.
            </p>
            <textarea
              value={formData.experienceText}
              onChange={(e) => handleFieldChange("experienceText", e.target.value)}
              onBlur={() => handleFieldBlur("experienceText")}
              placeholder="Share your experience with this doctor and treatment..."
              rows={6}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            <div className="flex justify-between items-center">
              <div>
                {touched.experienceText && errors.experienceText && (
                  <p className="text-red-400 text-sm">{errors.experienceText}</p>
                )}
              </div>
              <div className="text-sm text-zinc-400">
                {formData.experienceText.length}/50 minimum
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting Review...
                </span>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
