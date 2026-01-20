import React from 'react'
import { AnimationType } from '@/hooks/useScreenTransition'

interface ScreenTransitionProps {
  animationType: AnimationType
  isActive: boolean
  children: React.ReactNode
}

/**
 * Wrapper component that applies animations to screen transitions
 * Uses a "push" effect where both screens slide together
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  animationType,
  isActive,
  children,
}) => {
  // Get animation class based on animation type and active state
  // For a "push" effect, the exiting screen slides in the same direction as the entering screen
  const getAnimationClass = (): string => {
    if (!isActive) {
      // Screen is exiting - slide out in opposite direction of entry
      switch (animationType) {
        case 'slideRight':
          // New screen entering from right, so this exits to the left
          return 'animate-slide-out-left'
        case 'slideLeft':
          // New screen entering from left, so this exits to the right
          return 'animate-slide-out-right'
        case 'fade':
          return 'animate-fade-out'
      }
    } else {
      // Screen is entering
      switch (animationType) {
        case 'slideRight':
          return 'animate-slide-in-right'
        case 'slideLeft':
          return 'animate-slide-in-left'
        case 'fade':
          return 'animate-fade-in'
      }
    }
  }

  return (
    <div
      className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${getAnimationClass()}`}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  )
}
