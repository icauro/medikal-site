"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp, collection } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { DOCTOR_SPECIALTIES, PERSONNEL_TYPES, PersonnelType } from "@/lib/types";

export default function EditHealthcarePersonnelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [personnelId, setPersonnelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    personnelType: "Doctor" as PersonnelType,
    specialty: "",
    bio: "",
    image: "",
    slug: "",
    personalHealthcarePersonnelDataId: "",
    rating: "",
    googlePlaceId: "",
  });

  useEffect(() => {
    async function loadPersonnel() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setPersonnelId(id);

        const personnelRef = doc(db, "open_healthcare_personnel_data", id);
        const personnelSnap = await getDoc(personnelRef);

        if (!personnelSnap.exists()) {
          setError("Healthcare personnel not found");
          setLoading(false);
          return;
        }

        const data = personnelSnap.data();
        setFormData({
          name: data.name || "",
          personnelType: data.personnelType || "Doctor",
          specialty: data.specialty || "",
          bio: data.bio || "",
          image: data.image || "",
          slug: data.slug || "",
          personalHealthcarePersonnelDataId: data.personalHealthcarePersonnelDataId || data.userId || "",
          rating: data.rating?.toString() || "",
          googlePlaceId: data.googlePlaceId || "",
        });
      } catch (err) {
        console.error("Error loading personnel:", err);
        setError("Failed to load healthcare personnel");
      } finally {
        setLoading(false);
      }
    }

    loadPersonnel();
  }, [params]);

  // Utility function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Generate slug if not provided
      const slug = formData.slug || generateSlug(formData.name);

      // Check if slug already exists (excluding current personnel)
      const personnelCollectionRef = collection(db, "open_healthcare_personnel_data");
      const slugQuery = query(personnelCollectionRef, where("slug", "==", slug));
      const existingDocs = await getDocs(slugQuery);

      const slugExists = existingDocs.docs.some(
        (doc) => doc.id !== personnelId
      );

      if (slugExists) {
        throw new Error(`Personnel with slug "${slug}" already exists`);
      }

      // Update personnel document
      const personnelRef = doc(db, "open_healthcare_personnel_data", personnelId);
      await updateDoc(personnelRef, {
        name: formData.name,
        personnelType: formData.personnelType,
        specialty: formData.specialty,
        slug: slug,
        bio: formData.bio || null,
        image: formData.image || null,
        personalHealthcarePersonnelDataId: formData.personalHealthcarePersonnelDataId || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        googlePlaceId: formData.googlePlaceId || null,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/healthcare-personnel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update healthcare personnel");
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">Loading personnel...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/admin/healthcare-personnel"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Personnel Management
            </Link>
            <h1 className="text-4xl font-bold mt-4">Edit Healthcare Personnel</h1>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="personnelType" className="block text-sm font-medium text-zinc-300 mb-2">
                    Personnel Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="personnelType"
                    name="personnelType"
                    required
                    value={formData.personnelType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    {PERSONNEL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-zinc-300 mb-2">
                  Specialty <span className="text-red-400">*</span>
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="">Select a specialty</option>
                  {DOCTOR_SPECIALTIES.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-zinc-300 mb-2">
                  Slug (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="dr-john-doe"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                  placeholder="Personnel's biography and background..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-zinc-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-zinc-300 mb-2">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="4.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="personalHealthcarePersonnelDataId" className="block text-sm font-medium text-zinc-300 mb-2">
                    Personal Data ID (User profile UID)
                  </label>
                  <input
                    type="text"
                    id="personalHealthcarePersonnelDataId"
                    name="personalHealthcarePersonnelDataId"
                    value={formData.personalHealthcarePersonnelDataId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="UID from Authentication"
                  />
                </div>

                <div>
                  <label htmlFor="googlePlaceId" className="block text-sm font-medium text-zinc-300 mb-2">
                    Google Place ID
                  </label>
                  <input
                    type="text"
                    id="googlePlaceId"
                    name="googlePlaceId"
                    value={formData.googlePlaceId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="ChIJ..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
                <Link
                  href="/admin/healthcare-personnel"
                  className="flex-1 px-8 py-3 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-all text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
