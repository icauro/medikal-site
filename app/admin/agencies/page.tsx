"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { OpenAgencyData } from "@/lib/types";

export default function AdminAgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<OpenAgencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAgencies = async () => {
    try {
      const agenciesCollection = collection(db, "open_agency_data");
      const agenciesSnapshot = await getDocs(agenciesCollection);
      
      const agenciesList: OpenAgencyData[] = [];
      
      agenciesSnapshot.forEach((doc) => {
        const data = doc.data();
        agenciesList.push({
          id: doc.id,
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          slug: data.slug || "",
          servicesOffered: data.servicesOffered || [],
          focusCountries: data.focusCountries || [],
          country: data.country || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as OpenAgencyData);
      });
      
      setAgencies(agenciesList);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      setError("Failed to fetch agencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const handleDelete = async (agencyId: string, agencyName: string) => {
    if (!confirm(`Are you sure you want to delete "${agencyName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(agencyId);
    setError(null);

    try {
      const agencyRef = doc(db, "open_agency_data", agencyId);
      await deleteDoc(agencyRef);
      
      // Refresh the list
      await fetchAgencies();
    } catch (error) {
      console.error("Error deleting agency:", error);
      setError("Failed to delete agency");
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
              <h1 className="text-4xl font-bold">Agencies Management</h1>
            </div>
            <Link
              href="/admin/agencies/create"
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              + Create Agency
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading agencies...</p>
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
                        Focus Countries
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
                    {agencies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-zinc-400"
                        >
                          No agencies found. Create your first agency!
                        </td>
                      </tr>
                    ) : (
                      agencies.map((agency) => (
                        <tr
                          key={agency.id}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-white">{agency.name}</td>
                          <td className="px-6 py-4 text-zinc-400">
                            {agency.city ? `${agency.city}` : agency.address}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {agency.focusCountries && agency.focusCountries.length > 0
                              ? agency.focusCountries.join(", ")
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                            {agency.slug || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {agency.slug && (
                                <Link
                                  href={`/agencies/${agency.slug}`}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              <Link
                                href={`/admin/agencies/edit/${agency.id}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(agency.id, agency.name)}
                                disabled={deletingId === agency.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === agency.id ? "Deleting..." : "Delete"}
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
