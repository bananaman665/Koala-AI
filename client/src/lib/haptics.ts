/**
 * Haptic feedback utility for mobile devices
 * Uses Capacitor Haptics for native apps, falls back to Vibration API for web
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

// Vibration patterns in milliseconds (fallback for web)
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
 * Check if running in a native Capacitor app
 */
function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Check if haptic feedback is supported (web fallback)
 */
export function isHapticSupported(): boolean {
  return isNative() || (typeof navigator !== 'undefined' && 'vibrate' in navigator)
}

/**
 * Trigger haptic feedback
 * @param style - The style of haptic feedback
 */
export async function haptic(style: HapticStyle = 'light'): Promise<void> {
  try {
    if (isNative()) {
      // Use Capacitor Haptics for native apps
      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light })
          break
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium })
          break
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy })
          break
        case 'success':
          await Haptics.notification({ type: NotificationType.Success })
          break
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning })
          break
        case 'error':
          await Haptics.notification({ type: NotificationType.Error })
          break
        case 'selection':
          await Haptics.selectionStart()
          await Haptics.selectionEnd()
          break
      }
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Fall back to Vibration API for web
      const pattern = vibrationPatterns[style]
      navigator.vibrate(pattern)
    }
  } catch (error) {
    // Silently fail if haptics are not available
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
