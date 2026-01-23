"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');
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
          <h1 className="text-4xl font-bold text-white mb-2">Privacy & Legal</h1>
          <p className="text-zinc-400">Our commitment to your data protection and terms of service</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-4 px-2 font-semibold transition ${
              activeTab === 'privacy'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-4 px-2 font-semibold transition ${
              activeTab === 'terms'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Privacy Policy Tab */}
        {activeTab === 'privacy' && (
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
        )}

        {/* Terms of Service Tab */}
        {activeTab === 'terms' && (
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Terms of Service</h2>
              <p className="text-zinc-300 mb-4">
                Last updated: January 2026
              </p>
              <p className="text-zinc-300">
                These Terms of Service govern your use of the Medikal platform. By accessing and using this service, you accept and agree to be bound by these terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Service Description</h3>
              <p className="text-zinc-300">
                Medikal is a digital healthcare platform that connects patients with verified medical professionals (doctors, healthcare personnel, medical facilities, and medical tourism agencies). The platform facilitates communication and coordination of medical services.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. User Accounts</h3>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>You must provide accurate, complete, and truthful information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are liable for all activities conducted through your account</li>
                <li>You may not impersonate others or create multiple accounts</li>
                <li>We reserve the right to suspend or terminate accounts for violations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. User Conduct</h3>
              <p className="text-zinc-300 mb-3">You agree not to:</p>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>Use the platform for illegal or fraudulent purposes</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Share false medical information or medical advice</li>
                <li>Attempt to hack, breach, or damage the platform</li>
                <li>Spam or send unsolicited communications</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Medical Disclaimer</h3>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>This platform is for informational and appointment scheduling purposes only</li>
                <li>It is NOT a substitute for professional medical advice, diagnosis, or treatment</li>
                <li>Always consult with qualified healthcare providers for medical advice</li>
                <li>We are not responsible for medical outcomes or decisions made based on platform information</li>
                <li>Emergency medical situations require immediate contact with emergency services</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Healthcare Professional Requirements</h3>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>Must submit valid credentials and licenses for verification</li>
                <li>Must practice in compliance with local medical laws and regulations</li>
                <li>Providing false credentials will result in immediate account termination</li>
                <li>Verification does not guarantee medical competence or quality of care</li>
                <li>Must maintain professional standards and ethics</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Patient Responsibilities</h3>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>Provide accurate medical history and current health information</li>
                <li>Disclose relevant medical conditions to healthcare providers</li>
                <li>Follow professional medical advice and treatment recommendations</li>
                <li>Report any adverse effects or concerns to your healthcare provider</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h3>
              <p className="text-zinc-300 mb-3">
                All content, features, and functionality on the Medikal platform are owned by Medikal, including but not limited to text, graphics, logos, and software. You may not reproduce, distribute, or transmit any content without permission.
              </p>
              <p className="text-zinc-300">
                User-generated content (reviews, messages) remains your property, but you grant Medikal a license to use and display this content on the platform.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h3>
              <p className="text-zinc-300 mb-3">
                To the maximum extent permitted by law, Medikal shall not be liable for:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>Indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, revenue, or data</li>
                <li>Medical outcomes or healthcare decisions</li>
                <li>Third-party actions or conduct</li>
                <li>Service interruptions or unavailability</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">9. Indemnification</h3>
              <p className="text-zinc-300">
                You agree to indemnify and hold harmless Medikal and its officers, employees, and agents from any claims, damages, or costs arising from your use of the platform, your violation of these terms, or your violation of applicable laws.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">10. Dispute Resolution</h3>
              <p className="text-zinc-300 mb-3">
                Any disputes shall be resolved through:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-zinc-300">
                <li>Good faith negotiation between parties</li>
                <li>Mediation if negotiation fails</li>
                <li>Binding arbitration or litigation as a last resort</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">11. Modifications to Terms</h3>
              <p className="text-zinc-300">
                We reserve the right to modify these terms at any time. Continued use of the platform after modifications constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">12. Termination</h3>
              <p className="text-zinc-300">
                We may terminate or suspend your account and access to the platform at any time, without notice, for violations of these terms or for any reason at our discretion.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">13. Governing Law</h3>
              <p className="text-zinc-300">
                These terms are governed by applicable international laws and GDPR regulations. Disputes shall be subject to the jurisdiction of competent courts.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">14. Contact Us</h3>
              <p className="text-zinc-300">
                For questions about these Terms of Service, contact us at:
              </p>
              <p className="text-zinc-300 mt-2">
                <strong>Email:</strong> legal@medikal.com<br />
                <strong>Response Time:</strong> 30 days
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
