import React from 'react'
import { AnimationType } from '@/hooks/useScreenTransition'

interface ScreenTransitionProps {
  animationType: AnimationType
  isActive: boolean
  children: React.ReactNode
}

/**
 * Wrapper component that applies animations to screen transitions
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  animationType,
  isActive,
  children,
}) => {
  // Get animation class based on animation type and active state
  const getAnimationClass = (): string => {
    if (!isActive) {
      // Screen is exiting
      switch (animationType) {
        case 'slideRight':
          return 'animate-slide-out-right'
        case 'slideLeft':
          return 'animate-slide-out-left'
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
      className={`absolute inset-0 w-full h-full ${getAnimationClass()}`}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: isActive ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}
