"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  HealthcarePersonnelListing,
  MedicalFacilityListing,
  AgencyListing,
} from "@/lib/types";

type FilterType = "all" | "personnel" | "facilities" | "agencies";

export default function HealthcareDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");

  const [personnel, setPersonnel] = useState<HealthcarePersonnelListing[]>([]);
  const [facilities, setFacilities] = useState<MedicalFacilityListing[]>([]);
  const [agencies, setAgencies] = useState<AgencyListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Countries list for filter
  const countries = [
    "Turkey",
    "United States",
    "Germany",
    "United Kingdom",
    "Canada",
    "Australia",
  ];

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch healthcare personnel
        const personnelSnapshot = await getDocs(
          collection(db, "healthcare_personnel_listings")
        );
        const personnelData = personnelSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as HealthcarePersonnelListing)
        );
        setPersonnel(personnelData);

        // Fetch medical facilities
        const facilitiesSnapshot = await getDocs(
          collection(db, "medical_facility_listings")
        );
        const facilitiesData = facilitiesSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MedicalFacilityListing)
        );
        setFacilities(facilitiesData);

        // Fetch agencies
        const agenciesSnapshot = await getDocs(
          collection(db, "agency_listings")
        );
        const agenciesData = agenciesSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AgencyListing)
        );
        setAgencies(agenciesData);

        console.log("📋 [DATABASE] Loaded healthcare data", {
          personnel: personnelData.length,
          facilities: facilitiesData.length,
          agencies: agenciesData.length,
        });
      } catch (error) {
        console.error("🚫 [DATABASE] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specializations?.some((spec) =>
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCountry = !filterCountry || item.country === filterCountry;

      return matchesSearch && matchesCountry;
    });
  };

  const filterAgencies = (items: AgencyListing[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address?.toLowerCase().includes(searchQuery.toLowerCase());

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-r-cyan-400"></div>
              <p className="mt-4 text-zinc-400">Loading healthcare database...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 py-12">
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
            {/* Healthcare Personnel Results */}
            {filteredPersonnel.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">👨‍⚕️</span> Healthcare Personnel
                  <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full ml-auto">
                    {filteredPersonnel.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPersonnel.map((person) => (
                    <Link
                      key={person.id}
                      href={`/doctors/${person.id}`}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500 transition-all group"
                    >
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {person.specialization}
                      </p>
                      <p className="text-sm text-zinc-500 mt-2">{person.country}</p>
                      <div className="mt-3 flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-zinc-300">
                          {person.rating || "N/A"} ({person.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Facilities Results */}
            {filteredFacilities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">🏥</span> Medical Facilities
                  <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full ml-auto">
                    {filteredFacilities.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFacilities.map((facility) => (
                    <Link
                      key={facility.id}
                      href={`/medical-facilities/${facility.id}`}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500 transition-all group"
                    >
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {facility.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {facility.specializations?.join(", ") || "General"}
                      </p>
                      <p className="text-sm text-zinc-500 mt-2">
                        {facility.address}, {facility.country}
                      </p>
                      <div className="mt-3 flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-zinc-300">
                          {facility.rating || "N/A"} ({facility.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </Link>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAgencies.map((agency) => (
                    <Link
                      key={agency.id}
                      href={`/agencies/${agency.id}`}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500 transition-all group"
                    >
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {agency.name}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-2">
                        {agency.address}, {agency.country}
                      </p>
                      {agency.phone && (
                        <p className="text-sm text-zinc-500">📞 {agency.phone}</p>
                      )}
                      {agency.email && (
                        <p className="text-sm text-zinc-500">📧 {agency.email}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-zinc-300">
                          {agency.rating || "N/A"} ({agency.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </Link>
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
