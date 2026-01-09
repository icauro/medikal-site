"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Doctors</h1>
        </div>


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
