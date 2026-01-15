"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

interface DashboardStats {
  personnelCount: number;
  medicalFacilitiesCount: number;
  agenciesCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ 
    personnelCount: 0,
    medicalFacilitiesCount: 0,
    agenciesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch counts from correct collection names (matching types)
        const [personnelSnap, medicalFacilitiesSnap, agenciesSnap] = await Promise.all([
          getDocs(collection(db, "open_healthcare_personnel_data")),
          getDocs(collection(db, "open_medical_facility_data")),
          getDocs(collection(db, "open_agency_data"))
        ]);

        setStats({
          personnelCount: personnelSnap.size,
          medicalFacilitiesCount: medicalFacilitiesSnap.size,
          agenciesCount: agenciesSnap.size
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const adminSections = [
    {
      title: "Healthcare Personnel",
      description: "Manage doctors and coordinators",
      href: "/admin/healthcare-personnel",
      icon: "👥",
      color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    },
    {
      title: "Medical Facilities",
      description: "Manage medical facility information",
      href: "/admin/medical-facilities",
      icon: "🏥",
      color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
    },
    {
      title: "Agencies",
      description: "Manage medical tourism agencies",
      href: "/admin/agencies",
      icon: "✈️",
      color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
    },
    {
      title: "Support Tickets",
      description: "Manage user support requests",
      href: "/admin/support",
      icon: "🎫",
      color: "bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20",
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-zinc-400">Manage your medical site content and data</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Personnel</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-white">{stats.personnelCount}</p>
                  )}
                </div>
                <div className="text-4xl">👨‍⚕️</div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Medical Facilities</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-white">{stats.medicalFacilitiesCount}</p>
                  )}
                </div>
                <div className="text-4xl">🏥</div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Agencies</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-white">{stats.agenciesCount}</p>
                  )}
                </div>
                <div className="text-4xl">✈️</div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Admin Sections */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`block p-6 rounded-lg border transition-all ${
                    section.color
                  } ${section.highlight ? "ring-2 ring-green-500/50" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{section.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-white">
                        {section.title}
                      </h3>
                      <p className="text-zinc-400 text-sm">{section.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Back */}
          <div className="mt-8">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
