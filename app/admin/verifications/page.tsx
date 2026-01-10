"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { DoctorVerificationRequest, VerificationStatus, DOCTOR_SPECIALTIES } from "@/lib/types";
import Link from "next/link";

const emptyVerificationForm = {
  doctorId: "",
  doctorEmail: "",
  doctorName: "",
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
  certifications: "",
  references: "",
};

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DoctorVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DoctorVerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({ ...emptyVerificationForm });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...emptyVerificationForm });
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [deleteProcessingId, setDeleteProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      setReviewNotes(selectedRequest.reviewNotes ?? "");
      setIsEditingDetails(false);
      setDetailsError(null);
      setEditFormData(mapRequestToForm(selectedRequest));
    }
  }, [selectedRequest]);

  const fetchVerificationRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "verification_requests"));
      const requestsData: DoctorVerificationRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DoctorVerificationRequest);
      });

      // Sort by submission date (newest first)
      requestsData.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setNewRequestData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseList = (raw: string) =>
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const mapRequestToForm = (request: DoctorVerificationRequest) => ({
    doctorId: request.doctorId ?? "",
    doctorEmail: request.doctorEmail ?? "",
    doctorName: request.doctorName ?? "",
    fullName: request.fullName ?? "",
    dateOfBirth: request.dateOfBirth ?? "",
    phoneNumber: request.phoneNumber ?? "",
    medicalLicenseNumber: request.medicalLicenseNumber ?? "",
    licenseIssuingAuthority: request.licenseIssuingAuthority ?? "",
    licenseExpirationDate: request.licenseExpirationDate ?? "",
    specialization: request.specialization ?? "",
    yearsOfExperience: request.yearsOfExperience?.toString() ?? "",
    medicalSchool: request.medicalSchool ?? "",
    graduationYear: request.graduationYear?.toString() ?? "",
    currentClinic: request.currentClinic ?? "",
    clinicAddress: request.clinicAddress ?? "",
    position: request.position ?? "",
    reasonForVerification: request.reasonForVerification ?? "",
    certifications: request.certifications?.join(", ") ?? "",
    references: request.references?.join(", ") ?? "",
  });

  const handleCreateRequest = async () => {
    if (!user) {
      setCreateError("You must be authenticated to create requests.");
      return;
    }

    setCreateError(null);

    if (
      !newRequestData.doctorId ||
      !newRequestData.doctorEmail ||
      !newRequestData.fullName ||
      !newRequestData.medicalLicenseNumber ||
      !newRequestData.specialization ||
      !newRequestData.reasonForVerification
    ) {
      setCreateError("Doctor ID, email, name, license, specialization, and reason are required.");
      return;
    }

    setCreateLoading(true);

    try {
      const certifications = parseList(newRequestData.certifications);
      const references = parseList(newRequestData.references);

      const payload: Record<string, unknown> = {
        doctorId: newRequestData.doctorId,
        doctorEmail: newRequestData.doctorEmail,
        doctorName: newRequestData.doctorName || newRequestData.fullName,
        fullName: newRequestData.fullName,
        dateOfBirth: newRequestData.dateOfBirth,
        phoneNumber: newRequestData.phoneNumber,
        medicalLicenseNumber: newRequestData.medicalLicenseNumber,
        licenseIssuingAuthority: newRequestData.licenseIssuingAuthority,
        licenseExpirationDate: newRequestData.licenseExpirationDate,
        specialization: newRequestData.specialization,
        yearsOfExperience: parseInt(newRequestData.yearsOfExperience, 10) || 0,
        medicalSchool: newRequestData.medicalSchool,
        graduationYear:
          parseInt(newRequestData.graduationYear, 10) || new Date().getFullYear(),
        currentClinic: newRequestData.currentClinic || null,
        clinicAddress: newRequestData.clinicAddress || null,
        position: newRequestData.position,
        reasonForVerification: newRequestData.reasonForVerification,
        status: "waiting",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (certifications.length > 0) {
        payload.certifications = certifications;
      }

      if (references.length > 0) {
        payload.references = references;
      }

      await addDoc(collection(db, "verification_requests"), payload);

      setNewRequestData({ ...emptyVerificationForm });
      setCreateModalOpen(false);
      await fetchVerificationRequests();
    } catch (error) {
      console.error("Error creating verification request:", error);
      setCreateError("Failed to create verification request.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveRequestDetails = async () => {
    if (!user || !selectedRequest) {
      return;
    }

    setDetailsError(null);

    if (
      !editFormData.fullName ||
      !editFormData.medicalLicenseNumber ||
      !editFormData.specialization
    ) {
      setDetailsError("Name, license, and specialization cannot be empty.");
      return;
    }

    setDetailsSaving(true);

    try {
      const certifications = parseList(editFormData.certifications);
      const references = parseList(editFormData.references);

      const requestRef = doc(db, "verification_requests", selectedRequest.id!);
      const payload: Record<string, unknown> = {
        doctorId: editFormData.doctorId,
        doctorEmail: editFormData.doctorEmail,
        doctorName: editFormData.doctorName || editFormData.fullName,
        fullName: editFormData.fullName,
        dateOfBirth: editFormData.dateOfBirth,
        phoneNumber: editFormData.phoneNumber,
        medicalLicenseNumber: editFormData.medicalLicenseNumber,
        licenseIssuingAuthority: editFormData.licenseIssuingAuthority,
        licenseExpirationDate: editFormData.licenseExpirationDate,
        specialization: editFormData.specialization,
        yearsOfExperience: parseInt(editFormData.yearsOfExperience, 10) || 0,
        medicalSchool: editFormData.medicalSchool,
        graduationYear:
          parseInt(editFormData.graduationYear, 10) || new Date().getFullYear(),
        currentClinic: editFormData.currentClinic || null,
        clinicAddress: editFormData.clinicAddress || null,
        position: editFormData.position,
        reasonForVerification: editFormData.reasonForVerification,
        updatedAt: serverTimestamp(),
      };

      payload.certifications = certifications;
      payload.references = references;

      await updateDoc(requestRef, payload);

      const updatedSnap = await getDoc(requestRef);
      if (updatedSnap.exists()) {
        const data = updatedSnap.data();
        const normalized = {
          id: updatedSnap.id,
          ...data,
          submittedAt: data.submittedAt?.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DoctorVerificationRequest;
        setSelectedRequest(normalized);
        setEditFormData(mapRequestToForm(normalized));
      }

      await fetchVerificationRequests();
      setIsEditingDetails(false);
    } catch (error) {
      console.error("Error updating verification request:", error);
      setDetailsError("Failed to update verification request.");
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this verification request?"
    );

    if (!confirmDelete) {
      return;
    }

    setDeleteProcessingId(requestId);

    try {
      await deleteDoc(doc(db, "verification_requests", requestId));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
        setReviewNotes("");
        setIsEditingDetails(false);
        setDetailsError(null);
      }

      await fetchVerificationRequests();
    } catch (error) {
      console.error("Error deleting verification request:", error);
    } finally {
      setDeleteProcessingId(null);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: VerificationStatus, notes: string = "") => {
    if (!user) return;

    setProcessing(requestId);
    try {
      const requestRef = doc(db, "verification_requests", requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewNotes: notes,
        updatedAt: serverTimestamp(),
      });

      // Refresh the requests
      await fetchVerificationRequests();
      setSelectedRequest(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error updating verification status:", error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-900/20';
      case 'denied': return 'text-red-400 bg-red-900/20';
      case 'waiting': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      case 'waiting': return 'In Review';
      default: return status;
    }
  };

  const getStatusCounts = () => {
    return {
      waiting: requests.filter(r => r.status === 'waiting').length,
      approved: requests.filter(r => r.status === 'approved').length,
      denied: requests.filter(r => r.status === 'denied').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">Loading verification requests...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="text-zinc-400 hover:text-white mb-4 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Doctor Verification Requests</h1>
            <p className="text-zinc-400 mt-2">
              Review and manage doctor verification applications
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setCreateModalOpen(true);
                  setCreateError(null);
                  setNewRequestData({ ...emptyVerificationForm });
                }}
                className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Create Verification Request
              </button>
              <span className="text-sm text-zinc-500">
                Add requests on behalf of doctors when needed.
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-400">{statusCounts.waiting}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-400">{statusCounts.approved}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Denied</p>
                  <p className="text-3xl font-bold text-red-400">{statusCounts.denied}</p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">Verification Requests</h2>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-400">No verification requests found</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {requests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{request.doctorName}</h3>
                        <p className="text-zinc-400">{request.doctorEmail}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Specialization:</span>
                        <p className="text-white">{request.specialization}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">License:</span>
                        <p className="text-white">{request.medicalLicenseNumber}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Submitted:</span>
                        <p className="text-white">{request.submittedAt?.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Modal */}
          {createModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">New Verification Request</h2>
                  <button
                    onClick={() => {
                      setCreateModalOpen(false);
                      setCreateError(null);
                      setNewRequestData({ ...emptyVerificationForm });
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {createError && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                      {createError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Doctor UID<span className="text-red-400"> *</span></label>
                      <input
                        type="text"
                        name="doctorId"
                        value={newRequestData.doctorId}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Doctor Email<span className="text-red-400"> *</span></label>
                      <input
                        type="email"
                        name="doctorEmail"
                        value={newRequestData.doctorEmail}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Doctor Display Name</label>
                      <input
                        type="text"
                        name="doctorName"
                        value={newRequestData.doctorName}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Full Legal Name<span className="text-red-400"> *</span></label>
                      <input
                        type="text"
                        name="fullName"
                        value={newRequestData.fullName}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={newRequestData.dateOfBirth}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={newRequestData.phoneNumber}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Specialization<span className="text-red-400"> *</span></label>
                      <select
                        name="specialization"
                        value={newRequestData.specialization}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      >
                        <option value="">Select specialization</option>
                        {DOCTOR_SPECIALTIES.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Medical License Number<span className="text-red-400"> *</span></label>
                      <input
                        type="text"
                        name="medicalLicenseNumber"
                        value={newRequestData.medicalLicenseNumber}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">License Issuing Authority</label>
                      <input
                        type="text"
                        name="licenseIssuingAuthority"
                        value={newRequestData.licenseIssuingAuthority}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">License Expiration Date</label>
                      <input
                        type="date"
                        name="licenseExpirationDate"
                        value={newRequestData.licenseExpirationDate}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Years of Experience</label>
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={newRequestData.yearsOfExperience}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                        min="0"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Medical School</label>
                      <input
                        type="text"
                        name="medicalSchool"
                        value={newRequestData.medicalSchool}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Graduation Year</label>
                      <input
                        type="number"
                        name="graduationYear"
                        value={newRequestData.graduationYear}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                        min="1950"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Current Clinic</label>
                      <input
                        type="text"
                        name="currentClinic"
                        value={newRequestData.currentClinic}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Position/Title</label>
                      <input
                        type="text"
                        name="position"
                        value={newRequestData.position}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Clinic Address</label>
                      <input
                        type="text"
                        name="clinicAddress"
                        value={newRequestData.clinicAddress}
                        onChange={handleCreateInputChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-300">
                      Reason for Verification<span className="text-red-400"> *</span>
                    </label>
                    <textarea
                      name="reasonForVerification"
                      value={newRequestData.reasonForVerification}
                      onChange={handleCreateInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      placeholder="Provide context for this verification request"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">Certifications (comma separated)</label>
                      <textarea
                        name="certifications"
                        value={newRequestData.certifications}
                        onChange={handleCreateInputChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-300">References (comma separated)</label>
                      <textarea
                        name="references"
                        value={newRequestData.references}
                        onChange={handleCreateInputChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setCreateModalOpen(false);
                        setCreateError(null);
                        setNewRequestData({ ...emptyVerificationForm });
                      }}
                      className="px-5 py-2 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateRequest}
                      disabled={createLoading}
                      className="px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createLoading ? "Creating..." : "Create Request"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Review Verification Request</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isEditingDetails) {
                          setEditFormData(mapRequestToForm(selectedRequest));
                          setDetailsError(null);
                        }
                        setIsEditingDetails((prev) => !prev);
                      }}
                      className="px-4 py-2 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
                    >
                      {isEditingDetails ? "Cancel Editing" : "Edit Details"}
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(selectedRequest.id!)}
                      disabled={deleteProcessingId === selectedRequest.id}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteProcessingId === selectedRequest.id ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setReviewNotes("");
                        setIsEditingDetails(false);
                        setDetailsError(null);
                      }}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Doctor Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Doctor Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-500 text-sm">Full Name</label>
                          <p className="text-white">{selectedRequest.fullName}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Email</label>
                          <p className="text-white">{selectedRequest.doctorEmail}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Phone</label>
                          <p className="text-white">{selectedRequest.phoneNumber}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Date of Birth</label>
                          <p className="text-white">{new Date(selectedRequest.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-500 text-sm">Specialization</label>
                          <p className="text-white">{selectedRequest.specialization}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Years of Experience</label>
                          <p className="text-white">{selectedRequest.yearsOfExperience}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Medical License</label>
                          <p className="text-white">{selectedRequest.medicalLicenseNumber}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">License Authority</label>
                          <p className="text-white">{selectedRequest.licenseIssuingAuthority}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Education and Employment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Education</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-500 text-sm">Medical School</label>
                          <p className="text-white">{selectedRequest.medicalSchool}</p>
                        </div>
                        <div>
                          <label className="text-zinc-500 text-sm">Graduation Year</label>
                          <p className="text-white">{selectedRequest.graduationYear}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Employment</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-zinc-500 text-sm">Position</label>
                          <p className="text-white">{selectedRequest.position}</p>
                        </div>
                        {selectedRequest.currentClinic && (
                          <div>
                            <label className="text-zinc-500 text-sm">Current Clinic</label>
                            <p className="text-white">{selectedRequest.currentClinic}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Certifications and References */}
                  {selectedRequest.certifications && selectedRequest.certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Certifications</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRequest.certifications.map((cert, index) => (
                          <li key={index} className="text-white">{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRequest.references && selectedRequest.references.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">References</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRequest.references.map((ref, index) => (
                          <li key={index} className="text-white">{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reason for Verification */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Reason for Verification</h3>
                    <p className="text-white bg-zinc-800 p-4 rounded-lg">
                      {selectedRequest.reasonForVerification}
                    </p>
                  </div>

                  {isEditingDetails && (
                    <div className="border-t border-zinc-800 pt-6 space-y-6">
                      <h3 className="text-lg font-semibold">Modify Request Details</h3>

                      {detailsError && (
                        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                          {detailsError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Doctor UID</label>
                          <input
                            type="text"
                            name="doctorId"
                            value={editFormData.doctorId}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Doctor Email</label>
                          <input
                            type="email"
                            name="doctorEmail"
                            value={editFormData.doctorEmail}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Doctor Display Name</label>
                          <input
                            type="text"
                            name="doctorName"
                            value={editFormData.doctorName}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Full Legal Name<span className="text-red-400"> *</span></label>
                          <input
                            type="text"
                            name="fullName"
                            value={editFormData.fullName}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={editFormData.dateOfBirth}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={editFormData.phoneNumber}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Specialization<span className="text-red-400"> *</span></label>
                          <select
                            name="specialization"
                            value={editFormData.specialization}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          >
                            <option value="">Select specialization</option>
                            {DOCTOR_SPECIALTIES.map((spec) => (
                              <option key={spec} value={spec}>
                                {spec}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Medical License Number<span className="text-red-400"> *</span></label>
                          <input
                            type="text"
                            name="medicalLicenseNumber"
                            value={editFormData.medicalLicenseNumber}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">License Issuing Authority</label>
                          <input
                            type="text"
                            name="licenseIssuingAuthority"
                            value={editFormData.licenseIssuingAuthority}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">License Expiration Date</label>
                          <input
                            type="date"
                            name="licenseExpirationDate"
                            value={editFormData.licenseExpirationDate}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Years of Experience</label>
                          <input
                            type="number"
                            name="yearsOfExperience"
                            value={editFormData.yearsOfExperience}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                            min="0"
                            max="60"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Medical School</label>
                          <input
                            type="text"
                            name="medicalSchool"
                            value={editFormData.medicalSchool}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Graduation Year</label>
                          <input
                            type="number"
                            name="graduationYear"
                            value={editFormData.graduationYear}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                            min="1950"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Current Clinic</label>
                          <input
                            type="text"
                            name="currentClinic"
                            value={editFormData.currentClinic}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Position/Title</label>
                          <input
                            type="text"
                            name="position"
                            value={editFormData.position}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Clinic Address</label>
                          <input
                            type="text"
                            name="clinicAddress"
                            value={editFormData.clinicAddress}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Reason for Verification</label>
                        <textarea
                          name="reasonForVerification"
                          value={editFormData.reasonForVerification}
                          onChange={handleEditInputChange}
                          rows={3}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">Certifications (comma separated)</label>
                          <textarea
                            name="certifications"
                            value={editFormData.certifications}
                            onChange={handleEditInputChange}
                            rows={2}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">References (comma separated)</label>
                          <textarea
                            name="references"
                            value={editFormData.references}
                            onChange={handleEditInputChange}
                            rows={2}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setEditFormData(mapRequestToForm(selectedRequest));
                            setDetailsError(null);
                            setIsEditingDetails(false);
                          }}
                          className="px-5 py-2 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveRequestDetails}
                          disabled={detailsSaving}
                          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {detailsSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  {selectedRequest.status === 'waiting' && (
                    <div className="border-t border-zinc-800 pt-6">
                      <h3 className="text-lg font-semibold mb-4">Review Decision</h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Review Notes (Optional)
                        </label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                          placeholder="Add any notes about your decision..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => handleStatusUpdate(selectedRequest.id!, 'approved', reviewNotes)}
                          disabled={processing === selectedRequest.id}
                          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === selectedRequest.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedRequest.id!, 'denied', reviewNotes)}
                          disabled={processing === selectedRequest.id}
                          className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === selectedRequest.id ? "Processing..." : "Deny"}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status !== 'waiting' && (
                    <div className="border-t border-zinc-800 pt-6 space-y-4">
                      <div className="bg-zinc-800 p-4 rounded-lg">
                        <p className="text-white">
                          <span className="text-zinc-500">Status:</span> {getStatusText(selectedRequest.status)}
                        </p>
                        {selectedRequest.reviewedAt && (
                          <p className="text-white mt-2">
                            <span className="text-zinc-500">Reviewed on:</span> {selectedRequest.reviewedAt.toLocaleDateString()}
                          </p>
                        )}
                        {selectedRequest.reviewNotes && !reviewNotes && (
                          <div className="mt-4">
                            <span className="text-zinc-500">Review Notes:</span>
                            <p className="text-white mt-1">{selectedRequest.reviewNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Update Notes (Optional)
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                            placeholder="Describe why this status is changing..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {selectedRequest.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.id!, 'approved', reviewNotes)}
                              disabled={processing === selectedRequest.id}
                              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === selectedRequest.id ? "Processing..." : "Mark as Approved"}
                            </button>
                          )}
                          {selectedRequest.status !== 'waiting' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.id!, 'waiting', reviewNotes)}
                              disabled={processing === selectedRequest.id}
                              className="px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === selectedRequest.id ? "Processing..." : "Move to In Review"}
                            </button>
                          )}
                          {selectedRequest.status !== 'denied' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.id!, 'denied', reviewNotes)}
                              disabled={processing === selectedRequest.id}
                              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === selectedRequest.id ? "Processing..." : "Mark as Denied"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}