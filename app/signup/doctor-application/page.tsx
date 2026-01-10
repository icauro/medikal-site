"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DOCTOR_SPECIALTIES, DoctorSpecialty } from '@/lib/types';

export default function DoctorApplicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    medicalLicenseNumber: '',
    licenseIssuingAuthority: '',
    licenseExpirationDate: '',
    specialization: '' as DoctorSpecialty | '',
    yearsOfExperience: '',
    medicalSchool: '',
    graduationYear: '',
    currentClinic: '',
    clinicAddress: '',
    position: '',
    reasonForVerification: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit an application');
      return;
    }

    // Validation
    if (!formData.fullName || !formData.medicalLicenseNumber || !formData.specialization) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 [APPLICATION] Submitting doctor verification request');

      // Create verification request
      const verificationRef = await addDoc(collection(db, 'verification_requests'), {
        doctorId: user.uid,
        doctorEmail: user.email,
        doctorName: user.displayName || formData.fullName,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        medicalLicenseNumber: formData.medicalLicenseNumber,
        licenseIssuingAuthority: formData.licenseIssuingAuthority,
        licenseExpirationDate: formData.licenseExpirationDate,
        specialization: formData.specialization,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        medicalSchool: formData.medicalSchool,
        graduationYear: parseInt(formData.graduationYear) || new Date().getFullYear(),
        currentClinic: formData.currentClinic,
        clinicAddress: formData.clinicAddress,
        position: formData.position,
        reasonForVerification: formData.reasonForVerification,
        status: 'waiting',
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ [APPLICATION] Verification request created:', verificationRef.id);

      // Update user profile with doctor info and status
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        accountStatus: 'pending_approval',
        doctorInfo: {
          specialization: formData.specialization,
          licenseNumber: formData.medicalLicenseNumber,
          verified: false,
          verificationRequestId: verificationRef.id,
          experience: parseInt(formData.yearsOfExperience) || 0,
        },
        updatedAt: new Date(),
      });

      console.log('✅ [APPLICATION] User profile updated, redirecting to pending page');
      window.location.href = '/doctor/pending-approval';
    } catch (err) {
      console.error('🚫 [APPLICATION] Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-zinc-900 rounded-lg shadow-md p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold mb-2 text-white">Doctor Verification Application</h1>
          <p className="text-zinc-400 mb-6">
            Please provide your professional credentials for verification. Your account will be activated once our admin team reviews and approves your application.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Professional Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Medical License Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="medicalLicenseNumber"
                    value={formData.medicalLicenseNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    License Issuing Authority <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseIssuingAuthority"
                    value={formData.licenseIssuingAuthority}
                    onChange={handleChange}
                    required
                    placeholder="e.g., State Medical Board"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    License Expiration Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="licenseExpirationDate"
                    value={formData.licenseExpirationDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Specialization <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Specialization</option>
                    {DOCTOR_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Years of Experience <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    required
                    min="0"
                    max="60"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Education</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Medical School <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="medicalSchool"
                    value={formData.medicalSchool}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Graduation Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    required
                    min="1950"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Employment */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Current Employment</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Current Clinic/Hospital</label>
                  <input
                    type="text"
                    name="currentClinic"
                    value={formData.currentClinic}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Position/Title</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="e.g., Senior Consultant"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Clinic Address</label>
                  <input
                    type="text"
                    name="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Reason for Verification */}
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-300">
                Why do you want to join our platform? <span className="text-red-400">*</span>
              </label>
              <textarea
                name="reasonForVerification"
                value={formData.reasonForVerification}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-500"
                placeholder="Please describe your motivation for joining and how you plan to use the platform..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-800 text-white transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
