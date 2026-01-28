"use client";

import { useState } from "react";
import Image from "next/image";

export default function HeroSection() {
    const [searchData, setSearchData] = useState({
        treatment: "",
        location: "",
        clinic: "",
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const treatments = [
        "Hair Transplant",
        "Dental Treatment",
        "Plastic Surgery",
        "Eye Surgery",
        "Cardiology",
        "Orthopedics",
        "Oncology",
        "IVF - Fertility Treatment",
    ];

    const locations = [
        "Istanbul",
        "Ankara",
        "Izmir",
        "Antalya",
        "Bursa",
        "Adana",
        "Gaziantep",
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Search Data:", searchData);
        // Ready for backend integration
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-cyan-900/90 z-10"></div>
                <Image
                    src="/medical-hero.jpg"
                    alt="Modern Medical Facility"
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                />
            </div>

            {/* Animated Gradient Blobs */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse z-0"></div>
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700 z-0"></div>

            {/* Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
                <div className="text-center mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/30 rounded-full px-8 py-3 mb-10 animate-fade-in">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full absolute"></span>
                        <span className="text-cyan-300 text-lg font-medium ml-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                            Turkey's #1 Medical Platform
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-slide-up" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)' }}>
                        Discover Turkey's
                        <span className="block mt-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.9))' }}>
                            Best Medical Clinics
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed animate-slide-up delay-100" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.9), 0 1px 5px rgba(0,0,0,0.8)' }}>
                        World-class healthcare services with trusted clinics,
                        expert doctors, and customized treatment packages. Find the best
                        option for your health today.
                    </p>
                </div>

                {/* Search Bar - Glassmorphism */}
                <div className="max-w-7xl mx-auto animate-slide-up delay-200">
                    <form
                        onSubmit={handleSearch}
                        className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 sm:p-14 border border-white/50"
                    >
                        {/* Decorative gradient border effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl opacity-20 blur"></div>

                        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Treatment Input */}
                            <div className="relative group">
                                <label className="block text-lg font-bold text-gray-800 mb-3">
                                    <span className="flex items-center space-x-2">
                                        <svg
                                            className="w-6 h-6 text-cyan-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span>Treatment Type</span>
                                    </span>
                                </label>
                                <select
                                    value={searchData.treatment}
                                    onChange={(e) =>
                                        setSearchData({ ...searchData, treatment: e.target.value })
                                    }
                                    onFocus={() => setFocusedField("treatment")}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-6 py-5 text-lg rounded-xl border-2 transition-all duration-300 outline-none bg-white text-gray-800 font-medium ${focusedField === "treatment"
                                        ? "border-cyan-500 shadow-lg shadow-cyan-500/25 ring-4 ring-cyan-500/10"
                                        : "border-gray-200 hover:border-cyan-300"
                                        }`}
                                >
                                    <option value="">Select treatment...</option>
                                    {treatments.map((treatment) => (
                                        <option key={treatment} value={treatment}>
                                            {treatment}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Location Input */}
                            <div className="relative group">
                                <label className="block text-lg font-bold text-gray-800 mb-3">
                                    <span className="flex items-center space-x-2">
                                        <svg
                                            className="w-6 h-6 text-cyan-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        <span>Location</span>
                                    </span>
                                </label>
                                <select
                                    value={searchData.location}
                                    onChange={(e) =>
                                        setSearchData({ ...searchData, location: e.target.value })
                                    }
                                    onFocus={() => setFocusedField("location")}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-6 py-5 text-lg rounded-xl border-2 transition-all duration-300 outline-none bg-white text-gray-800 font-medium ${focusedField === "location"
                                        ? "border-cyan-500 shadow-lg shadow-cyan-500/25 ring-4 ring-cyan-500/10"
                                        : "border-gray-200 hover:border-cyan-300"
                                        }`}
                                >
                                    <option value="">Select city...</option>
                                    {locations.map((location) => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clinic Input */}
                            <div className="relative group">
                                <label className="block text-lg font-bold text-gray-800 mb-3">
                                    <span className="flex items-center space-x-2">
                                        <svg
                                            className="w-6 h-6 text-cyan-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                        <span>Clinic</span>
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={searchData.clinic}
                                    onChange={(e) =>
                                        setSearchData({ ...searchData, clinic: e.target.value })
                                    }
                                    onFocus={() => setFocusedField("clinic")}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter clinic name..."
                                    className={`w-full px-6 py-5 text-lg rounded-xl border-2 transition-all duration-300 outline-none bg-white text-gray-800 placeholder-gray-400 font-medium ${focusedField === "clinic"
                                        ? "border-cyan-500 shadow-lg shadow-cyan-500/25 ring-4 ring-cyan-500/10"
                                        : "border-gray-200 hover:border-cyan-300"
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <button
                            type="submit"
                            className="w-full md:w-auto group relative px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xl rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center space-x-4">
                                <svg
                                    className="w-7 h-7"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <span>Search Clinics</span>
                                <svg
                                    className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </form>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-10 mt-12 text-white">
                        <div className="flex items-center space-x-3">
                            <svg
                                className="w-7 h-7 text-cyan-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-lg font-semibold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>500+ Accredited Clinics</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <svg
                                className="w-7 h-7 text-cyan-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-lg font-semibold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>JCI Certified</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <svg
                                className="w-7 h-7 text-cyan-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span className="text-lg font-semibold" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>50,000+ Happy Patients</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                <svg
                    className="w-6 h-6 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </div>
        </div>
    );
}
