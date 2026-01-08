"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";

// Type definition for Doctor
interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio?: string;
  image?: string;
  clinic?: string;
  rating?: number;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    bio: "",
    image: "",
    slug: "",
    rating: "",
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

  const handleCreateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
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
        userId: null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        reviewCount: 0,
        links: [],
        images: [],
        clinicIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "doctors"), doctorData);

      // Reset form and close modal
      setFormData({
        name: "",
        specialty: "",
        bio: "",
        image: "",
        slug: "",
        rating: "",
      });
      setShowModal(false);
      
      // Refresh the doctors list
      const doctorsCollection = collection(db, "doctors");
      const doctorsSnapshot = await getDocs(doctorsCollection);
      const doctorsList: Doctor[] = [];
      doctorsSnapshot.forEach((doc) => {
        const data = doc.data();
        doctorsList.push({
          id: doc.id,
          slug: data.slug || "",
          name: data.name || "",
          specialty: data.specialty || "",
          bio: data.bio || undefined,
          image: data.image || undefined,
          clinic: data.clinic || undefined,
          rating: data.rating || undefined,
        });
      });
      setDoctors(doctorsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create doctor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const doctorsCollection = collection(db, "doctors");
        const doctorsSnapshot = await getDocs(doctorsCollection);
        
        const doctorsList: Doctor[] = [];
        
        doctorsSnapshot.forEach((doc) => {
          const data = doc.data();
          doctorsList.push({
            id: doc.id,
            slug: data.slug || "",
            name: data.name || "",
            specialty: data.specialty || "",
            bio: data.bio || undefined,
            image: data.image || undefined,
            clinic: data.clinic || undefined,
            rating: data.rating || undefined,
          });
        });
        
        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching doctors from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Doctors</h1>
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">Loading doctors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Doctors</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
          >
            + Create Doctor
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create Doctor</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setFormData({
                      name: "",
                      specialty: "",
                      bio: "",
                      image: "",
                      slug: "",
                      rating: "",
                    });
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                    {error}
                  </div>
                )}

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
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                    placeholder="Doctor's biography..."
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

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? "Creating..." : "Create Doctor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                      setFormData({
                        name: "",
                        specialty: "",
                        bio: "",
                        image: "",
                        slug: "",
                        rating: "",
                      });
                    }}
                    className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/doctors/${doctor.slug}`}
              className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block"
            >
              <div className="mb-4">
                <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">Image</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                {doctor.name}
              </h2>
              <p className="text-zinc-400 mb-2">{doctor.specialty}</p>
              {doctor.rating && (
                <p className="text-yellow-400">★ {doctor.rating}</p>
              )}
            </Link>
          ))}
        </div>

        {doctors.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No doctors found</p>
          </div>
        )}
      </div>
    </div>
  );
}
