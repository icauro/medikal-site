"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp, collection } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { OpenAgencyData } from "@/lib/types";

const COMMON_SERVICES = [
  "Medical Tourism Consultation",
  "Travel Arrangements",
  "Accommodation Booking",
  "Medical Appointments",
  "Translation Services",
  "Airport Transfers",
  "Post-Treatment Follow-up",
  "Insurance Coordination",
  "Visa Assistance",
  "Local Guide Services",
];

const COMMON_COUNTRIES = [
  "Turkey",
  "USA",
  "UK",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "UAE",
  "Saudi Arabia",
  "Russia",
  "Other",
];

export default function EditAgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [agencyId, setAgencyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    slug: "",
    servicesOffered: [] as string[],
    focusCountries: [] as string[],
    description: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    async function loadAgency() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setAgencyId(id);

        const agencyRef = doc(db, "open_agency_data", id);
        const agencySnap = await getDoc(agencyRef);

        if (!agencySnap.exists()) {
          setError("Agency not found");
          setLoading(false);
          return;
        }

        const data = agencySnap.data();
        setFormData({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
          slug: data.slug || "",
          servicesOffered: data.servicesOffered || [],
          focusCountries: data.focusCountries || [],
          description: data.description || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
        });
      } catch (err) {
        console.error("Error loading agency:", err);
        setError("Failed to load agency");
      } finally {
        setLoading(false);
      }
    }

    loadAgency();
  }, [params]);

  // Utility function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Generate slug if not provided
      const slug = formData.slug || generateSlug(formData.name);

      // Check if slug already exists (excluding current agency)
      const agenciesRef = collection(db, "open_agency_data");
      const slugQuery = query(agenciesRef, where("slug", "==", slug));
      const existingDocs = await getDocs(slugQuery);

      const slugExists = existingDocs.docs.some(
        (doc) => doc.id !== agencyId
      );

      if (slugExists) {
        throw new Error(`Agency with slug "${slug}" already exists`);
      }

      // Update agency document
      const agencyRef = doc(db, "open_agency_data", agencyId);
      await updateDoc(agencyRef, {
        name: formData.name,
        address: formData.address,
        city: formData.city || null,
        country: formData.country || null,
        slug: slug,
        servicesOffered: formData.servicesOffered,
        focusCountries: formData.focusCountries,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/agencies");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agency");
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, fieldName: 'servicesOffered' | 'focusCountries') => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: selectedValues }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">Loading agency...</p>
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
              href="/admin/agencies"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Agencies Management
            </Link>
            <h1 className="text-4xl font-bold mt-4">Edit Agency</h1>
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
                  Agency Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Global Medical Tourism Agency"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="456 Tourism Avenue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Istanbul"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Country <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Turkey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="servicesOffered"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Services Offered (Hold Cmd/Ctrl to select multiple)
                  </label>
                  <select
                    id="servicesOffered"
                    name="servicesOffered"
                    multiple
                    value={formData.servicesOffered}
                    onChange={(e) => handleMultiSelectChange(e, 'servicesOffered')}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent h-48"
                  >
                    {COMMON_SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="focusCountries"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Focus Countries (Hold Cmd/Ctrl to select multiple)
                  </label>
                  <select
                    id="focusCountries"
                    name="focusCountries"
                    multiple
                    value={formData.focusCountries}
                    onChange={(e) => handleMultiSelectChange(e, 'focusCountries')}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent h-48"
                  >
                    {COMMON_COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                  placeholder="About the agency..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="+90 555 123 4567"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="contact@agency.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="https://www.agency.com"
                  />
                </div>
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
                  placeholder="tourism-agency (auto-generated if empty)"
                />
                <p className="mt-1 text-sm text-zinc-500">
                  Leave empty to auto-generate from name
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <Link
                  href="/admin/agencies"
                  className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
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
