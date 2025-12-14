import Link from 'next/link'
import AppIcon from '@/components/AppIcon'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <AppIcon size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: November 30, 2025</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Koala.ai ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Koala.ai provides AI-powered lecture recording, transcription, and note-taking services for educational purposes. 
              Our Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Audio recording capabilities through your web browser</li>
              <li>AI-powered transcription using Groq Whisper technology</li>
              <li>Automated note generation and organization</li>
              <li>Cloud storage for your recordings and notes</li>
              <li>Analytics and study tracking features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">When using our Service, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Obtain proper permission before recording any lectures or conversations</li>
              <li>Comply with your institution's recording policies</li>
              <li>Use the Service only for lawful educational purposes</li>
              <li>Respect copyright and intellectual property rights</li>
              <li>Not share your account credentials with others</li>
              <li>Not use the Service to record private or confidential information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Recording Consent</h2>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for ensuring you have the legal right and necessary permissions to record 
              any audio content. Recording laws vary by jurisdiction, and you must comply with all applicable local, 
              state, and federal laws regarding recording consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of all content you upload or create through the Service. However, you grant 
              Koala.ai a limited license to process, store, and display your content to provide the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The Koala.ai platform, including its design, features, and technology, is protected by copyright 
              and other intellectual property rights owned by Koala.ai.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment and Subscriptions</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are provided on a case-by-case basis within 14 days of purchase</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Usage and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We process your recordings using Groq's Whisper API for transcription. Please review our{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                Privacy Policy
              </Link>{' '}
              for details on how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Limitations</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Storage limits apply based on your subscription plan</li>
              <li>Transcription accuracy may vary based on audio quality</li>
              <li>We do not guarantee 100% uptime or availability</li>
              <li>AI-generated notes should be reviewed for accuracy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms of Service, 
              engage in fraudulent activity, or use the Service in a manner that could harm other users or the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Koala.ai is provided "as is" without warranties of any kind. We are not liable for any damages 
              arising from your use of the Service, including but not limited to lost data, missed recordings, 
              or transcription errors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. We will notify you of any material changes 
              by email or through the Service. Your continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:{' '}
              <a href="mailto:andrewsahakian9@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
                andrewsahakian9@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
