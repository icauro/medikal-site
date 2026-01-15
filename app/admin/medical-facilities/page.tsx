"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { OpenMedicalFacilityData } from "@/lib/types";

export default function AdminMedicalFacilitiesPage() {
  const router = useRouter();
  const [medicalFacilities, setMedicalFacilities] = useState<OpenMedicalFacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicalFacilities = async () => {
    try {
      const facilitiesCollection = collection(db, "open_medical_facility_data");
      const facilitiesSnapshot = await getDocs(facilitiesCollection);
      
      const facilitiesList: OpenMedicalFacilityData[] = [];
      
      facilitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        facilitiesList.push({
          id: doc.id,
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          slug: data.slug || "",
          facilityType: data.facilityType || "Clinic",
          specialties: data.specialties || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as OpenMedicalFacilityData);
      });
      
      setMedicalFacilities(facilitiesList);
    } catch (error) {
      console.error("Error fetching medical facilities:", error);
      setError("Failed to fetch medical facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalFacilities();
  }, []);

  const handleDelete = async (facilityId: string, facilityName: string) => {
    if (!confirm(`Are you sure you want to delete "${facilityName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(facilityId);
    setError(null);

    try {
      const facilityRef = doc(db, "open_medical_facility_data", facilityId);
      await deleteDoc(facilityRef);
      
      // Refresh the list
      await fetchMedicalFacilities();
    } catch (error) {
      console.error("Error deleting medical facility:", error);
      setError("Failed to delete medical facility");
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
              <h1 className="text-4xl font-bold">Medical Facilities Management</h1>
            </div>
            <Link
              href="/admin/medical-facilities/create"
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              + Create Medical Facility
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading medical facilities...</p>
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
                        Type
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
                    {medicalFacilities.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-zinc-400"
                        >
                          No medical facilities found. Create your first!
                        </td>
                      </tr>
                    ) : (
                      medicalFacilities.map((facility) => (
                        <tr
                          key={facility.id}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-white">{facility.name}</td>
                          <td className="px-6 py-4 text-zinc-300">
                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                              {facility.facilityType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {facility.city ? `${facility.city}` : facility.address}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {facility.specialties && facility.specialties.length > 0
                              ? facility.specialties.join(", ")
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                            {facility.slug || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {facility.slug && (
                                <Link
                                  href={`/medical-facilities/${facility.slug}`}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              <Link
                                href={`/admin/medical-facilities/edit/${facility.id}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(facility.id, facility.name)}
                                disabled={deletingId === facility.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === facility.id ? "Deleting..." : "Delete"}
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
