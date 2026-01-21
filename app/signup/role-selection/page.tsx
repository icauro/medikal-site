"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';

export default function RoleSelectionPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
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
        userId: user.id,
        currentProfile: userProfile
      });
      
      // Update user role in Supabase
      const updates: any = {
        role: selectedRole,
        updated_at: new Date().toISOString()
      };

      if (selectedRole === 'patient') {
        updates.account_status = 'active';
      } else {
        updates.account_status = 'pending_personal_data';
      }
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;

      console.log(`✅ [ROLE] ${selectedRole} role set, refreshing profile...`);
      await refreshUserProfile();
      console.log('✅ [ROLE] Profile refreshed, navigating to /profile');
      window.location.href = '/profile';
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
            <h3 className="text-xl font-semibold mb-2 text-white">Patient</h3>
            <p className="text-zinc-400 text-sm">
              Search for doctors & request treatments
            </p>
          </div>

          {/* Healthcare Personnel Option */}
          <div
            onClick={() => setSelectedRole('healthcare_personnel')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedRole === 'healthcare_personnel'
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
                selectedRole === 'healthcare_personnel' ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'
              }`}>
                {selectedRole === 'healthcare_personnel' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Healthcare Personnel</h3>
            <p className="text-zinc-400 text-sm mb-2">
              Doctors & Patient Coordinators
            </p>
            <p className="text-xs text-yellow-300">Requires verification</p>
          </div>

          {/* Medical Facility Option */}
          <div
            onClick={() => setSelectedRole('medical_facility')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedRole === 'medical_facility'
                ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                : 'border-zinc-700 hover:border-green-400 hover:shadow-md hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'medical_facility' ? 'border-green-500 bg-green-500' : 'border-zinc-600'
              }`}>
                {selectedRole === 'medical_facility' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Medical Facility</h3>
            <p className="text-zinc-400 text-sm mb-2">
              Manage your medical facility, polylinic, or hospital
            </p>
            <p className="text-xs text-yellow-300">Requires verification</p>
          </div>

          {/* Agency Option */}
          <div
            onClick={() => setSelectedRole('agency')}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedRole === 'agency'
                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                : 'border-zinc-700 hover:border-purple-400 hover:shadow-md hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'agency' ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'
              }`}>
                {selectedRole === 'agency' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Agency</h3>
            <p className="text-zinc-400 text-sm mb-2">
              Medical tourism & patient coordination
            </p>
            <p className="text-xs text-yellow-300">Requires verification</p>
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
