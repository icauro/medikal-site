import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const publicPages = [
    { name: "About", href: "/about", description: "About our medical site" },
    { name: "Blogs", href: "/blogs", description: "Medical articles & tips" },
    { name: "Doctors", href: "/doctors", description: "Browse doctors directory" },
  ];

  const userPages = [
    { name: "Login", href: "/login", description: "User authentication" },
    { name: "Profile", href: "/profile", description: "User profile management" },
    { name: "Doctor Verification", href: "/doctor/verify", description: "Doctor credential verification" },
  ];

  const adminPages = [
    { name: "Admin Dashboard", href: "/admin", description: "Admin control panel" },
    { name: "Manage Doctors", href: "/admin/doctors", description: "Doctor management" },
    { name: "Create Doctor", href: "/admin/doctors/create", description: "Add new doctor" },
    { name: "Verification Requests", href: "/admin/verifications", description: "Review doctor applications" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Image
            className="mx-auto mb-8 dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
          />
          <h1 className="text-4xl font-bold mb-4">🏥 Medikal Site</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Development Navigation Hub - Access all pages for testing and development
          </p>
        </div>

        {/* Public Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">📄 Public Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* User Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">👤 User Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Pages */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">⚡ Admin Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800 hover:border-zinc-700"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{page.name}</h3>
                <p className="text-zinc-400 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Development Info */}
        <div className="text-center">
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <h3 className="text-xl font-semibold mb-4">🔧 Development Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-zinc-400 mb-1">Frontend</p>
                <p className="text-green-400">✅ Next.js 16 + Tailwind</p>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Backend</p>
                <p className="text-green-400">✅ Firebase Auth + Firestore</p>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Deployment</p>
                <p className="text-yellow-400">🚧 In Development</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
