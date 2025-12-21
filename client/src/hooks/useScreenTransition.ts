import { useRef, useState, useEffect } from 'react'

export type ScreenType = 'dashboard' | 'library' | 'analytics' | 'feed' | 'settings'

export type AnimationType = 'slideRight' | 'slideLeft' | 'fade'

// Screen order for determining slide direction
const screenOrder: Record<ScreenType, number> = {
  dashboard: 0,
  library: 1,
  analytics: 2,
  feed: 3,
  settings: 4,
}

/**
 * Determines animation type based on navigation flow
 */
export const getAnimationType = (
  previousScreen: ScreenType | null,
  currentScreen: ScreenType
): { enter: AnimationType; exit: AnimationType } => {
  // Initial load
  if (!previousScreen) {
    return { enter: 'fade', exit: 'fade' }
  }

  const fromIndex = screenOrder[previousScreen]
  const toIndex = screenOrder[currentScreen]

  // Moving right (higher index)
  if (toIndex > fromIndex) {
    return { enter: 'slideRight', exit: 'slideLeft' }
  } else {
    return { enter: 'slideLeft', exit: 'slideRight' }
  }
}

/**
 * Hook to manage screen transitions and animations
 * Returns both previous and current screen to enable simultaneous rendering during transitions
 */
export const useScreenTransition = (currentScreen: ScreenType) => {
  const [transitionState, setTransitionState] = useState<{
    previousScreen: ScreenType | null
    animationType: { enter: AnimationType; exit: AnimationType } | null
    key: number
    isTransitioning: boolean
  }>({ previousScreen: null, animationType: null, key: 0, isTransitioning: false })

  const previousScreenRef = useRef<ScreenType>(currentScreen)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (previousScreenRef.current !== currentScreen) {
      const prevScreen = previousScreenRef.current
      const newAnimation = getAnimationType(prevScreen, currentScreen)
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      
      // Start transition - keep both screens visible
      setTransitionState(prev => ({
        previousScreen: prevScreen,
        animationType: newAnimation,
        key: prev.key + 1,
        isTransitioning: true
      }))
      
      previousScreenRef.current = currentScreen
      
      // End transition after animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          previousScreen: null,
          isTransitioning: false
        }))
      }, 300) // Match animation duration
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [currentScreen])

  return {
    previousScreen: transitionState.previousScreen,
    animationType: transitionState.animationType,
    animationKey: transitionState.key,
    isTransitioning: transitionState.isTransitioning,
  }
}
