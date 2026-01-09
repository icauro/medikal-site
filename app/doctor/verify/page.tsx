"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { DoctorVerificationRequest } from "@/lib/types";
import Link from "next/link";

export default function DoctorVerificationPage() {
  const { user, userProfile } = useAuth();
  const [existingRequest, setExistingRequest] = useState<DoctorVerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    medicalLicenseNumber: "",
    licenseIssuingAuthority: "",
    licenseExpirationDate: "",
    specialization: "",
    yearsOfExperience: "",
    medicalSchool: "",
    graduationYear: "",
    currentClinic: "",
    clinicAddress: "",
    position: "",
    reasonForVerification: "",
    certifications: [] as string[],
    references: [] as string[],
  });

  // Check if user already has a verification request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "verification_requests"),
          where("doctorId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const requestDoc = querySnapshot.docs[0];
          const requestData = {
            id: requestDoc.id,
            ...requestDoc.data(),
            submittedAt: requestDoc.data().submittedAt?.toDate(),
            reviewedAt: requestDoc.data().reviewedAt?.toDate(),
          } as DoctorVerificationRequest;
          setExistingRequest(requestData);
        }
      } catch (err) {
        console.error("Error checking existing verification request:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingRequest();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (field: 'certifications' | 'references', value: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'certifications' | 'references') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayItem = (field: 'certifications' | 'references', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setSubmitting(true);
    setError(null);

    try {
      const verificationData: Omit<DoctorVerificationRequest, 'id'> = {
        doctorId: user.uid,
        doctorEmail: userProfile.email,
        doctorName: userProfile.displayName,

        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        medicalLicenseNumber: formData.medicalLicenseNumber,
        licenseIssuingAuthority: formData.licenseIssuingAuthority,
        licenseExpirationDate: formData.licenseExpirationDate,
        specialization: formData.specialization,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        medicalSchool: formData.medicalSchool,
        graduationYear: parseInt(formData.graduationYear) || 0,
        currentClinic: formData.currentClinic || undefined,
        clinicAddress: formData.clinicAddress || undefined,
        position: formData.position,
        reasonForVerification: formData.reasonForVerification,
        certifications: formData.certifications.filter(cert => cert.trim() !== ""),
        references: formData.references.filter(ref => ref.trim() !== ""),

        status: 'waiting',
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "verification_requests"), {
        ...verificationData,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Refresh the page to show the existing request
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit verification request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-900/20';
      case 'denied': return 'text-red-400 bg-red-900/20';
      case 'waiting': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      case 'waiting': return 'Waiting for Review';
      default: return status;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="doctor">
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/profile"
              className="text-zinc-400 hover:text-white mb-4 inline-block"
            >
              ← Back to Profile
            </Link>
            <h1 className="text-4xl font-bold">Doctor Verification</h1>
            <p className="text-zinc-400 mt-2">
              Submit your credentials to get verified as a medical professional
            </p>
          </div>

          {existingRequest ? (
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Verification Request Status</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(existingRequest.status)}`}>
                  {getStatusText(existingRequest.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-zinc-500 text-sm block mb-2">Submitted On</label>
                  <p className="text-white">
                    {existingRequest.submittedAt?.toLocaleDateString()}
                  </p>
                </div>
                {existingRequest.reviewedAt && (
                  <div>
                    <label className="text-zinc-500 text-sm block mb-2">Reviewed On</label>
                    <p className="text-white">
                      {existingRequest.reviewedAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {existingRequest.reviewNotes && (
                <div className="mb-6">
                  <label className="text-zinc-500 text-sm block mb-2">Review Notes</label>
                  <p className="text-white bg-zinc-800 p-4 rounded-lg">
                    {existingRequest.reviewNotes}
                  </p>
                </div>
              )}

              <div className="text-sm text-zinc-500">
                You can only submit one verification request. If you need to make changes,
                please contact an administrator.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 space-y-6">
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Personal Information</h3>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-zinc-300 mb-2">
                    Full Legal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-zinc-300 mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-300 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Professional Information */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Professional Information</h3>
                </div>

                <div>
                  <label htmlFor="medicalLicenseNumber" className="block text-sm font-medium text-zinc-300 mb-2">
                    Medical License Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="medicalLicenseNumber"
                    name="medicalLicenseNumber"
                    required
                    value={formData.medicalLicenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="MD123456789"
                  />
                </div>

                <div>
                  <label htmlFor="licenseIssuingAuthority" className="block text-sm font-medium text-zinc-300 mb-2">
                    License Issuing Authority <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="licenseIssuingAuthority"
                    name="licenseIssuingAuthority"
                    required
                    value={formData.licenseIssuingAuthority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="State Medical Board"
                  />
                </div>

                <div>
                  <label htmlFor="licenseExpirationDate" className="block text-sm font-medium text-zinc-300 mb-2">
                    License Expiration Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    id="licenseExpirationDate"
                    name="licenseExpirationDate"
                    required
                    value={formData.licenseExpirationDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-zinc-300 mb-2">
                    Specialization <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Cardiology"
                  />
                </div>

                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-zinc-300 mb-2">
                    Years of Experience <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    required
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="10"
                  />
                </div>

                {/* Education */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Education</h3>
                </div>

                <div>
                  <label htmlFor="medicalSchool" className="block text-sm font-medium text-zinc-300 mb-2">
                    Medical School <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="medicalSchool"
                    name="medicalSchool"
                    required
                    value={formData.medicalSchool}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Harvard Medical School"
                  />
                </div>

                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-zinc-300 mb-2">
                    Graduation Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="graduationYear"
                    name="graduationYear"
                    required
                    min="1950"
                    max={new Date().getFullYear()}
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="2014"
                  />
                </div>

                {/* Employment */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Current Employment</h3>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-zinc-300 mb-2">
                    Position/Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Chief Cardiologist"
                  />
                </div>

                <div>
                  <label htmlFor="currentClinic" className="block text-sm font-medium text-zinc-300 mb-2">
                    Current Clinic/Hospital
                  </label>
                  <input
                    type="text"
                    id="currentClinic"
                    name="currentClinic"
                    value={formData.currentClinic}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="General Hospital"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="clinicAddress" className="block text-sm font-medium text-zinc-300 mb-2">
                    Clinic/Hospital Address
                  </label>
                  <input
                    type="text"
                    id="clinicAddress"
                    name="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="123 Medical Center Dr, City, State 12345"
                  />
                </div>

                {/* Certifications */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Certifications</h3>
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => handleArrayInputChange('certifications', e.target.value, index)}
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="Board Certification in Cardiology"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('certifications', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('certifications')}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                  >
                    + Add Certification
                  </button>
                </div>

                {/* References */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-white">Professional References</h3>
                  {formData.references.map((ref, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ref}
                        onChange={(e) => handleArrayInputChange('references', e.target.value, index)}
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="Dr. Jane Smith, Chief of Staff, contact@email.com"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('references', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('references')}
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                  >
                    + Add Reference
                  </button>
                </div>

                {/* Reason for Verification */}
                <div className="md:col-span-2">
                  <label htmlFor="reasonForVerification" className="block text-sm font-medium text-zinc-300 mb-2">
                    Reason for Verification <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="reasonForVerification"
                    name="reasonForVerification"
                    required
                    rows={4}
                    value={formData.reasonForVerification}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                    placeholder="Please explain why you are seeking verification and how this will benefit your patients..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Verification Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}