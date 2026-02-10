import Link from "next/link";
import UserMenu from "./UserMenu";
import QuickLinks from "./QuickLinks";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">Medikal</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              About
            </Link>
            <Link
              href="/blogs"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Blogs
            </Link>
            <Link
              href="/doctors"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Doctors
            </Link>
            <Link
              href="/medical-facilities"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Medical Facilities
            </Link>
            <Link
              href="/agencies"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Agencies
            </Link>
            <Link
              href="/support"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Support
            </Link>
          </div>

          {/* Quick Links & User Menu */}
          <div className="flex items-center gap-2">
            <QuickLinks />
            <UserMenu />
          </div>

          {/* Mobile Menu Button - hidden when user menu is visible */}
          <div className="md:hidden ml-4">
            <button
              type="button"
              className="text-zinc-400 hover:text-white"
              aria-label="Open menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
