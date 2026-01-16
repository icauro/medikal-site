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
type ReviewTabKey = "site-reviews" | "google-reviews";

interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  doctorId: string;
  doctorName: string;
  categories: string[];
  rating: number;
  experienceText: string;
  createdAt: any;
  status: string;
}

interface DoctorRecord {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  bio?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  medicalFacilityIds?: string[];
  links?: string[];
  images?: string[];
  experience?: number | null;
  procedureTags?: string[];
  googlePlaceId?: string | null;
  personalHealthcarePersonnelDataId?: string | null;
}

export default function DoctorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTabKey>("site-reviews");
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!slug) {
      return;
    }

    const fetchDoctor = async () => {
      setLoading(true);
      setError(null);

      try {
        const personnelRef = collection(db, "open_healthcare_personnel_data");
        const slugQuery = query(
          personnelRef,
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
          medicalFacilityIds: Array.isArray(matchData.medicalFacilityIds) ? matchData.medicalFacilityIds : [],
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
          personalHealthcarePersonnelDataId: matchData.personalHealthcarePersonnelDataId ?? null,
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

  // Fetch reviews for this doctor
  useEffect(() => {
    if (!doctor?.id) {
      return;
    }

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        console.log('Fetching reviews for doctor:', doctor.id);
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("doctorId", "==", doctor.id),
          where("status", "==", "published")
        );

        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];

        console.log('Fetched reviews:', reviewsData.length);
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [doctor?.id]);


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

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

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
              {doctor.image && doctor.personalHealthcarePersonnelDataId ? (
                <Image
                  src={doctor.image}
                  alt={displayName}
                  width={288}
                  height={288}
                  className="rounded-2xl border border-zinc-800 object-cover w-72 h-72 shadow-2xl"
                />
              ) : (
                <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 flex flex-col items-center justify-center">
                  <span className="text-9xl opacity-10">👤</span>
                  {!doctor.personalHealthcarePersonnelDataId && (
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mt-4 tracking-[0.2em]">Listing Only</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {displayName}
                </h1>
                <p className="text-lg text-blue-300 mt-2">{doctor.specialty}</p>
                {averageRating !== null && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-yellow-400 text-lg font-semibold">
                      ★ {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {reviews.length} review{reviews.length === 1 ? "" : "s"}
                    </span>
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
                    Medical Facilities
                  </p>
                  <p className="text-white font-medium">
                    {doctor.medicalFacilityIds && doctor.medicalFacilityIds.length > 0
                      ? `${doctor.medicalFacilityIds.length} linked`
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
                {/* Review Sub-tabs */}
                <div className="flex border-b border-zinc-800">
                  {[
                    { key: "site-reviews", label: "Site Reviews" },
                    { key: "google-reviews", label: "Google Reviews" }
                  ].map((subTab) => (
                    <button
                      key={subTab.key}
                      type="button"
                      onClick={() => setActiveReviewTab(subTab.key as ReviewTabKey)}
                      className={`flex-1 px-4 md:px-6 py-3 text-sm font-semibold transition-colors ${
                        activeReviewTab === subTab.key
                          ? "text-white border-b-2 border-white"
                          : "text-zinc-400 hover:text-white border-b-2 border-transparent"
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* Site Reviews Tab */}
                {activeReviewTab === "site-reviews" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Patient Reviews</h3>
                      <p className="text-sm text-zinc-400 mb-6">
                        Reviews from patients who have visited this doctor through our platform.
                      </p>
                    </div>

                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-6">
                            <div className="animate-pulse space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="h-4 bg-zinc-700 rounded w-32"></div>
                                <div className="h-4 bg-zinc-700 rounded w-16"></div>
                              </div>
                              <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                              <div className="space-y-2">
                                <div className="h-3 bg-zinc-700 rounded w-full"></div>
                                <div className="h-3 bg-zinc-700 rounded w-4/5"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {/* Review Summary */}
                        <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-zinc-400">
                              {reviews.length} review{reviews.length === 1 ? '' : 's'}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-lg">★</span>
                              <span className="text-white font-semibold">
                                {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)}
                              </span>
                              <span className="text-zinc-400 text-sm">average</span>
                            </div>
                          </div>
                        </div>

                        {/* Individual Reviews */}
                        {reviews.map((review) => (
                          <div key={review.id} className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white font-semibold">
                                  {review.userDisplayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{review.userDisplayName}</div>
                                  <div className="text-sm text-zinc-400">
                                    {review.createdAt?.toDate ?
                                      review.createdAt.toDate().toLocaleDateString() :
                                      new Date().toLocaleDateString()
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-zinc-600'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            {review.categories.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {review.categories.map((category) => (
                                  <span
                                    key={category}
                                    className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full border border-blue-500/20"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-zinc-300 leading-relaxed">{review.experienceText}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-zinc-800/40 border border-dashed border-zinc-700 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-zinc-300 mb-2">No reviews yet</p>
                        <p className="text-sm text-zinc-500">
                          Be the first to share your experience with this doctor!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Reviews Tab */}
                {activeReviewTab === "google-reviews" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Google Maps Location & Reviews</h3>
                      <p className="text-sm text-zinc-400 mb-6">
                        View the medical facility&apos;s location on Google Maps and access Google reviews. The map below uses the Google Place ID provided by the doctor.
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
