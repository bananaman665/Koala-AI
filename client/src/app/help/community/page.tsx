'use client'

import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiMessageCircle, FiUsers, FiHeart, FiShare2 } from 'react-icons/fi'
import { hapticButton } from '@/lib/haptics'

export default function CommunityPage() {
  const router = useRouter()

  const handleBack = () => {
    hapticButton()
    router.back()
  }

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Community</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Icon Header */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
            <FiMessageCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join the Koala.ai Community</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Connect with other students using Koala.ai
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Community Features Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're building a space where students can share tips, collaborate on study materials,
            and help each other succeed with Koala.ai.
          </p>
        </div>

        {/* Future Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">What to Expect</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center p-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Discussion Forums</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions and share knowledge</p>
              </div>
            </div>
            <div className="flex items-center p-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <FiShare2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Share Study Materials</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collaborate on notes and resources</p>
              </div>
            </div>
            <div className="flex items-center p-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <FiHeart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Study Groups</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Find study partners in your courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-100 dark:border-blue-900/30">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Want to stay updated?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Reach out to us at{' '}
            <a href="mailto:support@koala.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@koala.ai
            </a>
            {' '}to learn more
          </p>
        </div>
      </div>
    </div>
  )
}
