import Link from "next/link";

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

// This function fetches all doctors
// TODO: Replace this with your actual API/database call
async function getDoctors(): Promise<Doctor[]> {
  // Example: Fetch from your API
  // const res = await fetch('https://your-api.com/api/doctors');
  // if (!res.ok) return [];
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
    {
      id: "2",
      slug: "dr-ayse-demir",
      name: "Dr. Ayşe Demir",
      specialty: "Dermatologist",
      bio: "Specialized in skin care and treatments.",
      image: "/doctor-placeholder.jpg",
      clinic: "Skin Care Clinic",
      rating: 4.9,
    },
  ];

  return mockDoctors;
}

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Doctors</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/doctors/${doctor.slug}`}
              className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block"
            >
              <div className="mb-4">
                <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">Image</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                {doctor.name}
              </h2>
              <p className="text-zinc-400 mb-2">{doctor.specialty}</p>
              {doctor.rating && (
                <p className="text-yellow-400">★ {doctor.rating}</p>
              )}
            </Link>
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">No doctors found</p>
          </div>
        )}
      </div>
    </div>
  );
}
