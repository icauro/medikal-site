import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/app/admin/SignOutButton";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>

        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <div className="flex items-center gap-6 mb-8">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white text-3xl font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                {session.user?.name || "User"}
              </h2>
              <p className="text-zinc-400">{session.user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-sm">Email</label>
              <p className="text-white">{session.user?.email}</p>
            </div>
            {session.user?.name && (
              <div>
                <label className="text-zinc-500 text-sm">Name</label>
                <p className="text-white">{session.user.name}</p>
              </div>
            )}
            {session.user?.role && (
              <div>
                <label className="text-zinc-500 text-sm">Role</label>
                <p className="text-white">
                  <span className="text-green-400">{session.user.role}</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
