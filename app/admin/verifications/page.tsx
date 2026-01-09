"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { DoctorVerificationRequest, VerificationStatus } from "@/lib/types";
import Link from "next/link";

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DoctorVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DoctorVerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

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
      case 'waiting': return 'Waiting for Review';
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

          {/* Review Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Review Verification Request</h2>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setReviewNotes("");
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
                    <div className="border-t border-zinc-800 pt-6">
                      <h3 className="text-lg font-semibold mb-4">Review Status</h3>
                      <div className="bg-zinc-800 p-4 rounded-lg">
                        <p className="text-white">
                          <span className="text-zinc-500">Status:</span> {getStatusText(selectedRequest.status)}
                        </p>
                        {selectedRequest.reviewedAt && (
                          <p className="text-white mt-2">
                            <span className="text-zinc-500">Reviewed on:</span> {selectedRequest.reviewedAt.toLocaleDateString()}
                          </p>
                        )}
                        {selectedRequest.reviewNotes && (
                          <div className="mt-4">
                            <span className="text-zinc-500">Review Notes:</span>
                            <p className="text-white mt-1">{selectedRequest.reviewNotes}</p>
                          </div>
                        )}
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