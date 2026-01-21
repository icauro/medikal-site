"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import UserCommentsSection from "@/app/components/UserCommentsSection";
import { supabase, convertDatabaseRow } from "@/lib/supabase";

export default function MedicalFacilityProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchFacility() {
      try {
        const { data, error } = await supabase
          .from('medical_facility_listings')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error("🚫 [FACILITY_DETAIL] Error fetching facility:", error);
          setFacility(null);
          return;
        }

        if (data) {
          const converted = convertDatabaseRow(data);
          setFacility(converted);
          console.log("✅ [FACILITY_DETAIL] Loaded facility:", converted.name);
        }
      } catch (error) {
        console.error("🚫 [FACILITY_DETAIL] Error fetching facility:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFacility();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <p className="text-zinc-400">Loading facility profile...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-sans">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold mb-4">Facility Not Found</h1>
          <p className="text-zinc-500 mb-8">The medical facility you are looking for does not exist or has been removed.</p>
          <Link href="/medical-facilities" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/medical-facilities" className="text-zinc-400 hover:text-white mb-8 inline-flex items-center gap-2 group transition-colors">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Directory
        </Link>
        
        <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
          <div className="w-full md:w-80 aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800 shadow-2xl">
            {facility.image ? (
              <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-9xl opacity-20">🏥</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20">
                {facility.type}
              </span>
              {facility.rating && (
                <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/20">
                  ★ {facility.rating.toFixed(1)}
                </span>
              )}
            </div>
            
            <h1 className="text-5xl font-bold mb-6 tracking-tight">{facility.name}</h1>
            
            <div className="flex flex-wrap gap-6 mb-8 text-zinc-400">
               {facility.province && (
                 <div className="flex items-center gap-2">
                   <span className="text-xl">📍</span>
                   <span>{facility.province}, {facility.country}</span>
                 </div>
               )}
            </div>
            
            {facility.description && (
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">About the Facility</h3>
                <p className="text-zinc-300 leading-relaxed text-lg">{facility.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 Contact Details
              </h2>
              <div className="space-y-6">
                {facility.city && (
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] block mb-2">Location</label>
                    <p className="text-zinc-300 leading-snug">{facility.city}</p>
                  </div>
                )}
                {facility.phone && (
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] block mb-2">Direct Line</label>
                    <p className="text-zinc-100 font-medium text-lg">{facility.phone}</p>
                  </div>
                )}
                {facility.email && (
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] block mb-2">Email Address</label>
                    <p className="text-zinc-300">{facility.email}</p>
                  </div>
                )}
                {facility.website && (
                  <div className="pt-2">
                    <a 
                      href={facility.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full block text-center bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            {facility.services && facility.services.length > 0 && (
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-6">Services & Specialty Centers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facility.services.map((service: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-zinc-200">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Future placeholder for doctors list */}
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 border-dashed text-center">
              <p className="text-zinc-500">Reviews and linked medical staff will appear here soon.</p>
            </div>

            {/* Community Discussion Section */}
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-6">Community Discussion</h2>
              <UserCommentsSection
                entityId={facility.id}
                entityType="medical_facility"
                entityName={facility.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
