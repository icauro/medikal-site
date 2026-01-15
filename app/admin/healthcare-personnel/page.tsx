"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { OpenHealthcarePersonnelData } from "@/lib/types";

export default function AdminHealthcarePersonnelPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<OpenHealthcarePersonnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonnel = async () => {
    try {
      const personnelCollection = collection(db, "open_healthcare_personnel_data");
      const personnelSnapshot = await getDocs(personnelCollection);
      
      const personnelList: OpenHealthcarePersonnelData[] = [];
      
      personnelSnapshot.forEach((doc) => {
        const data = doc.data();
        personnelList.push({
          id: doc.id,
          name: data.name || "",
          personnelType: data.personnelType || "Doctor",
          specialty: data.specialty || "",
          slug: data.slug || "",
          rating: data.rating || undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as OpenHealthcarePersonnelData);
      });
      
      setPersonnel(personnelList);
    } catch (error) {
      console.error("Error fetching healthcare personnel:", error);
      setError("Failed to fetch healthcare personnel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const personnelRef = doc(db, "open_healthcare_personnel_data", id);
      await deleteDoc(personnelRef);
      
      // Refresh the list
      await fetchPersonnel();
    } catch (error) {
      console.error("Error deleting healthcare personnel:", error);
      setError("Failed to delete healthcare personnel");
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
              <h1 className="text-4xl font-bold">Healthcare Personnel Management</h1>
            </div>
            <Link
              href="/admin/healthcare-personnel/create"
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              + Create Personnel
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading personnel...</p>
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
                        Specialty
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {personnel.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-zinc-400"
                        >
                          No personnel found. Create your first personnel!
                        </td>
                      </tr>
                    ) : (
                      personnel.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-white">{item.name}</td>
                          <td className="px-6 py-4 text-zinc-400">
                            {item.personnelType}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {item.specialty}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                            {item.slug}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {item.rating ? `★ ${item.rating}` : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Link
                                href={`/doctors/${item.slug}`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                View
                              </Link>
                              <Link
                                href={`/admin/healthcare-personnel/edit/${item.id}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                disabled={deletingId === item.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === item.id ? "Deleting..." : "Delete"}
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
