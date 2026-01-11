"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ClinicPendingApprovalPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile) {
      // If approved, redirect to profile
      if (userProfile.accountStatus === 'active') {
        console.log('✅ [PENDING] Clinic approved, redirecting to profile');
        router.push('/profile');
      }
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not a pending clinic
  if (!user || userProfile?.accountStatus !== 'pending_approval' || userProfile?.role !== 'clinic') {
    router.push('/');
    return null;
  }

  const personalData = userProfile.personalClinicData;

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
              <span>Our admin team is reviewing your clinic information</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We verify your business registration and contact details</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You'll receive an email notification once your account is approved</span>
            </li>
          </ul>
        </div>

        {personalData && (
          <div className="bg-zinc-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-white mb-3">Application Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-400">Clinic Name</p>
                <p className="font-medium text-white">{personalData.name}</p>
              </div>
              <div>
                <p className="text-zinc-400">Contact Person</p>
                <p className="font-medium text-white">{personalData.contactPerson}</p>
              </div>
              <div>
                <p className="text-zinc-400">Location</p>
                <p className="font-medium text-white">{personalData.city}, {personalData.country}</p>
              </div>
              <div>
                <p className="text-zinc-400">Phone</p>
                <p className="font-medium text-white">{personalData.phone}</p>
              </div>
            </div>

            {personalData.verificationNotes && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-300 mb-1">Notes from Admin:</p>
                <p className="text-sm text-blue-200">{personalData.verificationNotes}</p>
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
                Typical review time is 2-5 business days. We'll notify you by email as soon as we complete our review.
              </p>
            </div>
          </div>

          <a
            href="/support"
            className="block w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-750 text-white text-center transition font-semibold"
          >
            Need Help? Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
