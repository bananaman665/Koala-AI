'use client'

import { getFriendlyError } from '@/lib/errorHandler'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const friendlyError = getFriendlyError(error)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {friendlyError.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {friendlyError.message}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          {friendlyError.suggestedAction || 'Try Again'}
        </button>
      </div>
    </div>
  )
}
