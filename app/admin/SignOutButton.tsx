"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
    >
      Sign Out
    </button>
  );
}
