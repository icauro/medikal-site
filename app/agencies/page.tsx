"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/app/components/ListingCard";

interface Agency {
  id: string;
  slug: string;
  name: string;
  province?: string;
  country?: string;
  image?: string;
  rating?: number;
  user_id?: string;
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        // Fetch agencies from Supabase
        const { data: agenciesData, error: agenciesError } = await supabase
          .from("agency_listings")
          .select("*");

        if (agenciesError) throw agenciesError;

        const agenciesList: Agency[] = [];

        for (const data of agenciesData || []) {
          // Fetch reviews for this agency to calculate average rating
          let averageRating: number | undefined = undefined;
          try {
            const { data: reviewsData, error: reviewsError } = await supabase
              .from("reviews")
              .select("rating")
              .eq("listing_id", data.id)
              .eq("listing_type", "agency")
              .eq("status", "published");

            if (!reviewsError && reviewsData && reviewsData.length > 0) {
              const totalRating = reviewsData.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
              averageRating = totalRating / reviewsData.length;
            }
          } catch (error) {
            console.warn(`Error fetching reviews for agency ${data.id}:`, error);
          }

          agenciesList.push({
            id: data.id,
            slug: data.slug || "",
            name: data.name || "",
            province: data.province || undefined,
            country: data.country || undefined,
            image: data.image || undefined,
            rating: averageRating,
            user_id: data.user_id,
          });
        }

        setAgencies(agenciesList);
      } catch (error) {
        console.error("Error fetching agencies from Supabase:", error);
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
          <ListingCard
                key={agency.id}
                id={agency.id}
                slug={agency.slug}
                name={agency.name}
                href={`/agencies/${agency.slug}`}
                image={agency.image}
                hasData={!!agency.user_id}
                emoji="🏢"
                primaryInfo=""
                secondaryInfo={agency.province ? `${agency.province}, ${agency.country}` : undefined}
                rating={agency.rating}
              />
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
