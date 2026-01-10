"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

const TABS = ["reviews", "info"] as const;
type TabKey = typeof TABS[number];

interface DoctorDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  googlePlaceId?: string | null;
}

export default function DoctorHomePage() {
  console.log('👨‍⚕️ [DOCTOR PAGE] DoctorHomePage component rendered');
  const { userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [directoryEntry, setDirectoryEntry] = useState<DoctorDirectoryEntry | null>(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const doctorInfo = userProfile?.doctorInfo;
  const aboutText = doctorInfo?.bio?.trim()
    ? doctorInfo.bio
    : "Add your professional bio to highlight your expertise and build trust with patients.";

  useEffect(() => {
    const fetchDirectoryEntry = async () => {
      if (!userProfile?.uid) {
        setDirectoryEntry(null);
        return;
      }

      setDirectoryLoading(true);
      try {
        const doctorsRef = collection(db, "doctors");
        const doctorQuery = query(
          doctorsRef,
          where("userId", "==", userProfile.uid),
          limit(1)
        );
        const snapshot = await getDocs(doctorQuery);

        if (snapshot.empty) {
          setDirectoryEntry(null);
          return;
        }

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setDirectoryEntry({
          id: docSnap.id,
          name: data.name || "",
          slug: data.slug || docSnap.id,
          googlePlaceId: data.googlePlaceId ?? null,
        });
      } catch (err) {
        console.error("Failed to load doctor directory entry", err);
        setDirectoryEntry(null);
      } finally {
        setDirectoryLoading(false);
      }
    };

    fetchDirectoryEntry();
  }, [userProfile?.uid]);

  const googleMapsEmbedUrl = useMemo(() => {
    if (!directoryEntry?.googlePlaceId) {
      console.warn('🗺️ [GOOGLE MAPS EMBED] No googlePlaceId found in directoryEntry:', directoryEntry);
      return null;
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('🗺️ [GOOGLE MAPS EMBED] No NEXT_PUBLIC_GOOGLE_MAPS_API_KEY found in environment variables.');
      return null;
    }
    const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${directoryEntry.googlePlaceId}`;
    console.log('🗺️ [GOOGLE MAPS EMBED] Embed URL generated:', url);
    return url;
  }, [directoryEntry?.googlePlaceId]);

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold">Doctor Dashboard</h1>
            <p className="text-zinc-400">Manage how patients see you in the directory.</p>
          </header>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-64 xl:w-72 flex justify-center lg:justify-start">
                {userProfile?.photoURL ? (
                  <Image
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || "Doctor profile photo"}
                    width={256}
                    height={256}
                    className="rounded-2xl border border-zinc-800 object-cover"
                  />
                ) : (
                  <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-5xl font-semibold">
                    {(userProfile?.displayName || "Dr").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {userProfile?.displayName || "Doctor"}
                  </h2>
                  {doctorInfo?.specialization && (
                    <p className="text-lg text-blue-300 mt-1">
                      {doctorInfo.specialization}
                    </p>
                  )}
                </div>

                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-zinc-300 leading-relaxed">{aboutText}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">License</p>
                    <p className="text-white font-medium">
                      {doctorInfo?.licenseNumber || "Pending"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Experience</p>
                    <p className="text-white font-medium">
                      {doctorInfo?.experience ? `${doctorInfo.experience} years` : "Update experience"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Verification Status</p>
                    <p className={doctorInfo?.verified ? "text-green-400" : "text-yellow-400"}>
                      {doctorInfo?.verified ? "Verified" : "Pending Approval"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Directory Visibility</p>
                    <p className="text-white font-medium">
                      {doctorInfo?.verified ? "Public" : "Hidden until verification"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl">
            <div className="flex border-b border-zinc-800">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
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
                      Embed your clinic's location using Google Maps. Enter your Google Place ID in your profile to display the map below.
                    </p>
                  </div>
                  {directoryLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
                    </div>
                  ) : googleMapsEmbedUrl ? (
                    <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                      <div className="aspect-[16/9]">
                        <iframe
                          src={googleMapsEmbedUrl}
                          title="Google Maps Location"
                          className="h-full w-full"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          onError={(e) => {
                            // Log error if Place ID exists but map fails to load
                            if (directoryEntry?.googlePlaceId) {
                              console.error('🗺️ [GOOGLE MAPS EMBED] Failed to load map for Place ID:', directoryEntry.googlePlaceId, e);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-800/40 border border-dashed border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 space-y-3">
                      <p>
                        No Google Maps location embedded yet. Add your Google Place ID to show your clinic's location here.
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
                          Clinic ID
                        </p>
                        <p className="text-white font-medium">
                          {doctorInfo?.clinicId || "Not linked"}
                        </p>
                      </div>
                      <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                          Procedure Tags
                        </p>
                        <p className="text-white font-medium">
                          {doctorInfo?.procedureTags?.length
                            ? doctorInfo.procedureTags.join(", ")
                            : "Add procedures you offer"}
                        </p>
                      </div>
                      <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                          Account Status
                        </p>
                        <p className="text-white font-medium">
                          {userProfile?.accountStatus || "Unknown"}
                        </p>
                      </div>
                      <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                          Contact Email
                        </p>
                        <p className="text-white font-medium break-words">
                          {userProfile?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Next Steps</h3>
                    <ul className="space-y-3 text-sm text-zinc-300">
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 text-green-400">•</span>
                        Add your clinic information so patients know where to find you.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 text-blue-400">•</span>
                        Keep your biography up to date to highlight your latest experience and certifications.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 text-yellow-400">•</span>
                        Encourage patients to leave reviews after appointments.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
