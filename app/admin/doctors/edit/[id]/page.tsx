"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp, collection } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    bio: "",
    image: "",
    slug: "",
    userId: "",
    rating: "",
  });

  useEffect(() => {
    async function loadDoctor() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setDoctorId(id);

        const doctorRef = doc(db, "doctors", id);
        const doctorSnap = await getDoc(doctorRef);

        if (!doctorSnap.exists()) {
          setError("Doctor not found");
          setLoading(false);
          return;
        }

        const data = doctorSnap.data();
        setFormData({
          name: data.name || "",
          specialty: data.specialty || "",
          bio: data.bio || "",
          image: data.image || "",
          slug: data.slug || "",
          userId: data.userId || "",
          rating: data.rating?.toString() || "",
        });
      } catch (err) {
        console.error("Error loading doctor:", err);
        setError("Failed to load doctor");
      } finally {
        setLoading(false);
      }
    }

    loadDoctor();
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

      // Check if slug already exists (excluding current doctor)
      const doctorsRef = collection(db, "doctors");
      const slugQuery = query(doctorsRef, where("slug", "==", slug));
      const existingDocs = await getDocs(slugQuery);

      const slugExists = existingDocs.docs.some(
        (doc) => doc.id !== doctorId
      );

      if (slugExists) {
        throw new Error(`Doctor with slug "${slug}" already exists`);
      }

      // Update doctor document
      const doctorRef = doc(db, "doctors", doctorId);
      await updateDoc(doctorRef, {
        name: formData.name,
        specialty: formData.specialty,
        slug: slug,
        bio: formData.bio || null,
        image: formData.image || null,
        userId: formData.userId || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/doctors");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update doctor");
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
              <p className="text-zinc-400 text-lg">Loading doctor...</p>
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
              href="/admin/doctors"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Doctors Management
            </Link>
            <h1 className="text-4xl font-bold mt-4">Edit Doctor</h1>
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
                <input
                  type="text"
                  id="specialty"
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Cardiologist"
                />
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

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Update Doctor"}
                </button>
                <Link
                  href="/admin/doctors"
                  className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors inline-block text-center"
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
