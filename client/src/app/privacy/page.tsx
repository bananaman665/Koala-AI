export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Privacy Policy</h1>

        <p className="text-gray-600 dark:text-gray-400 mb-12 text-lg">
          Last Updated: February 15, 2026
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Koala.ai ("Company", "we", "our", or "us") operates the Koala.ai mobile application and website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            We use your data to provide and improve the Service. By using Koala.ai, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Types of Data Collected</h2>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.1 Personal Data</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li><strong>Account Information:</strong> Email address, name, password (hashed)</li>
            <li><strong>Profile Data:</strong> School/university, major, classes</li>
            <li><strong>Authentication Data:</strong> User ID, authentication tokens</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.2 Lecture and Study Data</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li><strong>Audio Recordings:</strong> Lecture recordings you choose to record</li>
            <li><strong>Transcriptions:</strong> AI-generated transcriptions of lectures</li>
            <li><strong>Notes:</strong> Study notes you create or import</li>
            <li><strong>Generated Content:</strong> AI-generated flashcards, quizzes, and summaries</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.3 Usage Data</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li><strong>Log Data:</strong> IP address, browser type, pages visited, time and date</li>
            <li><strong>Device Information:</strong> Device type, operating system, mobile network info</li>
            <li><strong>Analytics:</strong> Which features you use, how long you use the app</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.4 Data You Explicitly Provide</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>Text input (lecture notes, study materials)</li>
            <li>Audio files from your device</li>
            <li>Any communications with our support team</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Data</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">We use collected data for:</p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>Providing and improving the Service</li>
            <li>Processing and analyzing your lecture recordings and notes</li>
            <li>Generating AI-powered study materials (flashcards, quizzes)</li>
            <li>Sending service updates and support communications</li>
            <li>Analyzing how the app is used to improve user experience</li>
            <li>Detecting and preventing fraud or abuse</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Recording and Data Responsibility</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-5 mb-6 rounded">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">Recording Disclaimer: You are responsible for ensuring you have permission to record lectures before uploading them to our service.</p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            When you upload lecture recordings to Koala.ai:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>We store and process the recording on secure servers</li>
            <li>We generate a transcription using AI services</li>
            <li>We use the transcription to generate flashcards and quizzes</li>
            <li>You can request deletion of recordings at any time</li>
            <li>You are responsible for ensuring the recording doesn't violate your institution's policies</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Security</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            We implement industry-standard security measures to protect your personal data:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>HTTPS encryption for all data in transit</li>
            <li>Database encryption for data at rest</li>
            <li>Secure authentication and session management</li>
            <li>Regular security updates and monitoring</li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Third-Party Services</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            We use third-party services that may collect and process your data:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li><strong>Supabase:</strong> Database and authentication services</li>
            <li><strong>Mistral AI:</strong> AI-powered content generation (flashcards, quizzes)</li>
            <li><strong>Vercel:</strong> Hosting and deployment services</li>
            <li><strong>Google Analytics:</strong> App usage analytics</li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Each service has its own privacy policy. We encourage you to review their policies to understand how they handle your data.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights and Choices</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Opt-out:</strong> Opt-out of non-essential communications</li>
            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            To exercise these rights, please contact us at privacy@koala.ai
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Data Retention</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            We retain your data as long as you maintain an active account. When you delete your account:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>Your profile information is deleted immediately</li>
            <li>Your recordings, notes, and generated content are deleted</li>
            <li>Some anonymized data may be retained for analytics purposes</li>
            <li>Legal obligations may require retention of certain data</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Intellectual Property and Recording Content</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Important: Lecture content (recordings and transcriptions) is the intellectual property of your professor and/or educational institution. We store this data on your behalf for your personal study use only. We do not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
            <li>Share your recordings with other users</li>
            <li>Use your recordings for commercial purposes</li>
            <li>Publish or redistribute your recordings</li>
            <li>Claim ownership of lecture content</li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            If a professor or institution requests deletion of a recording, we will comply upon verification of their request.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children's Privacy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Our Service is not intended for users under the age of 13. We do not knowingly collect personal data from children under 13. If we discover we have collected such data, we will delete it immediately.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Email: privacy@koala.ai
          </p>
        </section>
      </div>
    </div>
  )
}
