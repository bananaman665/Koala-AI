import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechRecognitionState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
}

interface UseSpeechRecognitionResult extends SpeechRecognitionState {
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => string
  resetRecording: () => void
  isSupported: boolean
  error: string | null
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [state, setState] = useState<SpeechRecognitionState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    transcript: '',
    interimTranscript: '',
  })
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Helper to detect mobile devices
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) {
      const mobile = isMobileDevice()
      if (mobile) {
        setError('Speech recognition is not supported on mobile browsers. Please use the desktop version of Chrome, Edge, or Safari.')
      } else {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
      return null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true // Keep listening
    recognition.interimResults = true // Get results in real-time
    recognition.lang = 'en-US' // Language
    recognition.maxAlternatives = 1

    return recognition
  }, [isSupported])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      if (!isSupported) {
        const mobile = isMobileDevice()
        if (mobile) {
          throw new Error('Speech recognition is not supported on mobile browsers. Please use the desktop version of Chrome, Edge, or Safari.')
        } else {
          throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
        }
      }

      const recognition = initializeRecognition()
      if (!recognition) return

      recognition.onstart = () => {
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = state.transcript

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setState(prev => ({
          ...prev,
          transcript: finalTranscript,
          interimTranscript,
        }))
      }

      recognition.onerror = (event: any) => {
        setError(`Recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        // Auto-restart if still recording (not paused or stopped)
        if (state.isRecording && !state.isPaused) {
          recognition.start()
        }
      }

      recognition.start()
      recognitionRef.current = recognition

      // Start timer
      startTimeRef.current = Date.now() - pausedTimeRef.current
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, duration: Math.floor(elapsed / 1000) }))
      }, 1000)

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
      }))
    } catch (err: any) {
      setError(err.message || 'Failed to start recording')
    }
  }, [isSupported, initializeRecognition, state.isRecording, state.isPaused, state.transcript])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      pausedTimeRef.current = Date.now() - startTimeRef.current

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setState(prev => ({ ...prev, isPaused: true }))
    }
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start()

      startTimeRef.current = Date.now() - pausedTimeRef.current
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, duration: Math.floor(elapsed / 1000) }))
      }, 1000)

      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback((): string => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
    }))

    // Return final transcript
    return state.transcript.trim()
  }, [state.transcript])

  // Reset recording
  const resetRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      transcript: '',
      interimTranscript: '',
    })

    pausedTimeRef.current = 0
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    isSupported,
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
