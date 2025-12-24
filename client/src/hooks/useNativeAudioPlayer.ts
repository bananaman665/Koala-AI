import { useState, useCallback, useRef, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { NativeAudio } from '@capacitor-community/native-audio'

interface NativeAudioPlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  isLoading: boolean
  error: string | null
  playbackRate: number
  volume: number
  isMuted: boolean
}

interface UseNativeAudioPlayerOptions {
  audioUrl: string | null
  initialDuration?: number
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

interface UseNativeAudioPlayerResult extends NativeAudioPlayerState {
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  toggleMute: () => Promise<void>
  isNative: boolean
}

// Generate a unique asset ID for each audio source
function generateAssetId(url: string): string {
  // Create a simple hash from the URL
  const hash = url.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0)
  return `audio_${Math.abs(hash)}`
}

export function useNativeAudioPlayer({
  audioUrl,
  initialDuration = 0,
  onTimeUpdate,
  onEnded,
}: UseNativeAudioPlayerOptions): UseNativeAudioPlayerResult {
  const isNative = Capacitor.isNativePlatform()
  
  const [state, setState] = useState<NativeAudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: initialDuration,
    isLoading: false,
    error: null,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
  })

  const assetIdRef = useRef<string | null>(null)
  const isLoadedRef = useRef<boolean>(false)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousUrlRef = useRef<string | null>(null)
  const listenerHandleRef = useRef<{ remove: () => Promise<void> } | null>(null)
  const onEndedRef = useRef(onEnded)

  // Keep onEnded ref updated
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  // Cleanup function
  const cleanup = useCallback(async () => {
    // Stop time update interval
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }

    // Remove listener if exists
    if (listenerHandleRef.current) {
      try {
        await listenerHandleRef.current.remove()
      } catch (err) {
        console.log('[NativeAudio] Listener cleanup error (ignored):', err)
      }
      listenerHandleRef.current = null
    }

    // Unload previous audio if exists
    if (assetIdRef.current && isLoadedRef.current) {
      try {
        await NativeAudio.stop({ assetId: assetIdRef.current })
        await NativeAudio.unload({ assetId: assetIdRef.current })
      } catch (err) {
        // Ignore errors during cleanup
        console.log('[NativeAudio] Cleanup error (ignored):', err)
      }
      isLoadedRef.current = false
    }
  }, [])

  // Load audio when URL changes
  useEffect(() => {
    if (!isNative || !audioUrl) {
      return
    }

    // Skip if URL hasn't changed
    if (previousUrlRef.current === audioUrl) {
      return
    }
    previousUrlRef.current = audioUrl

    const loadAudio = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        // Cleanup previous audio
        await cleanup()

        // Generate new asset ID
        const newAssetId = generateAssetId(audioUrl)
        assetIdRef.current = newAssetId

        console.log('[NativeAudio] Loading audio:', audioUrl, 'assetId:', newAssetId)

        // Preload the audio
        await NativeAudio.preload({
          assetId: newAssetId,
          assetPath: audioUrl,
          audioChannelNum: 1,
          isUrl: true, // Loading from URL
        })

        isLoadedRef.current = true

        // Set up completion listener ONCE after loading
        const handle = await NativeAudio.addListener('complete', (info) => {
          if (info.assetId === newAssetId) {
            console.log('[NativeAudio] Playback complete')
            setState(prev => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              currentTime: 0,
            }))
            // Stop time updates
            if (timeUpdateIntervalRef.current) {
              clearInterval(timeUpdateIntervalRef.current)
              timeUpdateIntervalRef.current = null
            }
            onEndedRef.current?.()
          }
        })
        listenerHandleRef.current = handle

        // Get duration
        try {
          const durationResult = await NativeAudio.getDuration({ assetId: newAssetId })
          if (durationResult.duration) {
            setState(prev => ({
              ...prev,
              duration: durationResult.duration,
              isLoading: false,
            }))
          } else {
            setState(prev => ({ ...prev, isLoading: false }))
          }
        } catch (durationErr) {
          console.log('[NativeAudio] Could not get duration:', durationErr)
          setState(prev => ({ ...prev, isLoading: false }))
        }

        console.log('[NativeAudio] Audio loaded successfully')
      } catch (err: any) {
        console.error('[NativeAudio] Failed to load audio:', err)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Failed to load audio',
        }))
      }
    }

    loadAudio()

    return () => {
      cleanup()
    }
  }, [audioUrl, isNative, cleanup])

  // Start time update polling when playing
  const startTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
    }

    timeUpdateIntervalRef.current = setInterval(async () => {
      if (!assetIdRef.current || !isLoadedRef.current) return

      try {
        const result = await NativeAudio.getCurrentTime({ assetId: assetIdRef.current })
        if (result.currentTime !== undefined) {
          setState(prev => ({ ...prev, currentTime: result.currentTime }))
          onTimeUpdate?.(result.currentTime)
        }
      } catch (err) {
        // Ignore errors during time polling
      }
    }, 250) // Update every 250ms for smooth progress
  }, [onTimeUpdate])

  // Stop time update polling
  const stopTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }, [])

  // Play
  const play = useCallback(async () => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) {
      setState(prev => ({ ...prev, error: 'Audio not loaded' }))
      return
    }

    try {
      setState(prev => ({ ...prev, error: null }))
      
      await NativeAudio.play({
        assetId: assetIdRef.current,
        time: state.currentTime,
      })

      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }))

      startTimeUpdates()

      console.log('[NativeAudio] Playing')
    } catch (err: any) {
      console.error('[NativeAudio] Play error:', err)
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to play audio',
      }))
    }
  }, [isNative, state.currentTime, startTimeUpdates])

  // Pause
  const pause = useCallback(async () => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) return

    try {
      await NativeAudio.pause({ assetId: assetIdRef.current })
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: true,
      }))

      stopTimeUpdates()
      console.log('[NativeAudio] Paused')
    } catch (err: any) {
      console.error('[NativeAudio] Pause error:', err)
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to pause audio',
      }))
    }
  }, [isNative, stopTimeUpdates])

  // Stop
  const stop = useCallback(async () => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) return

    try {
      await NativeAudio.stop({ assetId: assetIdRef.current })
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false,
        currentTime: 0,
      }))

      stopTimeUpdates()
      console.log('[NativeAudio] Stopped')
    } catch (err: any) {
      console.error('[NativeAudio] Stop error:', err)
    }
  }, [isNative, stopTimeUpdates])

  // Seek
  const seek = useCallback(async (time: number) => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) return

    try {
      // Clamp time to valid range
      const clampedTime = Math.max(0, Math.min(time, state.duration))
      
      // If playing, we need to stop and restart at new position
      const wasPlaying = state.isPlaying
      
      if (wasPlaying) {
        await NativeAudio.stop({ assetId: assetIdRef.current })
      }

      setState(prev => ({ ...prev, currentTime: clampedTime }))
      onTimeUpdate?.(clampedTime)

      if (wasPlaying) {
        await NativeAudio.play({
          assetId: assetIdRef.current,
          time: clampedTime,
        })
      }

      console.log('[NativeAudio] Seeked to:', clampedTime)
    } catch (err: any) {
      console.error('[NativeAudio] Seek error:', err)
    }
  }, [isNative, state.duration, state.isPlaying, onTimeUpdate])

  // Set playback rate (Native Audio may not support this - will be ignored)
  const setPlaybackRateHandler = useCallback(async (rate: number) => {
    // Native Audio plugin doesn't support playback rate
    // Just update state for UI consistency
    setState(prev => ({ ...prev, playbackRate: rate }))
    console.log('[NativeAudio] Playback rate set to:', rate, '(may not be supported)')
  }, [])

  // Set volume
  const setVolumeHandler = useCallback(async (volume: number) => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) return

    try {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      
      await NativeAudio.setVolume({
        assetId: assetIdRef.current,
        volume: clampedVolume,
      })

      setState(prev => ({ 
        ...prev, 
        volume: clampedVolume,
        isMuted: clampedVolume === 0,
      }))

      console.log('[NativeAudio] Volume set to:', clampedVolume)
    } catch (err: any) {
      console.error('[NativeAudio] Set volume error:', err)
    }
  }, [isNative])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!isNative || !assetIdRef.current || !isLoadedRef.current) return

    try {
      const newMuted = !state.isMuted
      const newVolume = newMuted ? 0 : state.volume || 1

      await NativeAudio.setVolume({
        assetId: assetIdRef.current,
        volume: newVolume,
      })

      setState(prev => ({ 
        ...prev, 
        isMuted: newMuted,
      }))

      console.log('[NativeAudio] Mute toggled:', newMuted)
    } catch (err: any) {
      console.error('[NativeAudio] Toggle mute error:', err)
    }
  }, [isNative, state.isMuted, state.volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate: setPlaybackRateHandler,
    setVolume: setVolumeHandler,
    toggleMute,
    isNative,
  }
}
