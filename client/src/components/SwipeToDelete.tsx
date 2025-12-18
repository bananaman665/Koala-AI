'use client'

import { useState, useRef, ReactNode } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { hapticImpact } from '@/lib/haptics'

interface SwipeToDeleteProps {
  children: ReactNode
  onDelete: () => void
  deleteThreshold?: number
  className?: string
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteThreshold = 80,
  className = '',
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSliding || isCollapsing) return
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isSliding || isCollapsing) return

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
    if (isSliding || isCollapsing) return
    setIsSwiping(false)

    if (Math.abs(translateX) >= deleteThreshold) {
      // Start slide-out animation
      setIsSliding(true)
      hapticImpact('heavy')

      // Slide fully off screen
      setTranslateX(-window.innerWidth)
      
      // After slide completes, collapse the height
      setTimeout(() => {
        setIsCollapsing(true)
        // After collapse animation, trigger delete
        setTimeout(() => {
          onDelete()
        }, 150)
      }, 150)
    } else {
      // Snap back
      setTranslateX(0)
    }
  }

  const deleteProgress = Math.min(Math.abs(translateX) / deleteThreshold, 1)

  return (
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
          <FiTrash2 className="w-5 h-5" />
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
  )
}
