import Link from "next/link";
import UserMenu from "./UserMenu";
import QuickLinks from "./QuickLinks";
import { theme } from "@/lib/theme";

export default function Navbar() {
  return (
    <nav className={`sticky top-0 z-50 w-full backdrop-blur-md border-b ${theme.components.navbar.border} ${theme.components.navbar.background}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className={`text-xl font-bold ${theme.components.navbar.logoGradient}`}>Medikal Portal</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/"
              className={`transition-colors ${theme.components.navbar.text} ${theme.components.navbar.textHover}`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`transition-colors ${theme.components.navbar.text} ${theme.components.navbar.textHover}`}
            >
              About
            </Link>
            <Link
              href="/blogs"
              className={`transition-colors ${theme.components.navbar.text} ${theme.components.navbar.textHover}`}
            >
              Blogs
            </Link>
            <Link
              href="/healthcare-database"
              className={`transition-colors ${theme.components.navbar.text} ${theme.components.navbar.textHover}`}
            >
              Healthcare Database
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
              className="text-gray-400 hover:text-green-400"
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
                suppressHydrationWarning
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
