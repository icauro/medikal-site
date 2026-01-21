"use client";

import { useEffect, useState } from "react";
import { supabase, convertDatabaseRow } from "@/lib/supabase";
import ListingCard from "@/app/components/ListingCard";

// Type definition for Healthcare Personnel
interface HealthcarePersonnel {
  id: string;
  slug: string;
  name: string;
  specialization: string;
  bio?: string;
  image?: string;
  medicalFacility?: string;
  rating?: number;
  userId?: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<HealthcarePersonnel[]>([]);
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
        const { data, error } = await supabase
          .from('healthcare_personnel_listings')
          .select('*');

        if (error) throw error;

        const doctorsList = (data || []).map((doctor: any) => convertDatabaseRow({
          id: doctor.id,
          slug: doctor.slug,
          name: doctor.name,
          specialization: doctor.specialization,
          bio: doctor.bio,
          image: doctor.image,
          medicalFacility: doctor.medical_facility,
          rating: doctor.average_rating,
          userId: doctor.user_id
        }));

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
            <p className="text-zinc-400 text-lg">Loading healthcare personnel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Healthcare Personnel</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <ListingCard
              key={doctor.id}
              id={doctor.id}
              slug={doctor.slug}
              name={doctor.name}
              href={`/healthcare-personnel/${doctor.slug}`}
              image={doctor.image}
              hasUser={!!doctor.userId}
              emoji="👤"
              primaryInfo={doctor.specialization}
              rating={doctor.rating}
            />
          ))}
        </div>

        {doctors.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No healthcare personnel found</p>
          </div>
        )}
      </div>
    </div>
  );
}
