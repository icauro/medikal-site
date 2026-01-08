export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>

        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white text-3xl font-medium">
              G
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Guest User</h2>
              <p className="text-zinc-400">guest@example.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-sm">Status</label>
              <p className="text-white">Profile functionality has been removed</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <a
              href="/"
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
