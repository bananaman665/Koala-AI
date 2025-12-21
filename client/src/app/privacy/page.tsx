import Link from 'next/link'
import AppIcon from '@/components/AppIcon'

export default function PrivacyPage() {
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
            <Link href="/" className="text-blue-600 hover:text-blue-700 px-3 py-2">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: November 30, 2025</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information you provide directly to us when using Koala.ai:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Name and email address</li>
              <li>University affiliation and graduation year</li>
              <li>Password (encrypted and never stored in plain text)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Content You Create</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Audio recordings of lectures</li>
              <li>Transcripts generated from your recordings</li>
              <li>Notes, summaries, and annotations</li>
              <li>Course information and organizational data</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Recording duration and frequency</li>
              <li>Feature usage and interaction patterns</li>
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide and improve our transcription and note-taking services</li>
              <li>Process your audio recordings through OpenAI's Whisper API</li>
              <li>Generate AI-powered notes and summaries</li>
              <li>Maintain and optimize your account and storage</li>
              <li>Send important service updates and notifications</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We take data security seriously and implement industry-standard measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>All data is encrypted in transit using TLS/SSL</li>
              <li>Audio files are stored securely in Supabase storage with authenticated access</li>
              <li>Database records are encrypted at rest</li>
              <li>Access to your data is restricted to authorized personnel only</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services to provide our functionality:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Groq API</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your audio recordings are processed through Groq's Whisper API for transcription. Groq's data
              usage policy applies to this processing. Audio sent to Groq is not used to train their models.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Supabase</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Supabase for authentication, database, and file storage. Your data is stored in compliance 
              with their security and privacy standards.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-700 leading-relaxed">
              We may use analytics services to understand how users interact with our Service. This data is 
              aggregated and anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your data only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>With your explicit consent</li>
              <li>With service providers who help us operate the platform (under strict confidentiality agreements)</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, sale, or acquisition (with prior notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your recordings and notes</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Transfer your data to another service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, visit your account settings or contact us at{' '}
              <a href="mailto:andrewsahakian9@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
                andrewsahakian9@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. 
              When you delete your account, we will delete your personal data within 30 days, except where 
              we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Koala.ai is not intended for users under 13 years of age. We do not knowingly collect information 
              from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. 
              We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Keep you signed in</li>
              <li>Understand how you use our Service</li>
              <li>Improve performance and user experience</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes 
              by email or through a prominent notice in the Service. Your continued use after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:andrewsahakian9@gmail.com" className="text-blue-600 hover:text-blue-700">
                  andrewsahakian9@gmail.com
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Mail:</strong> Koala.ai Privacy Team, [Address]
              </p>
            </div>
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
