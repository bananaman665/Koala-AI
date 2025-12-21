import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

interface HybridRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  isTranscribing: boolean
  audioBlob: Blob | null // Kept for backward compatibility, always null now
}

interface StopRecordingResult {
  transcript: string
  audioBlob: Blob | null // Kept for backward compatibility, always null now
}

interface UseHybridRecordingResult extends HybridRecordingState {
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<StopRecordingResult>
  resetRecording: () => void
  clearAudioBlob: () => void
  isSupported: boolean
  isMobile: boolean
  error: string | null
}

// Extend Window interface for Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useHybridRecording(): UseHybridRecordingResult {
  const [state, setState] = useState<HybridRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    transcript: '',
    interimTranscript: '',
    isTranscribing: false,
    audioBlob: null,
  })
  const [error, setError] = useState<string | null>(null)

  // Detection
  const isNativePlatform = Capacitor.isNativePlatform()
  const isMobile = isNativePlatform || (typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  // Web Speech API availability (for desktop browsers)
  const hasWebSpeechRecognition = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  // On native platforms, use Capacitor Speech Recognition
  // On desktop browsers, use Web Speech API
  const useNativeSpeechRecognition = isNativePlatform
  const useWebSpeechRecognition = hasWebSpeechRecognition && !isNativePlatform

  const isSupported = useNativeSpeechRecognition || useWebSpeechRecognition

  // Refs
  const webRecognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')
  const isRecordingRef = useRef<boolean>(false)
  const isPausedRef = useRef<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedTimeRef.current
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setState(prev => ({ ...prev, duration: Math.floor(elapsed / 1000) }))
    }, 1000)
  }, [])

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Native Speech Recognition (Capacitor plugin for iOS/Android)
  const startNativeSpeechRecognition = useCallback(async () => {
    try {
      console.log('[Native Speech] Requesting permissions...')

      // Request permissions
      const permissionStatus = await SpeechRecognition.requestPermissions()
      console.log('[Native Speech] Permission status:', permissionStatus)

      if (permissionStatus.speechRecognition !== 'granted') {
        throw new Error('Speech recognition permission denied. Please enable it in Settings.')
      }

      // Check if available
      const available = await SpeechRecognition.available()
      console.log('[Native Speech] Available:', available)

      if (!available.available) {
        throw new Error('Speech recognition is not available on this device.')
      }

      console.log('[Native Speech] Starting recognition...')

      // Track the current phrase being recognized (before it's finalized)
      let currentPhraseRef = ''

      // Set up listener for partial results
      // partialResults gives us real-time updates of the CURRENT phrase being recognized
      await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        console.log('[Native Speech] Partial results:', data.matches)
        if (data.matches && data.matches.length > 0) {
          currentPhraseRef = data.matches[0]

          // Show the current phrase being recognized (interim)
          setState(prev => ({
            ...prev,
            interimTranscript: currentPhraseRef,
          }))
        }
      })

      // Set up listener for when recognition stops (phrase complete)
      await SpeechRecognition.addListener('listeningState', async (state: { status: string }) => {
        console.log('[Native Speech] Listening state:', state.status)

        if (state.status === 'stopped' && isRecordingRef.current && !isPausedRef.current) {
          // Recognition stopped but we're still "recording" - append current phrase and restart
          if (currentPhraseRef.trim()) {
            transcriptRef.current = (transcriptRef.current + ' ' + currentPhraseRef).trim()
            setState(prev => ({
              ...prev,
              transcript: transcriptRef.current,
              interimTranscript: '',
            }))
            currentPhraseRef = ''
          }

          // Restart recognition to continue listening
          console.log('[Native Speech] Restarting recognition...')
          try {
            await SpeechRecognition.start({
              language: 'en-US',
              maxResults: 5,
              partialResults: true,
              popup: false,
            })
          } catch (e) {
            console.warn('[Native Speech] Failed to restart:', e)
          }
        }
      })

      // Start listening
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 5,
        partialResults: true,
        popup: false,
      })

      console.log('[Native Speech] Recognition started successfully')
    } catch (err: any) {
      console.error('[Native Speech] Failed to start:', err)
      throw new Error(err.message || 'Failed to start speech recognition')
    }
  }, [])

  // Stop Native Speech Recognition and get final transcript
  const stopNativeSpeechRecognition = useCallback(async (): Promise<string> => {
    try {
      console.log('[Native Speech] Stopping recognition...')

      // stop() returns void - transcript comes from partialResults listener
      await SpeechRecognition.stop()

      // Remove listeners
      await SpeechRecognition.removeAllListeners()

      // Return whatever transcript we've accumulated
      const finalTranscript = transcriptRef.current.trim()
      console.log('[Native Speech] Final transcript:', finalTranscript)
      return finalTranscript
    } catch (err: any) {
      console.error('[Native Speech] Failed to stop:', err)
      // Return whatever we have
      return transcriptRef.current
    }
  }, [])

  // Web Speech Recognition (for desktop browsers)
  const startWebSpeechRecognition = useCallback(async () => {
    try {
      const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!WebSpeechRecognition) {
        throw new Error('Web Speech API not available on this device')
      }

      const recognition = new WebSpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const resultTranscript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            transcriptRef.current += resultTranscript + ' '
          } else {
            interimTranscript += resultTranscript
          }
        }

        setState(prev => ({
          ...prev,
          transcript: transcriptRef.current,
          interimTranscript,
        }))
      }

      recognition.onerror = (event: any) => {
        console.error('[Web Speech] Error:', event.error)
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        // Auto-restart if still recording (not paused or stopped)
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognition.start()
          } catch (e) {
            console.warn('[Web Speech] Failed to restart:', e)
          }
        }
      }

      recognition.start()
      webRecognitionRef.current = recognition
      console.log('[Web Speech] Recognition started')
    } catch (err: any) {
      console.error('[Web Speech] Failed to start:', err)
      throw new Error(err.message || 'Failed to start speech recognition')
    }
  }, [])

  // Start recording (speech recognition)
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      console.log('[Recording] Starting...', {
        isNativePlatform,
        useNativeSpeechRecognition,
        useWebSpeechRecognition,
        isSupported
      })

      if (!isSupported) {
        throw new Error('Speech recognition is not supported on this device')
      }

      // Guard: prevent double-starting
      if (state.isRecording) {
        console.warn('[Recording] Already recording, aborting')
        setError('Recording is already in progress')
        return
      }

      isRecordingRef.current = true
      isPausedRef.current = false
      transcriptRef.current = ''

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        transcript: '',
        interimTranscript: '',
      }))

      startTimer()

      // Start appropriate speech recognition
      if (useNativeSpeechRecognition) {
        console.log('[Recording] Using Native Speech Recognition (Capacitor)')
        await startNativeSpeechRecognition()
      } else if (useWebSpeechRecognition) {
        console.log('[Recording] Using Web Speech Recognition')
        await startWebSpeechRecognition()
      }

      console.log('[Recording] Started successfully')
    } catch (err: any) {
      console.error('[Recording] Failed to start:', err)
      setError(err.message || 'Failed to start recording')
      isRecordingRef.current = false
      setState(prev => ({ ...prev, isRecording: false }))
      stopTimer()
    }
  }, [isSupported, isNativePlatform, useNativeSpeechRecognition, useWebSpeechRecognition, startNativeSpeechRecognition, startWebSpeechRecognition, startTimer, stopTimer, state.isRecording])

  // Pause recording
  const pauseRecording = useCallback(async () => {
    console.log('[Recording] Pausing...')

    if (useNativeSpeechRecognition) {
      // Native doesn't support pause, so we stop and save transcript
      try {
        const partialTranscript = await stopNativeSpeechRecognition()
        transcriptRef.current = partialTranscript
        setState(prev => ({ ...prev, transcript: partialTranscript }))
      } catch (e) {
        console.warn('[Recording] Failed to pause native:', e)
      }
    } else if (webRecognitionRef.current) {
      webRecognitionRef.current.stop()
    }

    pausedTimeRef.current = Date.now() - startTimeRef.current
    stopTimer()
    isPausedRef.current = true
    setState(prev => ({ ...prev, isPaused: true, interimTranscript: '' }))
  }, [useNativeSpeechRecognition, stopNativeSpeechRecognition, stopTimer])

  // Resume recording
  const resumeRecording = useCallback(async () => {
    console.log('[Recording] Resuming...')

    if (useNativeSpeechRecognition) {
      try {
        await startNativeSpeechRecognition()
      } catch (e) {
        console.warn('[Recording] Failed to resume native:', e)
      }
    } else if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.start()
      } catch (e) {
        console.warn('[Recording] Failed to resume web:', e)
      }
    }

    startTimer()
    isPausedRef.current = false
    setState(prev => ({ ...prev, isPaused: false }))
  }, [useNativeSpeechRecognition, startNativeSpeechRecognition, startTimer])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<StopRecordingResult> => {
    console.log('[Recording] Stopping...')

    // IMPORTANT: Set these BEFORE stopping to prevent the listeningState
    // listener from trying to restart recognition
    isRecordingRef.current = false
    isPausedRef.current = false

    stopTimer()

    let finalTranscript = ''

    if (useNativeSpeechRecognition) {
      finalTranscript = await stopNativeSpeechRecognition()
    } else if (webRecognitionRef.current) {
      webRecognitionRef.current.stop()
      webRecognitionRef.current = null
      finalTranscript = transcriptRef.current.trim()
    }

    setState(prev => ({
      ...prev,
      transcript: finalTranscript,
      interimTranscript: '',
      isRecording: false,
      isPaused: false,
    }))

    console.log('[Recording] Stopped. Final transcript length:', finalTranscript.length)

    // Return transcript (no audio blob with speech recognition approach)
    return { transcript: finalTranscript, audioBlob: null }
  }, [useNativeSpeechRecognition, stopNativeSpeechRecognition, stopTimer])

  // Reset recording
  const resetRecording = useCallback(async () => {
    console.log('[Recording] Resetting...')

    if (useNativeSpeechRecognition) {
      try {
        await SpeechRecognition.stop()
        await SpeechRecognition.removeAllListeners()
      } catch (e) {
        // Ignore errors during reset
      }
    }

    if (webRecognitionRef.current) {
      webRecognitionRef.current.stop()
      webRecognitionRef.current = null
    }

    stopTimer()

    isRecordingRef.current = false
    isPausedRef.current = false
    transcriptRef.current = ''
    pausedTimeRef.current = 0

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      transcript: '',
      interimTranscript: '',
      isTranscribing: false,
      audioBlob: null,
    })

    setError(null)
  }, [useNativeSpeechRecognition, stopTimer])

  // Clear audio blob (no-op now, kept for backward compatibility)
  const clearAudioBlob = useCallback(() => {
    setState(prev => ({ ...prev, audioBlob: null }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (webRecognitionRef.current) {
        webRecognitionRef.current.stop()
      }
      if (isNativePlatform) {
        SpeechRecognition.stop().catch(() => {})
        SpeechRecognition.removeAllListeners().catch(() => {})
      }
    }
  }, [isNativePlatform])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    clearAudioBlob,
    isSupported,
    isMobile,
    error,
  }
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
