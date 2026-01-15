"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Home() {
  const { user, userProfile, loading } = useAuth();

  const publicPages = [
    { name: "About", href: "/about", description: "About our medical site" },
    { name: "Blogs", href: "/blogs", description: "Medical articles & tips" },
    { name: "Doctors", href: "/doctors", description: "Browse doctors directory" },
    { name: "Medical Facilities", href: "/medical-facilities", description: "Browse medical facilities" },
    { name: "Agencies", href: "/agencies", description: "Browse agencies" },
  ];

  // Dynamic user pages based on authentication state
  const userPages = user && userProfile ? [
    { name: "Profile", href: "/profile", description: "User profile management" },
    { name: "Treatment Plan", href: "/treatment-plan", description: "Your treatment plan" },
    { name: "Support Tickets", href: "/support", description: "User support portal" },
  ] : [
    { name: "Login", href: "/login", description: "User authentication" },
    { name: "Sign Up", href: "/signup/role-selection", description: "Create new account" },
    { name: "Personnel Application", href: "/signup/healthcare-personnel-application", description: "Apply as healthcare professional" },
  ];

  const adminPages = [
    { name: "Admin Dashboard", href: "/admin", description: "Admin control panel" },
    { name: "Personnel Management", href: "/admin/healthcare-personnel", description: "Manage healthcare staff" },
    { name: "Facility Management", href: "/admin/medical-facilities", description: "Manage medical facilities" },
    { name: "Agency Management", href: "/admin/agencies", description: "Manage agencies" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Image
            className="mx-auto mb-8 dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
          />
          <h1 className="text-4xl font-bold mb-4">🏥 Medikal Site</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {user && userProfile
              ? `Welcome back, ${userProfile.displayName}! Access your personalized medical services.`
              : "Development Navigation Hub - Access all pages for testing and development"
            }
          </p>
        </div>

        {/* Add Review Button - Only show for logged in users */}
        {user && userProfile && (
          <div className="flex justify-center mb-12">
            <Link
              href="/add-review"
              className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
            >
              <span className="text-2xl">+</span>
              Add Review!
            </Link>
          </div>
        )}

        {/* Public Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">📄 Public Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* User Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">👤 User Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">⚡ Admin Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Development Info */}
        <div className="text-center">
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <h3 className="text-xl font-semibold mb-4">🔧 Development Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-zinc-400 mb-1">Frontend</p>
                <p className="text-green-400">✅ Next.js 16 + Tailwind</p>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Backend</p>
                <p className="text-green-400">✅ Firebase Auth + Firestore</p>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Deployment</p>
                <p className="text-yellow-400">🚧 In Development</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
