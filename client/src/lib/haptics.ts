/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API and Capacitor Haptics when available
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

// Vibration patterns in milliseconds
const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 40, 20],
  error: [30, 50, 30, 50, 30],
  selection: 5,
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger haptic feedback
 * @param style - The style of haptic feedback
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (!isHapticSupported()) return

  try {
    const pattern = vibrationPatterns[style]
    navigator.vibrate(pattern)
  } catch (error) {
    // Silently fail if vibration is not allowed
    console.debug('Haptic feedback not available:', error)
  }
}

/**
 * Trigger haptic feedback for button presses
 */
export function hapticButton(): void {
  haptic('light')
}

/**
 * Trigger haptic feedback for successful actions
 */
export function hapticSuccess(): void {
  haptic('success')
}

/**
 * Trigger haptic feedback for errors
 */
export function hapticError(): void {
  haptic('error')
}

/**
 * Trigger haptic feedback for warnings
 */
export function hapticWarning(): void {
  haptic('warning')
}

/**
 * Trigger haptic feedback for selection changes
 */
export function hapticSelection(): void {
  haptic('selection')
}

/**
 * Trigger haptic feedback for impact (heavier feedback)
 */
export function hapticImpact(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
  haptic(intensity)
}
