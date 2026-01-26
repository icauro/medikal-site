"use client";

import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-zinc-400">Our terms and conditions for using the platform</p>
        </div>

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
      </div>
    </div>
  );
}
