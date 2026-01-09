"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  slug: string;
  rating?: number;
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      const doctorsCollection = collection(db, "doctors");
      const doctorsSnapshot = await getDocs(doctorsCollection);
      
      const doctorsList: Doctor[] = [];
      
      doctorsSnapshot.forEach((doc) => {
        const data = doc.data();
        doctorsList.push({
          id: doc.id,
          name: data.name || "",
          specialty: data.specialty || "",
          slug: data.slug || "",
          rating: data.rating || undefined,
        });
      });
      
      setDoctors(doctorsList);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (doctorId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to delete "${doctorName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(doctorId);
    setError(null);

    try {
      const doctorRef = doc(db, "doctors", doctorId);
      await deleteDoc(doctorRef);
      
      // Refresh the list
      await fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      setError("Failed to delete doctor");
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
              <h1 className="text-4xl font-bold">Doctors Management</h1>
            </div>
            <Link
              href="/admin/doctors/create"
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              + Create Doctor
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading doctors...</p>
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
                    {doctors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-zinc-400"
                        >
                          No doctors found. Create your first doctor!
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor) => (
                        <tr
                          key={doctor.id}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-white">{doctor.name}</td>
                          <td className="px-6 py-4 text-zinc-400">
                            {doctor.specialty}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                            {doctor.slug}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {doctor.rating ? `★ ${doctor.rating}` : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Link
                                href={`/doctors/${doctor.slug}`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                View
                              </Link>
                              <Link
                                href={`/admin/doctors/edit/${doctor.id}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(doctor.id, doctor.name)}
                                disabled={deletingId === doctor.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === doctor.id ? "Deleting..." : "Delete"}
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
