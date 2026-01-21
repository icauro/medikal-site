"use client";

import { useEffect, useState } from "react";
import { supabase, convertDatabaseRow } from "@/lib/supabase";
import ListingCard from "@/app/components/ListingCard";

interface MedicalFacility {
  id: string;
  slug: string;
  name: string;
  type: string;
  province?: string;
  country?: string;
  image?: string;
  rating?: number;
  userId?: string;
}

export default function MedicalFacilitiesPage() {
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const { data, error } = await supabase
          .from('medical_facility_listings')
          .select('*');

        if (error) throw error;

        const facilitiesList = (data || []).map((facility: any) => convertDatabaseRow({
          id: facility.id,
          slug: facility.slug,
          name: facility.name,
          type: facility.facility_type,
          province: facility.province,
          country: facility.country,
          image: facility.image,
          rating: facility.average_rating,
          userId: facility.user_id
        }));

        setFacilities(facilitiesList);
      } catch (error) {
        console.error("Error fetching medical facilities from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Medical Facilities</h1>
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">Loading facilities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Medical Facilities</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.length > 0 ? (
            facilities.map((facility) => (
              <ListingCard
                key={facility.id}
                id={facility.id}
                slug={facility.slug}
                name={facility.name}
                href={`/medical-facilities/${facility.slug}`}
                image={facility.image}
                hasUser={!!facility.userId}
                emoji="🏥"
                primaryInfo={facility.type}
                secondaryInfo={facility.province ? `${facility.province}, ${facility.country}` : undefined}
                rating={facility.rating}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <p className="text-zinc-500 italic">No medical facilities found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
