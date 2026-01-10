"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

type TabKey = "info" | "reviews";

interface DoctorRecord {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  bio?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  clinicIds?: string[];
  links?: string[];
  images?: string[];
  experience?: number | null;
  procedureTags?: string[];
  googlePlaceId?: string | null;
}

export default function DoctorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!slug) {
      return;
    }

    const fetchDoctor = async () => {
      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, "doctors", slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDoctor({
            id: docSnap.id,
            name: data.name || "",
            slug: data.slug || slug,
            specialty: data.specialty || "",
            bio: data.bio ?? null,
            image: data.image ?? null,
            rating:
              typeof data.rating === "number"
                ? data.rating
                : data.rating
                ? Number(data.rating)
                : null,
            reviewCount: data.reviewCount ?? null,
            clinicIds: Array.isArray(data.clinicIds) ? data.clinicIds : [],
            links: Array.isArray(data.links) ? data.links : [],
            images: Array.isArray(data.images) ? data.images : [],
            experience:
              typeof data.experience === "number"
                ? data.experience
                : data.experience
                ? Number(data.experience)
                : null,
            procedureTags: Array.isArray(data.procedureTags)
              ? data.procedureTags
              : [],
            googleReviewsEmbedUrl: data.googleReviewsEmbedUrl ?? null,
          });
          return;
        }

        const doctorsRef = collection(db, "doctors");
        const slugQuery = query(
          doctorsRef,
          where("slug", "==", slug),
          limit(1)
        );
        const slugSnapshot = await getDocs(slugQuery);

        if (slugSnapshot.empty) {
          setDoctor(null);
          setError("not-found");
          return;
        }

        const match = slugSnapshot.docs[0];
        const matchData = match.data();
        setDoctor({
          id: match.id,
          name: matchData.name || "",
          slug: matchData.slug || slug,
          specialty: matchData.specialty || "",
          bio: matchData.bio ?? null,
          image: matchData.image ?? null,
          rating:
            typeof matchData.rating === "number"
              ? matchData.rating
              : matchData.rating
              ? Number(matchData.rating)
              : null,
          reviewCount: matchData.reviewCount ?? null,
          clinicIds: Array.isArray(matchData.clinicIds) ? matchData.clinicIds : [],
          links: Array.isArray(matchData.links) ? matchData.links : [],
          images: Array.isArray(matchData.images) ? matchData.images : [],
          experience:
            typeof matchData.experience === "number"
              ? matchData.experience
              : matchData.experience
              ? Number(matchData.experience)
              : null,
          procedureTags: Array.isArray(matchData.procedureTags)
            ? matchData.procedureTags
            : [],
          googleReviewsEmbedUrl: matchData.googleReviewsEmbedUrl ?? null,
        });
      } catch (err) {
        console.error("Error loading doctor profile", err);
        setError("unknown");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [slug]);


  const googleMapsEmbedUrl = useMemo(() => {
    if (!doctor?.googlePlaceId) return null;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${doctor.googlePlaceId}`;
  }, [doctor?.googlePlaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-zinc-400">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (error === "not-found") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Doctor Not Found</h1>
          <p className="text-zinc-400 mb-8">
            The doctor you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/doctors"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors inline-block"
          >
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-zinc-400">
            We couldn&apos;t load this doctor profile. Please try again later.
          </p>
          <Link
            href="/doctors"
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors inline-block"
          >
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  const displayName = doctor.name?.trim() || "Doctor";
  const aboutText = doctor.bio?.trim()
    ? doctor.bio.trim()
    : "This doctor has not added a biography yet.";
  const nameInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/doctors" className="hover:text-white transition-colors">
            ← Back to Doctors
          </Link>
        </div>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-72 flex justify-center lg:justify-start">
              {doctor.image ? (
                <Image
                  src={doctor.image}
                  alt={displayName}
                  width={288}
                  height={288}
                  className="rounded-2xl border border-zinc-800 object-cover"
                />
              ) : (
                <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-5xl font-semibold">
                  {nameInitial}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {displayName}
                </h1>
                <p className="text-lg text-blue-300 mt-2">{doctor.specialty}</p>
                {typeof doctor.rating === "number" && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-yellow-400 text-lg font-semibold">
                      ★ {doctor.rating.toFixed(1)}
                    </span>
                    {typeof doctor.reviewCount === "number" && (
                      <span className="text-sm text-zinc-400">
                        {doctor.reviewCount} review{doctor.reviewCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-zinc-300 leading-relaxed">{aboutText}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                    Experience
                  </p>
                  <p className="text-white font-medium">
                    {typeof doctor.experience === "number"
                      ? `${doctor.experience} years`
                      : "Information pending"}
                  </p>
                </div>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                    Clinics
                  </p>
                  <p className="text-white font-medium">
                    {doctor.clinicIds && doctor.clinicIds.length > 0
                      ? `${doctor.clinicIds.length} linked`
                      : "Not yet listed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl">
          <div className="flex border-b border-zinc-800">
            {["reviews", "info"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as TabKey)}
                className={`flex-1 px-4 md:px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-400 hover:text-white border-b-2 border-transparent"
                }`}
              >
                {tab === "info" ? "Info" : "Reviews"}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "reviews" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Google Maps Location</h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    View the clinic's location on Google Maps. The map below uses the Google Place ID provided by the doctor.
                  </p>
                </div>
                {googleMapsEmbedUrl ? (
                  <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                    <div className="aspect-[16/9]">
                      <iframe
                        src={googleMapsEmbedUrl}
                        title="Google Maps Location"
                        className="h-full w-full"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800/40 border border-dashed border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 space-y-3">
                    <p>
                      No Google Maps location embedded yet. The doctor has not provided a Google Place ID.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Find your Place ID at <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                        Procedure Tags
                      </p>
                      <p className="text-white font-medium">
                        {doctor.procedureTags && doctor.procedureTags.length > 0
                          ? doctor.procedureTags.join(", ")
                          : "Procedures coming soon"}
                      </p>
                    </div>
                    <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                        Helpful Links
                      </p>
                      <div className="space-y-1 text-white font-medium">
                        {doctor.links && doctor.links.length > 0 ? (
                          doctor.links.map((link, index) => (
                            <a
                              key={`${link}-${index}`}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-300 hover:text-blue-200 break-words text-sm"
                            >
                              {link}
                            </a>
                          ))
                        ) : (
                          <span>Links will appear once provided</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                        Gallery
                      </p>
                      {doctor.images && doctor.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {doctor.images.map((imageUrl, index) => (
                            <div
                              key={`${imageUrl}-${index}`}
                              className="aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-800"
                            >
                              <Image
                                src={imageUrl}
                                alt={`Gallery image ${index + 1}`}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white font-medium">
                          Gallery updates pending
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
