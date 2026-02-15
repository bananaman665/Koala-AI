import { ChevronLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface FullScreenNotesModalProps {
  isOpen: boolean
  notes: string | null
  title: string
  onClose: () => void
}

export function FullScreenNotesModal({ isOpen, notes, title, onClose }: FullScreenNotesModalProps) {
  if (!isOpen || !notes) return null

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-40 overflow-y-auto">
      <div className="px-4 sm:px-5 pt-32 lg:pt-6 pb-32 lg:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>

        <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none
          prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:font-bold prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700
          prose-h3:text-lg sm:prose-h3:text-xl prose-h3:font-semibold prose-h3:text-gray-800 dark:prose-h3:text-gray-100 prose-h3:mb-2 prose-h3:mt-6
          prose-p:text-base sm:prose-p:text-lg prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3
          prose-ul:my-3 prose-ul:ml-0 prose-ul:pl-6
          prose-li:my-1 prose-li:text-base sm:prose-li:text-lg prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed prose-li:marker:text-blue-600 dark:prose-li:marker:text-blue-400
          prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
          [&>*:first-child]:mt-0
          [&_ul]:list-disc [&_ul]:space-y-1
        ">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
