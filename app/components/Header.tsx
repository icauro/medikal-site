"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState("TR");

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: "Hizmetler", href: "/services" },
        { name: "Paketler", href: "/packages" },
        { name: "Klinikler", href: "/clinics" },
        { name: "Blog", href: "/blog" },
    ];

    const languages = ["TR", "EN", "AR", "RU"];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
                    : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isScrolled
                                        ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                                        : "bg-white/10 backdrop-blur-md"
                                    }`}
                            >
                                <svg
                                    className={`w-7 h-7 transition-colors ${isScrolled ? "text-white" : "text-white"
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </div>
                            <div
                                className={`absolute -inset-1 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity ${isScrolled
                                        ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                                        : "bg-white"
                                    }`}
                            ></div>
                        </div>
                        <span
                            className={`text-xl font-bold transition-colors ${isScrolled
                                    ? "text-gray-900"
                                    : "text-white drop-shadow-lg"
                                }`}
                        >
                            MedikalTurkey
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${isScrolled
                                        ? "text-gray-700 hover:text-cyan-600"
                                        : "text-white/90 hover:text-white drop-shadow-md"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Section: Language Selector + CTA Button */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {/* Language Selector */}
                        <div className="relative group">
                            <button
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isScrolled
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        : "bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
                                    }`}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                    />
                                </svg>
                                <span>{currentLanguage}</span>
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Language Dropdown */}
                            <div className="absolute top-full right-0 mt-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setCurrentLanguage(lang)}
                                            className={`w-full px-4 py-2 text-sm text-left transition-colors ${currentLanguage === lang
                                                    ? "bg-cyan-50 text-cyan-600 font-semibold"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href="/get-quote"
                            className="group relative px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center space-x-2">
                                <span>Teklif Al</span>
                                <svg
                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`lg:hidden p-2 rounded-lg transition-colors ${isScrolled
                                ? "text-gray-700 hover:bg-gray-100"
                                : "text-white hover:bg-white/10 backdrop-blur-md"
                            }`}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden py-4 bg-white/95 backdrop-blur-xl rounded-2xl mt-2 shadow-2xl border border-gray-200/50">
                        <nav className="flex flex-col space-y-2 px-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                                {languages.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setCurrentLanguage(lang);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentLanguage === lang
                                                ? "bg-cyan-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                            <Link
                                href="/get-quote"
                                className="mt-2 px-6 py-3 rounded-lg font-semibold text-center text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Teklif Al
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
