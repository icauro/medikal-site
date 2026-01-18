"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import Link from "next/link";
import UserCommentsSection from "@/app/components/UserCommentsSection";

export default function AgencyProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [agency, setAgency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchAgency() {
      try {
        const q = query(
          collection(db, "agency_listings"),
          where("slug", "==", slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setAgency({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching agency:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <p className="text-zinc-400">Loading agency profile...</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-sans">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold mb-4">Agency Not Found</h1>
          <p className="text-zinc-500 mb-8">The medical agency you are looking for does not exist or has been removed.</p>
          <Link href="/agencies" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/agencies" className="text-zinc-400 hover:text-white mb-8 inline-flex items-center gap-2 group transition-colors">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Directory
        </Link>
        
        <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
          <div className="w-full md:w-80 aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800 shadow-2xl">
            {agency.image ? (
              <img src={agency.image} alt={agency.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-9xl opacity-20">🏢</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">
                Authorized Agency
              </span>
              {agency.rating && (
                <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/20">
                  ★ {agency.rating.toFixed(1)}
                </span>
              )}
            </div>
            
            <h1 className="text-5xl font-bold mb-6 tracking-tight">{agency.name}</h1>
            
            <div className="flex flex-wrap gap-6 mb-8 text-zinc-400">
               {agency.province && (
                 <div className="flex items-center gap-2">
                   <span className="text-xl">📍</span>
                   <span>{agency.province}, {agency.country}</span>
                 </div>
               )}
            </div>
            
            {agency.description && (
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">About the Agency</h3>
                <p className="text-zinc-300 leading-relaxed text-lg">{agency.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 Contact & Links
              </h2>
              <div className="space-y-6">
                {agency.phone && (
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] block mb-2">Direct Phone</label>
                    <p className="text-zinc-100 font-medium text-lg">{agency.phone}</p>
                  </div>
                )}
                {agency.email && (
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] block mb-2">Business Email</label>
                    <p className="text-zinc-300">{agency.email}</p>
                  </div>
                )}
                {agency.website && (
                  <div className="pt-2">
                    <a 
                      href={agency.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full block text-center bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      Official Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            {agency.servicesOffered && agency.servicesOffered.length > 0 && (
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-6">Services Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agency.servicesOffered.map((service: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-zinc-200">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agency.focusCountries && agency.focusCountries.length > 0 && (
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-4">Focus Regions</h2>
                <div className="flex flex-wrap gap-2">
                  {agency.focusCountries.map((country: string, i: number) => (
                    <span key={i} className="bg-zinc-800 px-4 py-2 rounded-lg text-zinc-300 border border-zinc-700">
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 border-dashed text-center">
              <p className="text-zinc-500">Reviews and partner facilities list will appear here soon.</p>
            </div>

            {/* Community Discussion Section */}
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-6">Community Discussion</h2>
              <UserCommentsSection
                entityId={agency.id}
                entityType="agency"
                entityName={agency.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
