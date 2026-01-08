"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  slug: string;
  rating?: number;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

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
            name: data.name || "",
            specialty: data.specialty || "",
            slug: data.slug || "",
            rating: data.rating || undefined,
          });
        });
        
        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin - Doctors</h1>
          <Link
            href="/admin/doctors/create"
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
          >
            + Create Doctor
          </Link>
        </div>

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
                          <Link
                            href={`/doctors/${doctor.slug}`}
                            className="text-white hover:text-zinc-300 transition-colors mr-4"
                          >
                            View
                          </Link>
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
  );
}
