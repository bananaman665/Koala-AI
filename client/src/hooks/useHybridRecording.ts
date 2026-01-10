import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { VoiceRecorder } from 'capacitor-voice-recorder'
import { soundRecordingStart, soundRecordingStop, soundRecordingPause, soundRecordingResume } from '@/lib/sounds'

interface HybridRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  isTranscribing: boolean
  audioBlob: Blob | null // Recorded audio for playback
}

interface StopRecordingResult {
  transcript: string
  audioBlob: Blob | null // Recorded audio for playback
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

  // Audio recording refs (for playback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  
  // Native voice recorder state
  const nativeRecordingActiveRef = useRef<boolean>(false)

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

  // Start audio recording (MediaRecorder) for playback
  // Uses native VoiceRecorder on iOS/Android, MediaRecorder on web
  const startAudioRecording = useCallback(async () => {
    // Use native VoiceRecorder on iOS/Android
    if (isNativePlatform) {
      try {
        console.log('[Native Audio Recording] Checking permissions...')
        
        // Check/request permissions
        const permissionStatus = await VoiceRecorder.requestAudioRecordingPermission()
        console.log('[Native Audio Recording] Permission status:', permissionStatus)
        
        if (!permissionStatus.value) {
          console.warn('[Native Audio Recording] Permission denied')
          return
        }
        
        // Start native recording
        console.log('[Native Audio Recording] Starting recording...')
        await VoiceRecorder.startRecording()
        nativeRecordingActiveRef.current = true
        console.log('[Native Audio Recording] Started successfully')
      } catch (err) {
        console.error('[Native Audio Recording] Failed to start:', err)
        // Don't throw - audio recording is optional, speech recognition can continue
      }
      return
    }

    // Web browser recording using MediaRecorder
    try {
      console.log('[Audio Recording] Requesting microphone access...')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[Audio Recording] getUserMedia not available')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      // Determine best supported mime type
      let mimeType = 'audio/webm'
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      console.log('[Audio Recording] Using mime type:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.log('[Audio Recording] Chunk received:', event.data.size, 'bytes')
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('[Audio Recording] Error:', event)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      console.log('[Audio Recording] Started successfully')
    } catch (err) {
      console.error('[Audio Recording] Failed to start:', err)
      // Don't throw - audio recording is optional, speech recognition can continue
    }
  }, [isNativePlatform])

  // Stop audio recording and return blob
  const stopAudioRecording = useCallback(async (): Promise<Blob | null> => {
    // Handle native VoiceRecorder on iOS/Android
    if (isNativePlatform && nativeRecordingActiveRef.current) {
      try {
        console.log('[Native Audio Recording] Stopping recording...')
        const result = await VoiceRecorder.stopRecording()
        nativeRecordingActiveRef.current = false
        
        console.log('[Native Audio Recording] Got result:', result.value ? 'has data' : 'no data')
        
        if (result.value && result.value.recordDataBase64) {
          // Convert base64 to blob
          const base64Data = result.value.recordDataBase64
          const mimeType = result.value.mimeType || 'audio/aac'
          
          // Decode base64 to binary
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          const audioBlob = new Blob([bytes], { type: mimeType })
          console.log('[Native Audio Recording] Created blob:', audioBlob.size, 'bytes, type:', mimeType)
          
          return audioBlob
        }
        
        console.log('[Native Audio Recording] No audio data returned')
        return null
      } catch (err) {
        console.error('[Native Audio Recording] Failed to stop:', err)
        nativeRecordingActiveRef.current = false
        return null
      }
    }
    
    // Handle web MediaRecorder
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      const stream = mediaStreamRef.current

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        console.log('[Audio Recording] No active recorder')
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        const chunks = audioChunksRef.current
        console.log('[Audio Recording] Stopped, chunks:', chunks.length)

        if (chunks.length === 0) {
          resolve(null)
          return
        }

        const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' })
        console.log('[Audio Recording] Created blob:', audioBlob.size, 'bytes, type:', audioBlob.type)

        // Clean up
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        audioChunksRef.current = []

        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [isNativePlatform])

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

      // Set up listener for partial results
      // partialResults gives us real-time updates of the CURRENT phrase being recognized
      // We save directly to transcriptRef so it's always available when we stop
      await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        console.log('[Native Speech] Partial results:', data.matches)
        if (data.matches && data.matches.length > 0) {
          const currentPhrase = data.matches[0]

          // Save the current transcript directly (always keep it updated)
          transcriptRef.current = currentPhrase

          // Show both the accumulated transcript and current phrase
          setState(prev => ({
            ...prev,
            transcript: currentPhrase,
            interimTranscript: currentPhrase,
          }))
        }
      })

      // Set up listener for when recognition stops (for auto-restart during recording)
      await SpeechRecognition.addListener('listeningState', async (state: { status: string }) => {
        console.log('[Native Speech] Listening state:', state.status)

        if (state.status === 'stopped' && isRecordingRef.current && !isPausedRef.current) {
          // Recognition stopped but we're still "recording" - restart to continue
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

  // Start recording (speech recognition + audio recording)
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

      // Play recording start sound
      soundRecordingStart()

      startTimer()

      // Start audio recording for playback (non-blocking)
      startAudioRecording().catch(err => {
        console.warn('[Recording] Audio recording failed, continuing with speech only:', err)
      })

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
  }, [isSupported, isNativePlatform, useNativeSpeechRecognition, useWebSpeechRecognition, startNativeSpeechRecognition, startWebSpeechRecognition, startTimer, stopTimer, state.isRecording, startAudioRecording])

  // Pause recording
  const pauseRecording = useCallback(async () => {
    console.log('[Recording] Pausing...')

    // Play pause sound
    soundRecordingPause()

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

    // Play resume sound
    soundRecordingResume()

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

    // Stop audio recording and get blob
    const audioBlob = await stopAudioRecording()
    console.log('[Recording] Audio blob:', audioBlob ? `${audioBlob.size} bytes` : 'null')

    setState(prev => ({
      ...prev,
      transcript: finalTranscript,
      interimTranscript: '',
      isRecording: false,
      isPaused: false,
      audioBlob: audioBlob,
    }))

    console.log('[Recording] Stopped. Final transcript length:', finalTranscript.length)

    // Play recording stop sound
    soundRecordingStop()

    return { transcript: finalTranscript, audioBlob }
  }, [useNativeSpeechRecognition, stopNativeSpeechRecognition, stopTimer, stopAudioRecording])

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

    // Clean up audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    mediaRecorderRef.current = null
    mediaStreamRef.current = null
    audioChunksRef.current = []

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

  // Clear audio blob
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
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
