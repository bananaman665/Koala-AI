'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiSearch, FiBook, FiMessageCircle, FiMail, FiHelpCircle, FiChevronRight } from 'react-icons/fi'
import AppIcon from '@/components/AppIcon'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      icon: '🚀',
      title: 'Getting Started',
      articles: [
        'How to record your first lecture',
        'Setting up your account',
        'Understanding the dashboard',
        'Audio quality tips'
      ]
    },
    {
      icon: '🎤',
      title: 'Recording',
      articles: [
        'Best practices for recording',
        'Managing background noise',
        'Pausing and resuming recordings',
        'Recording troubleshooting'
      ]
    },
    {
      icon: '📝',
      title: 'Notes & Transcripts',
      articles: [
        'Understanding AI-generated notes',
        'Editing and organizing notes',
        'Exporting your notes',
        'Searching transcripts'
      ]
    },
    {
      icon: '⚙️',
      title: 'Account & Settings',
      articles: [
        'Managing your subscription',
        'Privacy and data settings',
        'Notification preferences',
        'Deleting your account'
      ]
    }
  ]

  const faqs = [
    {
      question: 'How accurate is the transcription?',
      answer: 'Our AI-powered transcription using OpenAI Whisper achieves 95%+ accuracy for clear audio. For best results, ensure good audio quality and minimal background noise.'
    },
    {
      question: 'Can I edit the AI-generated notes?',
      answer: 'Yes! All notes are fully editable. You can add, remove, or modify any content to suit your needs.'
    },
    {
      question: 'How long does transcription take?',
      answer: 'Transcription typically takes 1-2 minutes per hour of audio. You\'ll receive a notification when your notes are ready.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. All your recordings and notes are encrypted and stored securely. We never share your data with third parties.'
    },
    {
      question: 'Can I share notes with classmates?',
      answer: 'Yes! You can generate shareable links for individual notes or entire courses. Control who can view or edit with granular permissions.'
    }
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
              <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-blue-100 mb-8">Search our knowledge base or browse categories below</p>
          
          <div className="max-w-2xl mx-auto relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:ring-4 focus:ring-blue-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/help/contact"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <FiMail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Get help from our support team</p>
          </Link>

          <Link
            href="/help/community"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <FiMessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Forum</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Connect with other students</p>
          </Link>

          <Link
            href="/help/guides"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <FiBook className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Video Tutorials</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Watch step-by-step guides</p>
          </Link>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, j) => (
                    <li key={j}>
                      <Link
                        href={`/help/article/${i}-${j}`}
                        className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 group"
                      >
                        <span className="text-sm">{article}</span>
                        <FiChevronRight className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group"
              >
                <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                  <FiChevronRight className="text-gray-400 transform group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 text-center">
          <FiHelpCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Our support team is here to assist you</p>
          <Link
            href="/help/contact"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
