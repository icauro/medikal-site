"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Type definition for Doctor
interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio?: string;
  image?: string;
  medicalFacility?: string;
  rating?: number;
  personalHealthcarePersonnelDataId?: string;
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
        const personnelCollection = collection(db, "open_healthcare_personnel_data");
        // Only fetch personnel of type 'Doctor' for this page
        const doctorsQuery = query(personnelCollection, where("personnelType", "==", "Doctor"));
        const doctorsSnapshot = await getDocs(doctorsQuery);

        const doctorsList: Doctor[] = [];

        // Process doctors and calculate ratings from reviews
        for (const doc of doctorsSnapshot.docs) {
          const data = doc.data();

          // Fetch reviews for this doctor to calculate average rating
          let averageRating: number | undefined = undefined;
          try {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("doctorId", "==", doc.id),
              where("status", "==", "published")
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);

            if (!reviewsSnapshot.empty) {
              const reviews = reviewsSnapshot.docs.map(reviewDoc => reviewDoc.data());
              const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
              averageRating = totalRating / reviews.length;
            }
          } catch (error) {
            console.warn(`Error fetching reviews for healthcare personnel ${doc.id}:`, error);
            // Continue with undefined rating if reviews can't be fetched
          }

          doctorsList.push({
            id: doc.id,
            slug: data.slug || "",
            name: data.name || "",
            specialty: data.specialty || "",
            bio: data.bio || undefined,
            image: data.image || undefined,
            medicalFacility: data.medicalFacility || undefined,
            rating: averageRating,
            personalHealthcarePersonnelDataId: data.personalHealthcarePersonnelDataId,
          });
        }

        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching healthcare personnel from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Doctors</h1>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/doctors/${doctor.slug}`}
              className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800"
            >
              <div className="mb-4">
                <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {doctor.image && doctor.personalHealthcarePersonnelDataId ? (
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-6xl opacity-20">👤</span>
                      {!doctor.personalHealthcarePersonnelDataId && (
                        <span className="text-[10px] uppercase font-bold text-zinc-600 mt-2 tracking-widest">Listing Only</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                {doctor.name}
              </h2>
              <p className="text-zinc-400 mb-2">{doctor.specialty}</p>
              {doctor.rating !== undefined && (
                <p className="text-yellow-400">★ {doctor.rating.toFixed(1)}</p>
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
