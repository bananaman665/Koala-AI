/**
 * Sound effects utility for key user interactions
 * Uses Web Audio API to generate simple, pleasant sounds
 * Falls back gracefully if audio context is not available
 */

let audioContext: AudioContext | null = null

/**
 * Get or create the audio context
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      audioContext = new AudioContextClass()
    } catch (error) {
      console.debug('Audio context not available:', error)
      return null
    }
  }

  return audioContext
}

/**
 * Check if sound effects are supported
 */
export function isSoundSupported(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window || 'webkitAudioContext' in (window as any)
}

/**
 * Play a simple tone using Web Audio API
 * @param frequency - Frequency in Hz
 * @param duration - Duration in milliseconds
 * @param volume - Volume from 0 to 1
 */
function playTone(frequency: number, duration: number, volume: number = 0.3): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000)

    oscillator.start(now)
    oscillator.stop(now + duration / 1000)
  } catch (error) {
    console.debug('Error playing tone:', error)
  }
}

/**
 * Play a success sound (ascending tones)
 * Pleasant chime-like sound
 */
export function soundSuccess(): void {
  if (!isSoundSupported()) return

  playTone(523.25, 100, 0.3) // C5
  setTimeout(() => playTone(659.25, 150, 0.3), 100) // E5
}

/**
 * Play a recording start sound (short beep)
 * Clear, attention-getting sound
 */
export function soundRecordingStart(): void {
  if (!isSoundSupported()) return

  playTone(880, 150, 0.3) // A5
}

/**
 * Play a recording stop sound (descending tone)
 * Lower pitch to indicate stopping
 */
export function soundRecordingStop(): void {
  if (!isSoundSupported()) return

  playTone(659.25, 100, 0.3) // E5
  setTimeout(() => playTone(523.25, 100, 0.3), 100) // C5
}

/**
 * Play a recording pause sound (two short tones)
 * Indicates pause state
 */
export function soundRecordingPause(): void {
  if (!isSoundSupported()) return

  playTone(587.33, 80, 0.25) // D5
  setTimeout(() => playTone(587.33, 80, 0.25), 120) // D5
}

/**
 * Play a recording resume sound (two ascending tones)
 * Indicates resuming
 */
export function soundRecordingResume(): void {
  if (!isSoundSupported()) return

  playTone(523.25, 80, 0.25) // C5
  setTimeout(() => playTone(587.33, 80, 0.25), 100) // D5
}

/**
 * Play a save sound (satisfying "whoosh" effect with tones)
 * Indicates saving
 */
export function soundSave(): void {
  if (!isSoundSupported()) return

  playTone(440, 50, 0.2) // A4
  setTimeout(() => playTone(523.25, 80, 0.3), 50) // C5
}

/**
 * Play an achievement/milestone sound (celebratory chime)
 * Memorable, happy sound
 */
export function soundAchievement(): void {
  if (!isSoundSupported()) return

  playTone(523.25, 100, 0.3) // C5
  setTimeout(() => playTone(659.25, 100, 0.3), 100) // E5
  setTimeout(() => playTone(783.99, 200, 0.3), 200) // G5
}

/**
 * Play a streak extended sound (ascending musical notes)
 * Rewarding and motivating
 */
export function soundStreakExtended(): void {
  if (!isSoundSupported()) return

  playTone(587.33, 80, 0.3) // D5
  setTimeout(() => playTone(659.25, 80, 0.3), 80) // E5
  setTimeout(() => playTone(783.99, 150, 0.3), 160) // G5
}

/**
 * Play a button click sound (subtle selection sound)
 * Low-profile interaction sound
 */
export function soundClick(): void {
  if (!isSoundSupported()) return

  playTone(400, 40, 0.15) // G4
}

/**
 * Play a shift/transition sound
 * Light, quick sound for screen transitions
 */
export function soundWhoosh(): void {
  if (!isSoundSupported()) return

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const duration = 0.15 // 150ms - quick and light

    // Create an ascending pitch sweep for a "shift" effect
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = 'sine' // Sine wave for a clean, light sound

    // Quick frequency sweep from low to high (ascending shift)
    oscillator.frequency.setValueAtTime(300, now)
    oscillator.frequency.exponentialRampToValueAtTime(650, now + duration)

    // Volume envelope: quick fade in, then fade out
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  } catch (error) {
    console.debug('Error playing shift sound:', error)
  }
}

/**
 * Play an error sound (warning tone)
 * Indicates something went wrong
 */
export function soundError(): void {
  if (!isSoundSupported()) return

  playTone(349.23, 200, 0.3) // F4
}

/**
 * Mute/unmute all sounds
 * Call with true to mute, false to unmute
 */
export function setSoundsMuted(muted: boolean): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    if (muted) {
      ctx.suspend()
    } else {
      ctx.resume()
    }
  } catch (error) {
    console.debug('Error controlling audio context:', error)
  }
}
