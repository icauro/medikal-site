"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function QuickLinks() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return null;
  }

  const quickLinks = [
    { href: '/support', label: 'My Support Tickets', icon: '🎫' },
    { href: '/treatment-plan', label: 'My Treatment Plan Request', icon: '📋' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
        title="Quick Links"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Quick Links
            </div>
            {quickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 hover:bg-zinc-800 transition-colors text-white rounded flex items-center gap-3"
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <div className="border-t border-zinc-800 p-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded-lg text-center font-medium text-sm"
              >
                Login to see more
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
