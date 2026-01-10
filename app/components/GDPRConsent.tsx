"use client";

import { useState } from 'react';

interface GDPRConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function GDPRConsent({ onAccept, onDecline }: GDPRConsentProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const canProceed = acceptTerms && acceptPrivacy;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Privacy & Terms</h2>
          
          <div className="space-y-4 mb-6">
            <div className="border rounded-lg p-4 bg-zinc-800 max-h-60 overflow-y-auto border-zinc-700">
              <h3 className="font-semibold mb-2 text-white">Privacy Policy</h3>
              <div className="text-sm text-zinc-300 space-y-2">
                <p>
                  We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information.
                </p>
                <p className="font-semibold">Data Collection:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Account information (name, email, profile photo from Google)</li>
                  <li>Medical information (if you're a patient or doctor)</li>
                  <li>Usage data and interactions with the platform</li>
                </ul>
                <p className="font-semibold">Data Usage:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Provide and improve our medical directory services</li>
                  <li>Connect patients with qualified medical professionals</li>
                  <li>Verify doctor credentials and maintain service quality</li>
                  <li>Send important updates about your account</li>
                </ul>
                <p className="font-semibold">Data Protection:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>We use industry-standard encryption and security measures</li>
                  <li>Your data is stored securely using Firebase services</li>
                  <li>We never sell your personal information to third parties</li>
                  <li>Medical information is handled with strict confidentiality</li>
                </ul>
                <p className="font-semibold">Your Rights (GDPR):</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Access your personal data at any time</li>
                  <li>Request corrections to your information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Export your data in a portable format</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-zinc-800 max-h-60 overflow-y-auto border-zinc-700">
              <h3 className="font-semibold mb-2 text-white">Terms of Service</h3>
              <div className="text-sm text-zinc-300 space-y-2">
                <p className="font-semibold">Service Description:</p>
                <p>
                  Our platform connects patients with verified medical professionals specializing in Plastic Surgery and Dermatology.
                </p>
                <p className="font-semibold">User Responsibilities:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the confidentiality of your account</li>
                  <li>Use the service in compliance with applicable laws</li>
                  <li>Respect the privacy and rights of other users</li>
                </ul>
                <p className="font-semibold">Medical Disclaimer:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>This platform is for informational purposes only</li>
                  <li>Not a substitute for professional medical advice</li>
                  <li>Always consult with qualified healthcare providers</li>
                  <li>We are not responsible for medical outcomes</li>
                </ul>
                <p className="font-semibold">Doctor Verification:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Doctors must submit valid credentials for verification</li>
                  <li>False information may result in account termination</li>
                  <li>Verification does not guarantee medical competence</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm text-zinc-300">
                I have read and agree to the <strong className="text-white">Terms of Service</strong>
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm text-zinc-300">
                I have read and agree to the <strong className="text-white">Privacy Policy</strong> and consent to the processing of my personal data as described
              </span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={!canProceed}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                canProceed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
