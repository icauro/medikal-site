import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Doctor Not Found</h1>
        <p className="text-zinc-400 mb-8">
          The doctor you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/healthcare-personnel"
          className="bg-white text-black px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors inline-block"
        >
          Back to Doctors
        </Link>
      </div>
    </div>
  );
}
