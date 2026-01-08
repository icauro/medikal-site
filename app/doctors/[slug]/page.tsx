import { notFound } from "next/navigation";

// Type definition for Doctor
interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio?: string;
  image?: string;
  clinic?: string;
  rating?: number;
}

// This function fetches a single doctor by slug
// TODO: Replace this with your actual API/database call
async function getDoctor(slug: string): Promise<Doctor | null> {
  // Example: Fetch from your API
  // const res = await fetch(`https://your-api.com/api/doctors/${slug}`);
  // if (!res.ok) return null;
  // return res.json();

  // For now, using mock data - replace with real API call
  const mockDoctors: Doctor[] = [
    {
      id: "1",
      slug: "dr-ahmet-yilmaz",
      name: "Dr. Ahmet Yılmaz",
      specialty: "Cardiologist",
      bio: "Experienced cardiologist with 15 years of practice.",
      image: "/doctor-placeholder.jpg",
      clinic: "Medical Center",
      rating: 4.8,
    },
  ];

  return mockDoctors.find((doctor) => doctor.slug === slug) || null;
}

// This function is optional - use it if you want to pre-generate pages at build time
// If you don't know all doctors beforehand, you can omit this
// Next.js will generate pages on-demand (server-side)
export async function generateStaticParams() {
  // If you have an API that returns all doctor slugs:
  // const doctors = await fetch('https://your-api.com/api/doctors').then(res => res.json());
  // return doctors.map((doctor: Doctor) => ({ slug: doctor.slug }));

  // For dynamic/on-demand generation, return empty array or omit this function
  return [];
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);

  // If doctor not found, show 404 page
  if (!doctor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <a
            href="/doctors"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Doctors
          </a>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {doctor.image && (
              <div className="flex-shrink-0">
                <div className="w-48 h-48 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">Image</span>
                </div>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4 text-white">
                {doctor.name}
              </h1>
              <p className="text-xl text-zinc-400 mb-4">{doctor.specialty}</p>
              
              {doctor.rating && (
                <div className="mb-4">
                  <span className="text-yellow-400">★ {doctor.rating}</span>
                </div>
              )}

              {doctor.clinic && (
                <p className="text-zinc-300 mb-4">Clinic: {doctor.clinic}</p>
              )}

              {doctor.bio && (
                <div className="mt-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-zinc-300 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews section - to be implemented later */}
        <div className="mt-8 bg-zinc-900 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
          <p className="text-zinc-400">Reviews will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
