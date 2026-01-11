"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where, setDoc } from "firebase/firestore";
import { UserProfile, OpenDoctorData, PersonalDoctorData, DoctorSpecialty } from "@/lib/types";

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState<UserProfile[]>([]);
  const [openDoctorData, setOpenDoctorData] = useState<OpenDoctorData[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null);
  const [selectedOpenData, setSelectedOpenData] = useState<string>("");
  const [createNew, setCreateNew] = useState(false);
  const [newOpenName, setNewOpenName] = useState("");
  const [newOpenSpecialty, setNewOpenSpecialty] = useState<DoctorSpecialty | "">("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  useEffect(() => {
    fetchPendingDoctors();
    fetchOpenDoctorData();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("accountStatus", "==", "pending_approval"), where("role", "==", "doctor"));
      const querySnapshot = await getDocs(q);
      
      const doctors: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        doctors.push({
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserProfile);
      });

      setPendingDoctors(doctors);
    } catch (error) {
      console.error("Error fetching pending doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenDoctorData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "open_doctor_data"));
      const data: OpenDoctorData[] = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
          updatedAt: docData.updatedAt?.toDate(),
        } as OpenDoctorData);
      });

      setOpenDoctorData(data);
    } catch (error) {
      console.error("Error fetching open doctor data:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoctor || !user) return;

    setProcessing(true);

    try {
      let openDataId = selectedOpenData;

      // If creating new openDoctorData
      if (createNew && newOpenName && newOpenSpecialty) {
        const newOpenDoc = doc(collection(db, "open_doctor_data"));
        const newOpenData: OpenDoctorData = {
          id: newOpenDoc.id,
          name: newOpenName,
          specialty: newOpenSpecialty,
          personalDoctorDataId: selectedDoctor.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.uid,
        };

        await setDoc(newOpenDoc, newOpenData);
        openDataId = newOpenDoc.id;
        console.log('✅ [ADMIN] Created new openDoctorData:', openDataId);
      } else if (selectedOpenData) {
        // Update existing openDoctorData with link
        const openDataRef = doc(db, "open_doctor_data", selectedOpenData);
        await updateDoc(openDataRef, {
          personalDoctorDataId: selectedDoctor.uid,
          updatedAt: new Date(),
        });
        console.log('✅ [ADMIN] Updated existing openDoctorData:', selectedOpenData);
      } else {
        alert("Please select or create openDoctorData to link");
        setProcessing(false);
        return;
      }

      // Update user profile with verification and link
      const userRef = doc(db, "users", selectedDoctor.uid);
      await updateDoc(userRef, {
        accountStatus: 'active',
        'personalDoctorData.verified': true,
        'personalDoctorData.openDoctorDataId': openDataId,
        'personalDoctorData.verifiedAt': new Date(),
        'personalDoctorData.verifiedBy': user.uid,
        'personalDoctorData.verificationNotes': verificationNotes || "",
        updatedAt: new Date(),
      });

      console.log('✅ [ADMIN] Doctor approved and linked');
      alert("Doctor approved successfully!");
      
      // Refresh lists
      await fetchPendingDoctors();
      await fetchOpenDoctorData();
      setSelectedDoctor(null);
      setSelectedOpenData("");
      setCreateNew(false);
      setNewOpenName("");
      setNewOpenSpecialty("");
      setVerificationNotes("");
    } catch (error) {
      console.error("Error approving doctor:", error);
      alert("Failed to approve doctor. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedDoctor || !user) return;

    const reason = prompt("Reason for denial:");
    if (!reason) return;

    setProcessing(true);

    try {
      const userRef = doc(db, "users", selectedDoctor.uid);
      await updateDoc(userRef, {
        accountStatus: 'pending_personal_data', // Back to data entry
        'personalDoctorData.verificationNotes': reason,
        updatedAt: new Date(),
      });

      console.log('❌ [ADMIN] Doctor verification denied');
      alert("Doctor verification denied.");
      
      await fetchPendingDoctors();
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error denying doctor:", error);
      alert("Failed to deny doctor. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  const getPersonalData = (doctor: UserProfile): PersonalDoctorData | null => {
    return doctor.personalDoctorData || null;
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Doctor Verifications</h1>

          {loading ? (
            <div className="text-zinc-400">Loading pending doctors...</div>
          ) : pendingDoctors.length === 0 ? (
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">No pending doctor verifications.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Pending Doctors List */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Approvals ({pendingDoctors.length})</h2>
                <div className="space-y-3">
                  {pendingDoctors.map((doctor) => {
                    const personalData = getPersonalData(doctor);
                    return (
                      <div
                        key={doctor.uid}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`bg-zinc-900 p-4 rounded-lg border cursor-pointer transition ${
                          selectedDoctor?.uid === doctor.uid
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-semibold">{personalData?.name || doctor.displayName}</div>
                        <div className="text-sm text-zinc-400">{doctor.email}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {personalData?.specialization || 'No specialty'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Doctor Details & Approval */}
              <div>
                {selectedDoctor ? (
                  <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4">Doctor Details</h2>
                    
                    {(() => {
                      const personalData = getPersonalData(selectedDoctor);
                      if (!personalData) {
                        return <div className="text-red-400">No personal doctor data found!</div>;
                      }

                      return (
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-zinc-400">Name</div>
                            <div className="font-semibold">{personalData.name}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">Email</div>
                            <div>{selectedDoctor.email}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">Specialty</div>
                            <div>{personalData.specialization}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">License Number</div>
                            <div>{personalData.licenseNumber}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">License Authority</div>
                            <div>{personalData.licenseIssuingAuthority}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">License Expiration</div>
                            <div>{personalData.licenseExpirationDate}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">Experience</div>
                            <div>{personalData.yearsOfExperience} years</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">Medical School</div>
                            <div>{personalData.medicalSchool}</div>
                          </div>

                          <div>
                            <div className="text-sm text-zinc-400">Graduation Year</div>
                            <div>{personalData.graduationYear}</div>
                          </div>

                          {personalData.currentClinic && (
                            <div>
                              <div className="text-sm text-zinc-400">Current Clinic</div>
                              <div>{personalData.currentClinic}</div>
                            </div>
                          )}

                          {personalData.position && (
                            <div>
                              <div className="text-sm text-zinc-400">Position</div>
                              <div>{personalData.position}</div>
                            </div>
                          )}

                          {personalData.motivation && (
                            <div>
                              <div className="text-sm text-zinc-400">Motivation</div>
                              <div className="text-sm">{personalData.motivation}</div>
                            </div>
                          )}

                          {personalData.bio && (
                            <div>
                              <div className="text-sm text-zinc-400">Bio</div>
                              <div className="text-sm">{personalData.bio}</div>
                            </div>
                          )}

                          <hr className="border-zinc-700" />

                          {/* Link to OpenDoctorData */}
                          <div>
                            <h3 className="font-semibold mb-2">Link to Open Doctor Data</h3>
                            
                            <div className="mb-3">
                              <label className="flex items-center space-x-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={createNew}
                                  onChange={(e) => setCreateNew(e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-sm">Create new Open Doctor Data</span>
                              </label>

                              {createNew ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Doctor Name"
                                    value={newOpenName}
                                    onChange={(e) => setNewOpenName(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                  />
                                  <select
                                    value={newOpenSpecialty}
                                    onChange={(e) => setNewOpenSpecialty(e.target.value as DoctorSpecialty)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                  >
                                    <option value="">Select Specialty</option>
                                    <option value="Plastic, Reconstructive and Aesthetic Surgery">
                                      Plastic, Reconstructive and Aesthetic Surgery
                                    </option>
                                    <option value="Dermatology">Dermatology</option>
                                  </select>
                                </div>
                              ) : (
                                <select
                                  value={selectedOpenData}
                                  onChange={(e) => setSelectedOpenData(e.target.value)}
                                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                >
                                  <option value="">Select existing Open Doctor Data</option>
                                  {openDoctorData
                                    .filter((od) => !od.personalDoctorDataId) // Only show unlinked ones
                                    .map((od) => (
                                      <option key={od.id} value={od.id}>
                                        {od.name} - {od.specialty}
                                      </option>
                                    ))}
                                </select>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Verification Notes</label>
                            <textarea
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                              placeholder="Optional notes about the verification..."
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleApprove}
                              disabled={processing || (!createNew && !selectedOpenData)}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                            >
                              {processing ? 'Processing...' : 'Approve & Link'}
                            </button>
                            <button
                              onClick={handleDeny}
                              disabled={processing}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 text-center text-zinc-400">
                    Select a doctor to review
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
