import { useEffect, useRef } from 'react'

export type ScreenType = 'dashboard' | 'library' | 'analytics' | 'feed' | 'settings'

export type AnimationType = 'slideRight' | 'slideLeft' | 'fade'

/**
 * Determines animation type based on navigation flow
 * dashboard -> library/feed: slide right
 * dashboard -> analytics: slide left
 * any -> dashboard: slide/fade based on origin
 */
export const getAnimationType = (
  previousScreen: ScreenType | null,
  currentScreen: ScreenType
): { enter: AnimationType; exit: AnimationType } => {
  // Initial load
  if (!previousScreen) {
    return { enter: 'fade', exit: 'fade' }
  }

  // Navigation flow mapping
  const screenOrder: Record<ScreenType, number> = {
    dashboard: 0,
    library: 1,
    analytics: 2,
    feed: 3,
    settings: 4,
  }

  const fromIndex = screenOrder[previousScreen]
  const toIndex = screenOrder[currentScreen]

  // Going back to dashboard - use slide based on direction
  if (currentScreen === 'dashboard') {
    return { enter: fromIndex > toIndex ? 'slideLeft' : 'slideRight', exit: fromIndex > toIndex ? 'slideRight' : 'slideLeft' }
  }

  // Going away from dashboard to library, feed, or settings
  if (previousScreen === 'dashboard' && (currentScreen === 'library' || currentScreen === 'feed' || currentScreen === 'settings')) {
    return { enter: 'slideRight', exit: 'slideLeft' }
  }

  // Going away from dashboard to analytics
  if (previousScreen === 'dashboard' && currentScreen === 'analytics') {
    return { enter: 'slideLeft', exit: 'slideRight' }
  }

  // Moving between other screens
  if (toIndex > fromIndex) {
    return { enter: 'slideRight', exit: 'slideLeft' }
  } else {
    return { enter: 'slideLeft', exit: 'slideRight' }
  }
}

/**
 * Hook to manage screen transitions and animations
 */
export const useScreenTransition = (currentScreen: ScreenType) => {
  const previousScreenRef = useRef<ScreenType | null>(null)
  const animationRef = useRef<{ enter: AnimationType; exit: AnimationType } | null>(null)

  // Determine animation when screen changes
  useEffect(() => {
    if (previousScreenRef.current !== currentScreen) {
      animationRef.current = getAnimationType(previousScreenRef.current, currentScreen)
      previousScreenRef.current = currentScreen
    }
  }, [currentScreen])

  return {
    previousScreen: previousScreenRef.current,
    animationType: animationRef.current,
  }
}
