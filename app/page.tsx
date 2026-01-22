"use client";

import { theme } from "@/lib/theme";

export default function Home() {
  return (
    <div className={`min-h-screen ${theme.gradients.pageBgClasses} text-white relative overflow-hidden`}>
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white">
            🏥 Medikal Portal
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Your gateway to quality healthcare professionals, medical facilities, and trusted agencies.
          </p>
        </div>
      </div>
    </div>
  );
}
