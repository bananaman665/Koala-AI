'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FiAlertCircle } from 'react-icons/fi'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
  itemType: 'lecture' | 'course'
  itemName?: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemType,
  itemName,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!isDeleting}
    >
      <div className="text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Delete {itemType === 'lecture' ? 'Lecture' : 'Course'}?
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {itemName && (
            <span className="block font-medium text-gray-900 dark:text-white mb-2">
              "{itemName}"
            </span>
          )}
          This action cannot be undone.
          {itemType === 'course' &&
            ' All lectures in this course will also be deleted.'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={isDeleting}
            fullWidth
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}