"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

interface DashboardStats {
  doctorsCount: number;
  // Add more stats as needed
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ doctorsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch doctors count
        const doctorsSnapshot = await getDocs(collection(db, "doctors"));
        setStats({
          doctorsCount: doctorsSnapshot.size,
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
      title: "Verification Requests",
      description: "Review doctor verification applications",
      href: "/admin/verifications",
      icon: "✅",
      color: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
      highlight: true,
    },
    {
      title: "Doctors",
      description: "Manage doctors and their profiles",
      href: "/admin/doctors",
      icon: "👨‍⚕️",
      color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    },
    {
      title: "Create Doctor",
      description: "Add a new doctor to the database",
      href: "/admin/doctors/create",
      icon: "➕",
      color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
    },
    {
      title: "Support Tickets",
      description: "Manage user support requests",
      href: "/admin/support",
      icon: "🎫",
      color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
    },
    // Add more sections as needed
    // {
    //   title: "Reviews",
    //   description: "Moderate patient reviews",
    //   href: "/admin/reviews",
    //   icon: "⭐",
    //   color: "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20",
    // },
    // {
    //   title: "Clinics",
    //   description: "Manage clinic information",
    //   href: "/admin/clinics",
    //   icon: "🏥",
    //   color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
    // },
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
                  <p className="text-zinc-400 text-sm mb-1">Total Doctors</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-white">{stats.doctorsCount}</p>
                  )}
                </div>
                <div className="text-4xl">👨‍⚕️</div>
              </div>
            </div>

            {/* Add more stat cards as needed */}
            {/* <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Reviews</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div> */}
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
