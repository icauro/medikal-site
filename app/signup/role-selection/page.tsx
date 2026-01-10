"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RoleSelectionPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🎭 [ROLE] Starting role update...', {
        selectedRole,
        userId: user.uid,
        currentProfile: userProfile
      });
      
      const userRef = doc(db, 'users', user.uid);
      
      if (selectedRole === 'patient') {
        // Complete patient signup - set to active immediately
        console.log('🎭 [ROLE] Updating Firestore for patient...');
        await updateDoc(userRef, {
          role: 'patient',
          accountStatus: 'active',
          patientInfo: {
            preferredLanguage: 'en',
          },
          updatedAt: new Date(),
        });

        console.log('✅ [ROLE] Patient account activated, refreshing profile...');
        
        // Refresh profile to get latest data
        await refreshUserProfile();
        
        console.log('✅ [ROLE] Profile refreshed, navigating to /profile');
        window.location.href = '/profile';
      } else {
        // Doctor needs to fill application
        console.log('🎭 [ROLE] Updating Firestore for doctor...');
        await updateDoc(userRef, {
          role: 'doctor',
          accountStatus: 'pending_application',
          updatedAt: new Date(),
        });

        console.log('✅ [ROLE] Doctor role set, refreshing profile...');
        
        // Refresh profile to get latest data
        await refreshUserProfile();
        
        console.log('✅ [ROLE] Profile refreshed, navigating to /signup/doctor-application');
        window.location.href = '/signup/doctor-application';
      }
    } catch (err) {
      console.error('🚫 [ROLE] Error updating role:', err);
      setError(`Failed to update account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-xl max-w-4xl w-full p-8 border border-zinc-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your Account Type
          </h1>
          <p className="text-zinc-400">
            Select how you'll be using our platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Patient Option */}
          <div
            onClick={() => setSelectedRole('patient')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedRole === 'patient'
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-zinc-700 hover:border-blue-400 hover:shadow-md hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'patient' ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
              }`}>
                {selectedRole === 'patient' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">I'm a Patient</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Looking for qualified medical professionals for plastic surgery or dermatology services
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Search verified doctors
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Request treatment plans
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Read reviews & ratings
              </li>
            </ul>
          </div>

          {/* Doctor Option */}
          <div
            onClick={() => setSelectedRole('doctor')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedRole === 'doctor'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                : 'border-zinc-700 hover:border-indigo-400 hover:shadow-md hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'doctor' ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'
              }`}>
                {selectedRole === 'doctor' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">I'm a Doctor</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Medical professional specializing in plastic surgery or dermatology
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Build your profile
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Connect with patients
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified credentials
              </li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300">
                <strong>Note:</strong> Doctor accounts require credential verification before activation
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            selectedRole && !loading
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
          }`}
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
