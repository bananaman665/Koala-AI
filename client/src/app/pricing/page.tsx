'use client'

import Link from 'next/link'
import { FiCheck, FiZap, FiStar, FiTrendingUp } from 'react-icons/fi'
import AppIcon from '@/components/AppIcon'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for trying out Koala.ai',
      features: [
        '10 GB storage',
        '100 hours/month recording',
        'Basic transcription',
        'AI-generated notes',
        'Email support',
      ],
      cta: 'Get Started',
      href: '/auth/signup',
      popular: false
    },
    {
      name: 'Student',
      price: '4.99',
      description: 'Best value for students',
      badge: 'Most Popular',
      features: [
        '25 GB storage',
        '500 hours/month recording',
        'Priority transcription',
        'Advanced AI features',
        'Study group sharing',
        'Collaboration tools',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      href: '/auth/signup?plan=student',
      popular: true
    },
    {
      name: 'Pro',
      price: '9.99',
      description: 'For power users and professionals',
      features: [
        '50 GB storage',
        'Unlimited recording hours',
        'Instant transcription',
        'Advanced analytics',
        'Custom AI prompts',
        'API access',
        'Team features',
        '24/7 priority support',
      ],
      cta: 'Start Free Trial',
      href: '/auth/signup?plan=pro',
      popular: false
    },
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
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Choose the plan that's right for you. All plans include a 14-day free trial.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600 scale-105' : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>

                <Link
                  href={plan.href}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <FiCheck className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            All plans include
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <FiZap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                State-of-the-art transcription and note generation using OpenAI technology
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <FiStar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">High Quality</h3>
              <p className="text-gray-600 dark:text-gray-400">
                95%+ transcription accuracy with support for multiple languages and accents
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <FiTrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
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
              q: 'Can I change plans later?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
            },
            {
              q: 'What happens after the free trial?',
              a: 'After 14 days, you\'ll be charged based on your selected plan. Cancel anytime before the trial ends with no charge.'
            },
            {
              q: 'Do you offer student discounts?',
              a: 'Yes! The Student plan is already discounted. Verify your .edu email to access this special pricing.'
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Absolutely. Cancel your subscription anytime with no questions asked. You\'ll retain access until the end of your billing period.'
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
            Start your free 14-day trial today. No credit card required.
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
