"use client";

import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black pt-32 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-400 text-sm mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-zinc-400">Our commitment to your data protection</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy</h2>
            <p className="text-zinc-300 mb-4">
              Last updated: January 2026
            </p>
            <p className="text-zinc-300">
              We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">1. Data Collection</h3>
            <p className="text-zinc-300 mb-3">We collect the following types of information:</p>
            <ul className="list-disc ml-6 space-y-2 text-zinc-300">
              <li><strong>Account Information:</strong> Name, email address, and profile photo from your Google account</li>
              <li><strong>Medical Information:</strong> If applicable to your role (patient, doctor, facility, or agency)</li>
              <li><strong>Usage Data:</strong> How you interact with the platform, features used, and timestamps</li>
              <li><strong>Verification Documents:</strong> For healthcare professionals and facilities (credentials, licenses)</li>
              <li><strong>Communication Data:</strong> Messages, reviews, and support tickets you create</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">2. Data Usage</h3>
            <p className="text-zinc-300 mb-3">Your data is used to:</p>
            <ul className="list-disc ml-6 space-y-2 text-zinc-300">
              <li>Provide and improve our medical directory services</li>
              <li>Connect patients with qualified medical professionals</li>
              <li>Verify healthcare professional credentials</li>
              <li>Maintain service quality and prevent fraud</li>
              <li>Send important updates about your account and services</li>
              <li>Respond to support requests and inquiries</li>
              <li>Analyze platform usage for improvements</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">3. Data Protection & Security</h3>
            <ul className="list-disc ml-6 space-y-2 text-zinc-300">
              <li>Industry-standard encryption (SSL/TLS) for data in transit</li>
              <li>Secure storage using Firebase with data encryption at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Strict access controls limiting data access to authorized personnel only</li>
              <li>Medical information receives enhanced protection under HIPAA-aligned protocols</li>
              <li>No sale of personal information to third parties</li>
              <li>Minimal data sharing with trusted service providers</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">4. Your GDPR Rights</h3>
            <p className="text-zinc-300 mb-3">You have the right to:</p>
            <ul className="list-disc ml-6 space-y-2 text-zinc-300">
              <li><strong>Access:</strong> Request and receive a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request corrections to inaccurate information</li>
              <li><strong>Erasure:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your data in a portable, machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent to data processing at any time</li>
              <li><strong>Lodge Complaint:</strong> File a complaint with your local data protection authority</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">5. Data Retention</h3>
            <p className="text-zinc-300">
              We retain your personal data as long as your account is active. You can request data deletion at any time. Certain data may be retained for legal compliance, fraud prevention, or legitimate business purposes.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h3>
            <p className="text-zinc-300 mb-3">
              Our platform uses the following trusted third-party services:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-zinc-300">
              <li><strong>Google Authentication:</strong> For secure login and account creation</li>
              <li><strong>Firebase:</strong> For secure data storage and management</li>
              <li><strong>Email Service Provider:</strong> For transactional emails</li>
            </ul>
            <p className="text-zinc-300 mt-3">
              Each provider maintains their own privacy policies and security standards.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h3>
            <p className="text-zinc-300">
              This service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected data from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">8. Changes to Privacy Policy</h3>
            <p className="text-zinc-300">
              We may update this privacy policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">9. Contact Us</h3>
            <p className="text-zinc-300">
              If you have questions about our privacy practices or wish to exercise your rights, contact us at:
            </p>
            <p className="text-zinc-300 mt-2">
              <strong>Email:</strong> privacy@medikal.com<br />
              <strong>Response Time:</strong> 30 days
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
