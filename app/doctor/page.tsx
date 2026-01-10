"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";

const TABS = ["reviews", "info"] as const;
type TabKey = typeof TABS[number];

type Review = {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
};

export default function DoctorHomePage() {
  const { userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");

  const doctorInfo = userProfile?.doctorInfo;
  const aboutText = doctorInfo?.bio?.trim()
    ? doctorInfo.bio
    : "Add your professional bio to highlight your expertise and build trust with patients.";

  const reviews = useMemo<Review[]>(
    () => [
      {
        id: "placeholder-1",
        patientName: "Anonymous Patient",
        rating: 5,
        date: "Dec 12, 2025",
        comment:
          "Outstanding care from start to finish. Dr. provided thorough explanations and made the entire experience comfortable.",
      },
      {
        id: "placeholder-2",
        patientName: "Verified Review",
        rating: 4,
        date: "Nov 4, 2025",
        comment:
          "Professional and attentive. Looking forward to future visits once more availability opens up.",
      },
    ],
    []
  );

  if (loading) {
    return (
      <ProtectedRoute requiredRole="doctor">
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-zinc-400">Loading your doctor profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
              {activeTab === "info" ? (
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
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Patient Reviews</h3>
                    <p className="text-sm text-zinc-400 mb-6">
                      Reviews shown here help patients understand the quality of care you provide. Real patient reviews will appear once the review system is connected to Firestore.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-5 space-y-3"
                      >
                        <header className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">
                            {review.patientName}
                          </span>
                          <span className="text-yellow-400 font-semibold">
                            ★ {review.rating.toFixed(1)}
                          </span>
                        </header>
                        <p className="text-xs text-zinc-500">{review.date}</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {review.comment}
                        </p>
                      </article>
                    ))}
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
