import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.user?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-zinc-400">
              Welcome, {session.user?.name || session.user?.email}
            </p>
          </div>
          <SignOutButton />
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">Moderate Reviews</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Review and moderate patient reviews and comments
            </p>
            <button className="text-blue-400 hover:text-blue-300">
              View Reviews →
            </button>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Manage patients, doctors, and clinics
            </p>
            <button className="text-blue-400 hover:text-blue-300">
              View Users →
            </button>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Configure site settings and preferences
            </p>
            <button className="text-blue-400 hover:text-blue-300">
              Open Settings →
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-2 text-zinc-300">
            <div>
              <span className="text-zinc-500">Email:</span>{" "}
              {session.user?.email}
            </div>
            <div>
              <span className="text-zinc-500">Role:</span>{" "}
              <span className="text-green-400">{session.user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
