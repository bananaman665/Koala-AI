'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FiUsers } from 'react-icons/fi'

const courseColorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
}

interface ShareLectureToClassModalProps {
  isOpen: boolean
  onClose: () => void
  lectureTitle: string
  currentClassId: string | null
  userClasses: any[]
  selectedClassId: string | null
  onClassSelect: (classId: string | null) => void
  onConfirmShare: () => void
  isSharing: boolean
}

export function ShareLectureToClassModal({
  isOpen,
  onClose,
  lectureTitle,
  currentClassId,
  userClasses,
  selectedClassId,
  onClassSelect,
  onConfirmShare,
  isSharing,
}: ShareLectureToClassModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Lecture to Class"
      description={`Select a class to share "${lectureTitle}"`}
      size="md"
    >
      <div className="space-y-4">
        {/* Unshare option if currently shared */}
        {currentClassId && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
              This lecture is currently shared. Select a different class to move it, or click "Unshare" to remove it from all classes.
            </p>
            <Button
              variant="warning"
              size="sm"
              onClick={() => onClassSelect(null)}
              disabled={isSharing}
              fullWidth
            >
              Unshare from Current Class
            </Button>
          </div>
        )}

        {/* Class selection list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {userClasses && userClasses.length > 0 ? (
            userClasses.map((cls: any) => {
              const colorClass = courseColorClasses[cls.color] || courseColorClasses.blue
              const isCurrentClass = cls.id === currentClassId
              const isSelected = cls.id === selectedClassId

              return (
                <button
                  key={cls.id}
                  onClick={() => onClassSelect(cls.id)}
                  disabled={isCurrentClass}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : isCurrentClass
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colorClass.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <FiUsers className={`text-lg ${colorClass.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {cls.name}
                        {isCurrentClass && ' (Currently Shared)'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cls.code} • {cls.class_memberships?.length || 0} members
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiUsers className="w-6 h-6 text-gray-300 dark:text-gray-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No classes available</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create or join a class first
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSharing}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmShare}
            disabled={!selectedClassId && currentClassId === null || isSharing}
            fullWidth
            loading={isSharing}
          >
            {selectedClassId === null ? 'Unshare Lecture' : 'Share to Class'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
