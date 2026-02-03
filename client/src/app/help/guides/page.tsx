'use client'

import { useRouter } from 'next/navigation'
import { hapticButton } from '@/lib/haptics'

export default function GuidesPage() {
  const router = useRouter()

  const handleBack = () => {
    hapticButton()
    router.back()
  }

  const guideCategories = [
    {
      emoji: '⚡',
      title: 'Quick Start Guide',
      description: 'Get up and running in minutes',
      color: 'orange'
    },
    {
      emoji: '🎥',
      title: 'Video Tutorials',
      description: 'Step-by-step walkthroughs',
      color: 'red'
    },
    {
      emoji: '📄',
      title: 'Best Practices',
      description: 'Tips for better transcriptions',
      color: 'blue'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string }> = {
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/30' },
      red: { bg: 'bg-red-100 dark:bg-red-900/30' },
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/30' }
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xl"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Guides & Tutorials</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Icon Header */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 text-5xl">
            📚
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Learn How to Use Koala.ai</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Master Koala.ai with our comprehensive guides
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tutorials Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're creating video tutorials and detailed guides to help you get the most out of Koala.ai.
            Check back soon for step-by-step walkthroughs!
          </p>
        </div>

        {/* Future Categories */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
            Upcoming Guides
          </h3>
          {guideCategories.map((category, i) => {
            const colors = getColorClasses(category.color)
            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center text-xl`}>
                    {category.emoji}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quick Tips</h3>
          </div>
          <div className="p-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">🎤</span>
              <p>Record in a quiet environment for best transcription accuracy</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">📍</span>
              <p>Keep your device close to the speaker for clearer audio</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">✏️</span>
              <p>Review and edit AI-generated notes for accuracy</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">👥</span>
              <p>Use shared classes to collaborate with classmates</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-100 dark:border-blue-900/30">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">❓ Need Help Now?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Contact our support team at{' '}
            <a href="mailto:support@koala.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@koala.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
