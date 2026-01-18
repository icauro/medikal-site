"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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
        const facilitiesCollection = collection(db, "medical_facility_listings");
        const facilitiesSnapshot = await getDocs(facilitiesCollection);

        const facilitiesList: MedicalFacility[] = [];

        for (const doc of facilitiesSnapshot.docs) {
          const data = doc.data();

          // Fetch reviews for this facility to calculate average rating
          let averageRating: number | undefined = undefined;
          try {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("medicalFacilityId", "==", doc.id),
              where("status", "==", "published")
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);

            if (!reviewsSnapshot.empty) {
              const reviews = reviewsSnapshot.docs.map(reviewDoc => reviewDoc.data());
              const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
              averageRating = totalRating / reviews.length;
            }
          } catch (error) {
            console.warn(`Error fetching reviews for facility ${doc.id}:`, error);
          }

          facilitiesList.push({
            id: doc.id,
            slug: data.slug || "",
            name: data.name || "",
            type: data.type || "",
            province: data.province || undefined,
            country: data.country || undefined,
            image: data.image || undefined,
            rating: averageRating,
            userId: data.userId,
          });
        }

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
