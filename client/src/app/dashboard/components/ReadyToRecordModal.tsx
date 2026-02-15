import { Mic } from 'lucide-react'
import { hapticButton, hapticImpact } from '@/lib/haptics'

interface ReadyToRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ReadyToRecordModal({ isOpen, onClose, onConfirm }: ReadyToRecordModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Mic size={56} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Record?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Your lecture will be saved with transcript and AI notes</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              hapticButton()
              onClose()
            }}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            No
          </button>
          <button
            onClick={() => {
              console.log('[Dashboard] Yes button clicked, calling startRecording...')
              hapticImpact('heavy')
              onConfirm()
              console.log('[Dashboard] startRecording() called, closing modal')
              onClose()
            }}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}
