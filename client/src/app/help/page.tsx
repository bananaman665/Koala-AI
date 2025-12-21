'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiSearch, FiMail, FiMessageCircle, FiBook, FiChevronDown, FiChevronUp, FiHelpCircle, FiMic, FiFileText, FiSettings, FiZap } from 'react-icons/fi'
import { hapticButton, hapticSelection } from '@/lib/haptics'

export default function HelpPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleBack = () => {
    hapticButton()
    router.back()
  }

  const toggleFaq = (index: number) => {
    hapticSelection()
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const quickLinks = [
    {
      icon: FiMail,
      title: 'Contact Support',
      description: 'Get help from our team',
      color: 'blue',
      href: 'mailto:support@koala.ai'
    },
    {
      icon: FiMessageCircle,
      title: 'Community',
      description: 'Connect with students',
      color: 'purple',
      href: '/help/community'
    },
    {
      icon: FiBook,
      title: 'Tutorials',
      description: 'Watch video guides',
      color: 'green',
      href: '/help/guides'
    }
  ]

  const categories = [
    {
      icon: FiZap,
      title: 'Getting Started',
      color: 'orange',
      articles: [
        'How to record your first lecture',
        'Setting up your account',
        'Understanding the dashboard',
        'Audio quality tips'
      ]
    },
    {
      icon: FiMic,
      title: 'Recording',
      color: 'red',
      articles: [
        'Best practices for recording',
        'Managing background noise',
        'Pausing and resuming recordings',
        'Recording troubleshooting'
      ]
    },
    {
      icon: FiFileText,
      title: 'Notes & Transcripts',
      color: 'blue',
      articles: [
        'Understanding AI-generated notes',
        'Editing and organizing notes',
        'Exporting your notes',
        'Searching transcripts'
      ]
    },
    {
      icon: FiSettings,
      title: 'Account & Settings',
      color: 'gray',
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
      answer: 'Our AI-powered transcription achieves 95%+ accuracy for clear audio. For best results, ensure good audio quality and minimal background noise.'
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

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
      green: { bg: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400' },
      red: { bg: 'bg-red-100 dark:bg-red-900/30', icon: 'text-red-600 dark:text-red-400' },
      gray: { bg: 'bg-gray-100 dark:bg-gray-700', icon: 'text-gray-600 dark:text-gray-400' }
    }
    return colors[color] || colors.blue
  }

  // Filter content based on search
  const filteredFaqs = faqs.filter(faq =>
    searchQuery === '' ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCategories = categories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(article =>
      searchQuery === '' || article.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Help & FAQ</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Icon Header */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <FiHelpCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Find answers and get support
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 dark:text-gray-500 w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quick Links</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {quickLinks.map((link, i) => {
              const colors = getColorClasses(link.color)
              return (
                <a
                  key={i}
                  href={link.href}
                  onClick={() => hapticButton()}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <link.icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{link.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                  </div>
                  <FiArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </a>
              )
            })}
          </div>
        </div>

        {/* Categories */}
        {filteredCategories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">Browse Topics</h2>
            {filteredCategories.map((category, i) => {
              const colors = getColorClasses(category.color)
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                      <category.icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {category.articles.map((article, j) => (
                      <button
                        key={j}
                        onClick={() => hapticButton()}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{article}</span>
                        <FiArrowLeft className="w-4 h-4 text-gray-400 rotate-180 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* FAQs */}
        {filteredFaqs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredFaqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                    {expandedFaq === i ? (
                      <FiChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredFaqs.length === 0 && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try searching with different keywords</p>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-100 dark:border-blue-900/30">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiMail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Still need help?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Our support team is here to assist you</p>
          <a
            href="mailto:support@koala.ai"
            onClick={() => hapticButton()}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
