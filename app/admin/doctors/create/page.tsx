"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { DOCTOR_SPECIALTIES } from "@/lib/types";

export default function CreateDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    bio: "",
    image: "",
    slug: "",
    userId: "",
    rating: "",
    googlePlaceId: "",
  });

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
    setLoading(true);
    setError(null);

    try {
      // Generate slug if not provided
      const slug = formData.slug || generateSlug(formData.name);

      // Check if slug already exists
      const doctorsRef = collection(db, "doctors");
      const slugQuery = query(doctorsRef, where("slug", "==", slug));
      const existingDocs = await getDocs(slugQuery);

      if (!existingDocs.empty) {
        throw new Error(`Doctor with slug "${slug}" already exists`);
      }

      // Create doctor document
      const doctorData = {
        name: formData.name,
        specialty: formData.specialty,
        slug: slug,
        bio: formData.bio || null,
        image: formData.image || null,
        userId: formData.userId || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        googlePlaceId: formData.googlePlaceId || null,
        reviewCount: 0,
        links: [],
        images: [],
        clinicIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "doctors"), doctorData);

      router.push("/admin/doctors");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create doctor");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/admin"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-4xl font-bold mt-4">Create Doctor</h1>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
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
                <label
                  htmlFor="specialty"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
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
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Slug (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="dr-john-doe (auto-generated if empty)"
                />
                <p className="mt-1 text-sm text-zinc-500">
                  Leave empty to auto-generate from name
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                  placeholder="Doctor's biography and background..."
                />
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="https://example.com/doctor-image.jpg"
                />
              </div>

              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="4.5"
                />
              </div>

              <div>
                <label
                  htmlFor="userId"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  User ID (Reference to User document)
                </label>
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="user-document-id"
                />
              </div>

              <div>
                <label
                  htmlFor="googlePlaceId"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Google Place ID
                </label>
                <input
                  type="text"
                  id="googlePlaceId"
                  name="googlePlaceId"
                  value={formData.googlePlaceId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
                <p className="mt-1 text-sm text-zinc-500">
                  Find your Google Place ID at <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a>.
                </p>
              </div>



              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Doctor"}
                </button>
                <a
                  href="/admin/doctors"
                  className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
