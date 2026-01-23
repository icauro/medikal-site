"use client";

import { useState, useEffect } from "react";
import {
  HealthcarePersonnelListing,
  MedicalFacilityListing,
  AgencyListing,
} from "@/lib/types";
import ListingCard from "@/app/components/ListingCard";
import { supabase, convertDatabaseRow } from "@/lib/supabase";

type FilterType = "all" | "personnel" | "facilities" | "agencies";

import { theme } from "@/lib/theme";

export default function HealthcareDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");

  const [personnel, setPersonnel] = useState<HealthcarePersonnelListing[]>([]);
  const [facilities, setFacilities] = useState<MedicalFacilityListing[]>([]);
  const [agencies, setAgencies] = useState<AgencyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Countries list for filter
  const countries = [
    "Turkey",
  ];

  // Fetch data from Supabase immediately (public data, no auth needed)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("📋 [DATABASE] Starting to fetch healthcare data...");
        // Fetch the three listing sets in parallel to reduce total latency
        const start = Date.now();
        const personnelQ = supabase
          .from('healthcare_personnel_listings')
          .select('id, name, slug, specialization, country, province, image, rating, user_id');

        const facilitiesQ = supabase
          .from('medical_facility_listings')
          .select('id, name, slug, country, province, city, image, rating, user_id');

        const agenciesQ = supabase
          .from('agency_listings')
          .select('id, name, slug, country, province, city, image, rating, user_id');

        // Run queries in parallel
        const [personnelRes, facilitiesRes, agenciesRes] = await Promise.all([
          personnelQ,
          facilitiesQ,
          agenciesQ,
        ] as unknown as [any, any, any]);

        const elapsed = Date.now() - start;
        console.log(`📋 [DATABASE] Parallel fetch completed in ${elapsed}ms`);

        // Handle personnel result
        if (personnelRes.error) {
          console.error("🚫 [DATABASE] Error fetching personnel:", personnelRes.error.message);
        } else {
          console.log("✅ [DATABASE] Personnel fetched:", personnelRes.data?.length || 0, "records");
          setPersonnel((personnelRes.data || []).map((r: any) => convertDatabaseRow(r)) as HealthcarePersonnelListing[]);
        }

        // Handle facilities result
        if (facilitiesRes.error) {
          console.error("🚫 [DATABASE] Error fetching facilities:", facilitiesRes.error.message);
        } else {
          console.log("✅ [DATABASE] Facilities fetched:", facilitiesRes.data?.length || 0, "records");
          setFacilities((facilitiesRes.data || []).map((r: any) => convertDatabaseRow(r)) as MedicalFacilityListing[]);
        }

        // Handle agencies result
        if (agenciesRes.error) {
          console.error("🚫 [DATABASE] Error fetching agencies:", agenciesRes.error.message);
        } else {
          console.log("✅ [DATABASE] Agencies fetched:", agenciesRes.data?.length || 0, "records");
          setAgencies((agenciesRes.data || []).map((r: any) => convertDatabaseRow(r)) as AgencyListing[]);
        }
      } catch (error: any) {
        console.error("🚫 [DATABASE] Error fetching data:", error?.message);
        setError(error?.message || "Failed to load healthcare database. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Run once on mount - public data doesn't need auth

  // Filter and search logic
  const filterPersonnel = (items: HealthcarePersonnelListing[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = !filterCountry || item.country === filterCountry;
      const matchesSpecialization =
        !filterSpecialization ||
        item.specialization
          ?.toLowerCase()
          .includes(filterSpecialization.toLowerCase());

      return matchesSearch && matchesCountry && matchesSpecialization;
    });
  };

  const filterFacilities = (items: MedicalFacilityListing[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = !filterCountry || item.country === filterCountry;

      return matchesSearch && matchesCountry;
    });
  };

  const filterAgencies = (items: AgencyListing[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = !filterCountry || item.country === filterCountry;

      return matchesSearch && matchesCountry;
    });
  };

  const filteredPersonnel =
    filterType === "all" || filterType === "personnel"
      ? filterPersonnel(personnel)
      : [];
  const filteredFacilities =
    filterType === "all" || filterType === "facilities"
      ? filterFacilities(facilities)
      : [];
  const filteredAgencies =
    filterType === "all" || filterType === "agencies"
      ? filterAgencies(agencies)
      : [];

  const totalResults =
    filteredPersonnel.length +
    filteredFacilities.length +
    filteredAgencies.length;

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.gradients.pageBgClasses} py-12`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-r-green-400"></div>
              <p className="mt-4 text-zinc-400">Loading healthcare database...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme.gradients.pageBgClasses} py-12`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-red-900/20 border border-red-800 rounded-lg p-6">
              <p className="text-red-400 font-semibold">Error Loading Database</p>
              <p className="text-zinc-400 mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.gradients.pageBgClasses} py-12`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Healthcare Database</h1>
          <p className="text-zinc-400">
            Search and filter healthcare professionals, facilities, and agencies
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <input
            type="text"
            placeholder="Search by name, specialization, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="personnel">Healthcare Personnel</option>
              <option value="facilities">Medical Facilities</option>
              <option value="agencies">Agencies</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Country
            </label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Specialization
            </label>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Specializations</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Oncology">Oncology</option>
              <option value="General">General Practice</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 text-zinc-400">
          <p>
            Found <span className="text-cyan-400 font-semibold">{totalResults}</span> result
            {totalResults !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Results */}
        {totalResults === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-zinc-400 text-lg">
              No results found. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Medical Facilities Results */}
            {filteredFacilities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">🏥</span> Medical Facilities
                  <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full ml-auto">
                    {filteredFacilities.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFacilities.filter(f => f.slug).map((facility) => (
                    <ListingCard
                      key={facility.id}
                      id={facility.id}
                      slug={facility.slug!}
                      name={facility.name}
                      href={`/medical-facilities/${facility.slug}`}
                      hasUser={!!facility.userId}
                      emoji="🏥"
                      primaryInfo={facility.city || "Medical Facility"}
                      secondaryInfo={facility.province ? `${facility.province}, ${facility.country}` : undefined}
                      rating={facility.rating}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Healthcare Personnel Results */}
            {filteredPersonnel.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">👨‍⚕️</span> Healthcare Personnel
                  <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full ml-auto">
                    {filteredPersonnel.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPersonnel.filter(p => p.slug).map((person) => (
                    <ListingCard
                      key={person.id}
                      id={person.id}
                      slug={person.slug!}
                      name={person.name}
                      href={`/healthcare-personnel/${person.slug}`}
                      image={person.image}
                      hasUser={!!person.userId}
                      emoji="👤"
                      primaryInfo={person.specialization}
                      rating={person.rating}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Agencies Results */}
            {filteredAgencies.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">🏢</span> Agencies
                  <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full ml-auto">
                    {filteredAgencies.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgencies.filter(a => a.slug).map((agency) => (
                    <ListingCard
                      key={agency.id}
                      id={agency.id}
                      slug={agency.slug!}
                      name={agency.name}
                      href={`/agencies/${agency.slug}`}
                      hasUser={!!agency.userId}
                      emoji="🏢"
                      primaryInfo=""
                      secondaryInfo={agency.province ? `${agency.province}, ${agency.country}` : undefined}
                      rating={agency.rating}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
