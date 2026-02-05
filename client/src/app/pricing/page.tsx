'use client'

import Link from 'next/link'
import AppIcon from '@/components/AppIcon'

export default function PricingPage() {
  const features = [
    'Unlimited recordings',
    'AI-powered transcription with Whisper',
    'Smart note generation with Llama 3.3',
    'Course and lecture organization',
    'Shared classes and collaboration',
    'Gamification (XP, levels, achievements)',
    'Study modes and flashcards',
    'Analytics dashboard',
    'Mobile app (iOS & Android)',
    'Email support',
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <AppIcon size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Koala.ai is Free
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Full access to all features at no cost. No credit card required.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ring-2 ring-blue-600">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
            Always Free
          </div>

          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Plan</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Everything you need for academic success</p>

            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>

            <Link
              href="/auth/signup"
              className="block w-full py-3 rounded-lg font-semibold text-center transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
            >
              Get Started
            </Link>

            <ul className="mt-8 space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-lg">CheckCircle2</span>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            What's included
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <span className="text-lg">Zap</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                State-of-the-art transcription and note generation using Groq technology
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <span className="text-lg">Star</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">High Quality</h3>
              <p className="text-gray-600 dark:text-gray-400">
                95%+ transcription accuracy with support for multiple languages and accents
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <span className="text-lg">TrendingUp</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your study patterns, progress, and optimize your learning habits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {[
            {
              q: 'Is Koala.ai really free?',
              a: 'Yes! Koala.ai is completely free to use with full access to all features. No credit card required.'
            },
            {
              q: 'Will you add paid plans in the future?',
              a: 'We may introduce premium features in the future, but the core functionality will always remain free for students.'
            },
            {
              q: 'Are there any usage limits?',
              a: 'We provide generous usage limits for recordings and storage. If you need more, reach out to us at support@koala.ai.'
            },
            {
              q: 'How do you make money?',
              a: 'We\'re currently focused on building the best product for students. We may introduce optional premium features in the future.'
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get started with Koala.ai today. No credit card required.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
