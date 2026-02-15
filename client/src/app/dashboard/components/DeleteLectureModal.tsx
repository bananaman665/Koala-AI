import { Trash2 } from 'lucide-react'
import { hapticButton, hapticImpact } from '@/lib/haptics'

interface DeleteLectureModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteLectureModal({ isOpen, onClose, onDelete, isDeleting }: DeleteLectureModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Trash2 size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Lecture?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone. All notes and data will be permanently removed.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              hapticButton()
              onClose()
            }}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              hapticImpact('heavy')
              onDelete()
            }}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg btn-press font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isDeleting ? (
              <span className="text-lg">&gt;&gt;&gt;</span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
