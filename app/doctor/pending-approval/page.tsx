"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PendingApprovalPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [verificationRequest, setVerificationRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    const fetchVerificationRequest = async () => {
      if (!user || !userProfile?.doctorInfo?.verificationRequestId) {
        setLoadingRequest(false);
        return;
      }

      try {
        const requestDoc = await getDoc(
          doc(db, 'verification_requests', userProfile.doctorInfo.verificationRequestId)
        );
        
        if (requestDoc.exists()) {
          setVerificationRequest({ id: requestDoc.id, ...requestDoc.data() });
          
          // If approved, redirect to profile
          if (requestDoc.data().status === 'approved') {
            console.log('✅ [PENDING] Application approved, redirecting to profile');
            router.push('/profile');
          }
        }
      } catch (error) {
        console.error('🚫 [PENDING] Error fetching verification request:', error);
      } finally {
        setLoadingRequest(false);
      }
    };

    if (!loading) {
      fetchVerificationRequest();
    }
  }, [user, userProfile, loading, router]);

  if (loading || loadingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not a pending doctor
  if (!user || userProfile?.accountStatus !== 'pending_approval' || userProfile?.role !== 'doctor') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          {/* Pending Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Application Under Review
          </h1>
          <p className="text-zinc-400">
            Thank you for applying to join our medical directory
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-yellow-300 mb-2">What's Next?</h2>
          <ul className="space-y-2 text-sm text-yellow-200">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Our admin team is reviewing your credentials and professional information</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We verify your medical license and education details</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You'll receive an email notification once your account is approved</span>
            </li>
          </ul>
        </div>

        {verificationRequest && (
          <div className="bg-zinc-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">Application Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-400">Submitted</p>
                <p className="font-medium">
                  {verificationRequest.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Status</p>
                <p className="font-medium capitalize">
                  {verificationRequest.status || 'Waiting'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Specialization</p>
                <p className="font-medium">{verificationRequest.specialization || 'N/A'}</p>
              </div>
              <div>
                <p className="text-zinc-400">License Number</p>
                <p className="font-medium">{verificationRequest.medicalLicenseNumber || 'N/A'}</p>
              </div>
            </div>

            {verificationRequest.status === 'denied' && verificationRequest.reviewNotes && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm font-semibold text-red-300 mb-1">Denial Reason:</p>
                <p className="text-sm text-red-200">{verificationRequest.reviewNotes}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-blue-300 mb-1">Review Time</p>
              <p className="text-blue-200">
                Verification typically takes 2-5 business days. We'll notify you via email at <strong>{user?.email}</strong> once the review is complete.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
            <svg className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-white mb-1">Need Help?</p>
              <p className="text-zinc-300">
                If you have questions about your application, please contact our support team.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => router.push('/support')}
            className="w-full px-6 py-3 bg-gray-100 text-zinc-300 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
