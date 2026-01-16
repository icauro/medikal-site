"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface Agency {
  id: string;
  slug: string;
  name: string;
  province?: string;
  country?: string;
  image?: string;
  rating?: number;
  personalAgencyDataId?: string;
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const agenciesCollection = collection(db, "agency_listings");
        const agenciesSnapshot = await getDocs(agenciesCollection);

        const agenciesList: Agency[] = [];

        for (const doc of agenciesSnapshot.docs) {
          const data = doc.data();

          // Fetch reviews for this agency to calculate average rating
          let averageRating: number | undefined = undefined;
          try {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("agencyId", "==", doc.id),
              where("status", "==", "published")
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);

            if (!reviewsSnapshot.empty) {
              const reviews = reviewsSnapshot.docs.map(reviewDoc => reviewDoc.data());
              const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
              averageRating = totalRating / reviews.length;
            }
          } catch (error) {
            console.warn(`Error fetching reviews for agency ${doc.id}:`, error);
          }

          agenciesList.push({
            id: doc.id,
            slug: data.slug || "",
            name: data.name || "",
            province: data.province || undefined,
            country: data.country || undefined,
            image: data.image || undefined,
            rating: averageRating,
            personalAgencyDataId: data.personalAgencyDataId,
          });
        }

        setAgencies(agenciesList);
      } catch (error) {
        console.error("Error fetching agencies from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgencies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Agencies</h1>
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">Loading agencies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Agencies</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.length > 0 ? (
            agencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/agencies/${agency.slug}`}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800"
              >
                <div className="mb-4">
                  <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {agency.image && agency.personalAgencyDataId ? (
                      <img 
                        src={agency.image} 
                        alt={agency.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-6xl opacity-20">🏢</span>
                        {!agency.personalAgencyDataId && (
                          <span className="text-[10px] uppercase font-bold text-zinc-600 mt-2 tracking-widest">Listing Only</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-white line-clamp-1">
                  {agency.name}
                </h2>
                {agency.province && (
                  <p className="text-zinc-500 text-sm mb-2">{agency.province}, {agency.country}</p>
                )}
                {agency.rating !== undefined && (
                  <p className="text-yellow-400">★ {agency.rating.toFixed(1)}</p>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <p className="text-zinc-500 italic">No agencies found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
