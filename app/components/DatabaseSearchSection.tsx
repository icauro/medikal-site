"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    HealthcarePersonnelListing,
    MedicalFacilityListing,
    AgencyListing
} from "@/lib/types";

type SearchResult = {
    type: "personnel" | "facility" | "agency";
    id: string;
    name: string;
    slug: string;
    subtitle?: string;
    emoji: string;
};

export default function DatabaseSearchSection() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [allData, setAllData] = useState<{
        personnel: HealthcarePersonnelListing[];
        facilities: MedicalFacilityListing[];
        agencies: AgencyListing[];
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/listings');
                const data = await response.json();
                setAllData(data);
            } catch (error) {
                console.error("Error fetching search data:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!query.trim() || !allData) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        const searchTerm = query.toLowerCase();

        const filteredResults: SearchResult[] = [];

        // Personnel
        allData.personnel?.forEach(p => {
            if (p.name.toLowerCase().includes(searchTerm) || p.specialization?.toLowerCase().includes(searchTerm)) {
                filteredResults.push({
                    type: "personnel",
                    id: p.id,
                    name: p.name,
                    slug: p.slug!,
                    subtitle: p.specialization,
                    emoji: "👨‍⚕️"
                });
            }
        });

        // Facilities
        allData.facilities?.forEach(f => {
            if (f.name.toLowerCase().includes(searchTerm)) {
                filteredResults.push({
                    type: "facility",
                    id: f.id,
                    name: f.name,
                    slug: f.slug!,
                    subtitle: f.facilityType,
                    emoji: "🏥"
                });
            }
        });

        // Agencies
        allData.agencies?.forEach(a => {
            if (a.name.toLowerCase().includes(searchTerm)) {
                filteredResults.push({
                    type: "agency",
                    id: a.id,
                    name: a.name,
                    slug: a.slug!,
                    subtitle: "Agency",
                    emoji: "🏢"
                });
            }
        });

        setResults(filteredResults.slice(0, 8)); // Limit to 8 results
        setShowDropdown(true);
        setIsSearching(false);
    }, [query, allData]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (result: SearchResult) => {
        const pathMap = {
            personnel: "/healthcare-personnel",
            facility: "/medical-facilities",
            agency: "/agencies"
        };
        router.push(`${pathMap[result.type]}/${result.slug}`);
        setShowDropdown(false);
    };

    const handleFullSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/healthcare-database?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push("/healthcare-database");
        }
    };

    return (
        <section className="relative min-h-[60vh] flex items-center justify-center py-32 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/healthcare-search-bg.png"
                    alt="Healthcare background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
                <div className="mb-12">
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                        Find the Best <span className="text-cyan-400">Healthcare</span> in Turkey
                    </h2>
                    <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Instant search for thousands of doctors, clinics, and medical facilities.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto relative" ref={dropdownRef}>
                    <form
                        onSubmit={handleFullSearch}
                        className="group relative flex flex-col md:flex-row items-stretch gap-0 bg-white shadow-2xl rounded-2xl md:rounded-full overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-cyan-500/20"
                    >
                        <div className="relative flex-1 flex items-center">
                            <div className="absolute left-8 text-slate-400">
                                {isSearching ? (
                                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => query.trim() && setShowDropdown(true)}
                                placeholder="Search doctors, hospitals, or clinics..."
                                className="w-full pl-20 pr-8 py-8 md:py-10 text-2xl bg-white text-slate-900 placeholder-slate-400 outline-none font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-12 py-8 md:py-10 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-2xl transition-all duration-300"
                        >
                            Search
                        </button>
                    </form>

                    {/* Search Dropdown */}
                    {showDropdown && (results.length > 0 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                            <div className="max-h-[60vh] overflow-y-auto">
                                {results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        className="w-full flex items-center gap-6 px-8 py-6 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                                    >
                                        <span className="text-4xl">{result.emoji}</span>
                                        <div className="flex-1">
                                            <div className="text-xl font-bold text-slate-900">{result.name}</div>
                                            {result.subtitle && (
                                                <div className="text-slate-500 font-medium">{result.subtitle}</div>
                                            )}
                                        </div>
                                        <div className="text-cyan-600 font-semibold group-hover:translate-x-1 transition-transform">
                                            View Profile →
                                        </div>
                                    </button>
                                ))}

                                {results.length > 0 && (
                                    <button
                                        onClick={handleFullSearch}
                                        className="w-full py-6 bg-slate-50 text-slate-600 font-bold hover:text-cyan-600 transition-colors uppercase tracking-wider text-sm"
                                    >
                                        View All Results in Database
                                    </button>
                                )}

                                {!isSearching && results.length === 0 && query && (
                                    <div className="p-10 text-center text-slate-500 italic">
                                        No matching profiles found. Try a different search term or visit the full database.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-12 text-white/80">
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-12 flex items-center justify-center bg-cyan-500/20 rounded-full text-2xl">👨‍⚕️</span>
                        <span className="text-xl font-semibold">Specialist Doctors</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-12 flex items-center justify-center bg-blue-500/20 rounded-full text-2xl">🏥</span>
                        <span className="text-xl font-semibold">Modern Hospitals</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-full text-2xl">🛡️</span>
                        <span className="text-xl font-semibold">Trust & Quality</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
