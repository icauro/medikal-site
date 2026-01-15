"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AgencyApplicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    registrationNumber: '',
    establishedYear: '',
    website: '',
    description: '',
    servicesOffered: '',
    focusCountries: '',
    languages: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit');
      return;
    }

    // Validation
    if (!formData.name || !formData.contactPerson || !formData.phone || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 [AGENCY_DATA] Submitting personal agency data');

      const servicesArray = formData.servicesOffered
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const countriesArray = formData.focusCountries
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const languagesArray = formData.languages
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Update user profile with personalAgencyData
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        accountStatus: 'active',
        personalAgencyData: {
          name: formData.name,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          registrationNumber: formData.registrationNumber || undefined,
          establishedYear: parseInt(formData.establishedYear) || undefined,
          website: formData.website || undefined,
          description: formData.description || undefined,
          servicesOffered: servicesArray.length > 0 ? servicesArray : undefined,
          focusCountries: countriesArray.length > 0 ? countriesArray : undefined,
          languages: languagesArray.length > 0 ? languagesArray : undefined,
          verified: false,
          logoUrl: user.photoURL || undefined,
        },
        updatedAt: new Date(),
      });

      console.log('✅ [AGENCY_DATA] Personal agency data saved, redirecting to profile');
      window.location.href = '/profile';
    } catch (err) {
      console.error('🚫 [AGENCY_DATA] Error saving personal data:', err);
      setError('Failed to save agency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-zinc-900 rounded-lg shadow-md p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold mb-2 text-white">Agency Information</h1>
          <p className="text-zinc-400 mb-6">
            Please provide your medical tourism agency information. Your account will be activated once our admin team reviews and approves your profile.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Agency Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Contact Person <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Location</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Business Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Established Year</label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Services & Specialization */}
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-700 text-white">Services & Specialization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Services Offered (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="servicesOffered"
                    value={formData.servicesOffered}
                    onChange={handleChange}
                    placeholder="e.g., Travel coordination, Accommodation, Translation"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Focus Countries (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="focusCountries"
                    value={formData.focusCountries}
                    onChange={handleChange}
                    placeholder="e.g., Turkey, South Korea, Thailand"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-300">
                    Languages Supported (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="e.g., English, Turkish, Arabic"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-300">
                Agency Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500"
                placeholder="Brief description of your agency, services, and experience..."
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
                    : 'bg-purple-600 text-white hover:bg-purple-700'
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
