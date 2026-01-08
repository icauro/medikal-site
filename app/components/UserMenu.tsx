"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function UserMenu() {
  const { data: session, status } = useSession();

  // Get first name from full name
  const getFirstName = (name: string | null | undefined) => {
    if (!name) return "";
    return name.split(" ")[0];
  };

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse"></div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
      >
        Login / Sign Up
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
            {session.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className="hidden md:block text-white text-sm font-medium">
          {getFirstName(session.user?.name) || session.user?.email?.split("@")[0]}
        </span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-zinc-400 hover:text-white transition-colors text-sm"
        title="Sign Out"
      >
        Sign Out
      </button>
    </div>
  );
}
