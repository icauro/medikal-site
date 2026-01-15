"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { OpenClinicData } from "@/lib/types";

export default function AdminClinicsPage() {
  const router = useRouter();
  const [clinics, setClinics] = useState<OpenClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = async () => {
    try {
      const clinicsCollection = collection(db, "open_clinic_data");
      const clinicsSnapshot = await getDocs(clinicsCollection);
      
      const clinicsList: OpenClinicData[] = [];
      
      clinicsSnapshot.forEach((doc) => {
        const data = doc.data();
        clinicsList.push({
          id: doc.id,
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          slug: data.slug || "",
          specialties: data.specialties || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as OpenClinicData);
      });
      
      setClinics(clinicsList);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      setError("Failed to fetch clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleDelete = async (clinicId: string, clinicName: string) => {
    if (!confirm(`Are you sure you want to delete "${clinicName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(clinicId);
    setError(null);

    try {
      const clinicRef = doc(db, "open_clinic_data", clinicId);
      await deleteDoc(clinicRef);
      
      // Refresh the list
      await fetchClinics();
    } catch (error) {
      console.error("Error deleting clinic:", error);
      setError("Failed to delete clinic");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link
                href="/admin"
                className="text-zinc-400 hover:text-white transition-colors text-sm mb-2 inline-block"
              >
                ← Back to Admin Dashboard
              </Link>
              <h1 className="text-4xl font-bold">Clinics Management</h1>
            </div>
            <Link
              href="/admin/clinics/create"
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              + Create Clinic
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading clinics...</p>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800 border-b border-zinc-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Specialties
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {clinics.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-zinc-400"
                        >
                          No clinics found. Create your first clinic!
                        </td>
                      </tr>
                    ) : (
                      clinics.map((clinic) => (
                        <tr
                          key={clinic.id}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-white">{clinic.name}</td>
                          <td className="px-6 py-4 text-zinc-400">
                            {clinic.city ? `${clinic.city}` : clinic.address}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {clinic.specialties && clinic.specialties.length > 0
                              ? clinic.specialties.join(", ")
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                            {clinic.slug || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {clinic.slug && (
                                <Link
                                  href={`/clinics/${clinic.slug}`}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              <Link
                                href={`/admin/clinics/edit/${clinic.id}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(clinic.id, clinic.name)}
                                disabled={deletingId === clinic.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === clinic.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
