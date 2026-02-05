'use client'

import { useState, useRef, ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { hapticImpact, hapticButton } from '@/lib/haptics'

interface SwipeToDeleteProps {
  children: ReactNode
  onDelete: () => void
  deleteThreshold?: number
  className?: string
  itemName?: string
  disabled?: boolean
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteThreshold = 80,
  className = '',
  itemName = 'this item',
  disabled = false,
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isSliding || isCollapsing || showConfirmation) return
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isSliding || isCollapsing || showConfirmation) return

    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current

    // Only allow swiping left (positive diff)
    if (diff > 0) {
      // Cap the swipe at 120px
      const newTranslate = Math.min(diff, 120)
      setTranslateX(-newTranslate)

      // Haptic feedback when passing threshold
      if (newTranslate >= deleteThreshold && translateX > -deleteThreshold) {
        hapticImpact('medium')
      }
    } else {
      setTranslateX(0)
    }
  }

  const handleTouchEnd = () => {
    if (isSliding || isCollapsing || showConfirmation) return
    setIsSwiping(false)

    if (Math.abs(translateX) >= deleteThreshold) {
      // Show confirmation dialog instead of deleting immediately
      hapticImpact('medium')
      setShowConfirmation(true)
      setTranslateX(0)
    } else {
      // Snap back
      setTranslateX(0)
    }
  }

  const handleConfirmDelete = () => {
    hapticImpact('heavy')
    setShowConfirmation(false)

    // Start slide-out animation
    setIsSliding(true)
    setTranslateX(-window.innerWidth)

    // After slide completes, collapse the height
    setTimeout(() => {
      setIsCollapsing(true)
      // After collapse animation, trigger delete
      setTimeout(() => {
        onDelete()
      }, 150)
    }, 150)
  }

  const handleCancelDelete = () => {
    hapticButton()
    setShowConfirmation(false)
    setTranslateX(0)
  }

  const deleteProgress = Math.min(Math.abs(translateX) / deleteThreshold, 1)

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl transition-all duration-300 ${className}`}
        style={isCollapsing ? { maxHeight: 0, opacity: 0, marginBottom: 0 } : {}}
      >
        {/* Delete action background */}
        <div
          className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl"
          style={{ opacity: deleteProgress }}
        >
          <div
            className="flex items-center space-x-2 text-white"
            style={{
              transform: `scale(${0.8 + deleteProgress * 0.2})`,
              opacity: deleteProgress,
            }}
          >
            <Trash2 size={20} />
            <span className="font-medium text-sm">Delete</span>
          </div>
        </div>

        {/* Swipeable content */}
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full mx-auto mb-4">
              <Trash2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete {itemName}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
