import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { VoiceRecorder } from 'capacitor-voice-recorder'

interface HybridRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  isTranscribing: boolean
  audioBlob: Blob | null
}

interface StopRecordingResult {
  transcript: string
  audioBlob: Blob | null
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

// Extend Window interface for Speech Recognition
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

  const hasSpeechRecognition = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const hasMediaRecorder = typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined'

  // Recording method selection:
  // - Native iOS/Android: Use Capacitor VoiceRecorder (handles audio session properly)
  // - Mobile Web (not native): Use WebMediaRecorder
  // - Desktop: Use Web Speech API for live transcription
  const useSpeechRecognition = hasSpeechRecognition && !isNativePlatform && !isMobile
  const useCapacitorMedia = isNativePlatform // Use native recording on iOS/Android
  const useWebMediaRecorder = isMobile && !isNativePlatform // Only for mobile web browsers

  console.log('[HybridRecording] Platform detection:', {
    isNativePlatform,
    isMobile,
    hasSpeechRecognition,
    hasMediaRecorder,
    useSpeechRecognition,
    useCapacitorMedia,
    useWebMediaRecorder
  })

  const isSupported = hasSpeechRecognition || hasMediaRecorder || isNativePlatform

  // Refs for different recording methods
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const capacitorMediaRef = useRef<string | null>(null) // Store recording ID
  const transcriptRef = useRef<string>('') // Track transcript in ref to avoid stale closures
  const isRecordingRef = useRef<boolean>(false) // Track recording state in ref
  const isPausedRef = useRef<boolean>(false) // Track paused state in ref
  const capacitorStartTimeRef = useRef<number>(0) // Track when Capacitor recording started

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

  // Speech Recognition Methods (Desktop)
  const startSpeechRecognition = useCallback(async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError('Web Speech API not available on this device')
        return
      }

      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const resultTranscript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            // Append to ref to avoid stale closure issues
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
        setError(`Recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        // Auto-restart if still recording (not paused or stopped)
        // Use refs to avoid stale closure issues
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognition.start()
          } catch (e) {
          }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err: any) {
      setError(err.message || 'Failed to start speech recognition')
    }
  }, [])

  // Capacitor Voice Recorder Methods (Native Mobile)
  const startCapacitorVoiceRecorder = useCallback(async () => {
    try {
      console.log('[Capacitor Recording] Requesting permission...')
      // Request microphone permission
      const hasPermission = await VoiceRecorder.requestAudioRecordingPermission()
      console.log('[Capacitor Recording] Permission result:', hasPermission)
      if (!hasPermission.value) {
        throw new Error('Microphone permission denied. Please enable microphone access in Settings.')
      }

      // Start recording
      console.log('[Capacitor Recording] Starting recording...')
      const startResult = await VoiceRecorder.startRecording()
      console.log('[Capacitor Recording] Start result:', startResult)

      if (!startResult.value) {
        throw new Error('Failed to start native recording. Please restart the app and try again.')
      }

      capacitorMediaRef.current = 'recording' // Just a flag
      capacitorStartTimeRef.current = Date.now() // Track when recording started
      console.log('[Capacitor Recording] Recording started successfully at', capacitorStartTimeRef.current)
    } catch (err: any) {
      console.error('[Capacitor Recording] Failed to start:', err)
      throw new Error(err.message || 'Failed to start Capacitor recording')
    }
  }, [])

  // Web MediaRecorder Methods (Mobile Web)
  const startWebMediaRecorder = useCallback(async () => {
    console.log('[WebMediaRecorder] Starting...')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      console.log('[WebMediaRecorder] Got media stream')

      streamRef.current = stream

      // Determine supported mime type (iOS Safari doesn't support webm)
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[WebMediaRecorder] webm not supported, trying mp4')
        mimeType = 'audio/mp4'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[WebMediaRecorder] mp4 not supported, trying wav')
        mimeType = 'audio/wav'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[WebMediaRecorder] wav not supported, using default')
        mimeType = '' // Use default
      }
      console.log('[WebMediaRecorder] Using mimeType:', mimeType || 'default')

      const mediaRecorderOptions: MediaRecorderOptions = {}
      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)
      console.log('[WebMediaRecorder] MediaRecorder created, actual mimeType:', mediaRecorder.mimeType)

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('[WebMediaRecorder] Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('[WebMediaRecorder] Error:', event.error)
      }

      mediaRecorder.onstart = () => {
        console.log('[WebMediaRecorder] Recording started')
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      console.log('[WebMediaRecorder] Started successfully')
    } catch (err: any) {
      console.error('[WebMediaRecorder] Failed to start:', err)
      throw err
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      console.log('[Recording] Starting...', {
        isNativePlatform,
        useSpeechRecognition,
        useCapacitorMedia,
        useWebMediaRecorder,
        isSupported
      })

      if (!isSupported) {
        throw new Error('Recording is not supported on this device')
      }

      // Guard: prevent double-starting if already recording
      if (state.isRecording) {
        setError('Recording is already in progress')
        return
      }

      isRecordingRef.current = true
      isPausedRef.current = false
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
      }))

      startTimer()

      // Start Web Speech Recognition for transcription (primary - disabled on native)
      if (useSpeechRecognition) {
        console.log('[Recording] Using Web Speech Recognition')
        await startSpeechRecognition()
      }

      // Also start Capacitor recording for audio backup on native platforms
      if (useCapacitorMedia && useSpeechRecognition) {
        console.log('[Recording] Starting Capacitor as backup')
        await startCapacitorVoiceRecorder().catch((err) => {
          // Log Capacitor recording error - important for debugging
          console.warn('Capacitor recording failed to start (backup):', err.message)
        })
      } else if (useCapacitorMedia) {
        console.log('[Recording] Using Capacitor as PRIMARY (native platform)')
        try {
          await startCapacitorVoiceRecorder()
          console.log('[Recording] Capacitor started successfully')
        } catch (capacitorErr: any) {
          console.error('[Recording] Capacitor PRIMARY failed:', capacitorErr)
          // Don't throw - try to continue with error message
          setError(`Recording failed to start: ${capacitorErr.message}`)
          throw capacitorErr // Re-throw to trigger outer catch
        }
      }

      // Web Media Recorder as fallback if Speech Recognition not available
      if (useWebMediaRecorder && !useSpeechRecognition) {
        console.log('[Recording] Using Web MediaRecorder fallback')
        await startWebMediaRecorder()
      }

      console.log('[Recording] Started successfully')
    } catch (err: any) {
      console.error('[Recording] Failed to start:', err)
      setError(err.message || 'Failed to start recording')
      isRecordingRef.current = false
      setState(prev => ({ ...prev, isRecording: false }))
      stopTimer()
    }
  }, [isSupported, isNativePlatform, useSpeechRecognition, useCapacitorMedia, useWebMediaRecorder, startSpeechRecognition, startCapacitorVoiceRecorder, startWebMediaRecorder, startTimer, stopTimer, state.isRecording])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (useSpeechRecognition && recognitionRef.current) {
      recognitionRef.current.stop()
    } else if (useWebMediaRecorder && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
    // Note: Capacitor VoiceRecorder doesn't support pause

    pausedTimeRef.current = Date.now() - startTimeRef.current
    stopTimer()
    isPausedRef.current = true
    setState(prev => ({ ...prev, isPaused: true }))
  }, [useSpeechRecognition, useWebMediaRecorder, stopTimer])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (useSpeechRecognition && recognitionRef.current) {
      recognitionRef.current.start()
    } else if (useWebMediaRecorder && mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    // Note: Capacitor VoiceRecorder doesn't support resume

    startTimer()
    isPausedRef.current = false
    setState(prev => ({ ...prev, isPaused: false }))
  }, [useSpeechRecognition, useWebMediaRecorder, startTimer])

  // Transcribe audio via API
  const transcribeAudio = useCallback(async (audioBlob: Blob, mimeType?: string): Promise<string> => {
    setState(prev => ({ ...prev, isTranscribing: true }))

    try {
      let fileMimeType = mimeType || audioBlob.type || 'audio/wav'

      // Determine appropriate file extension based on mime type
      // Groq Whisper supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, opus, wav, webm
      let extension = 'wav' // Default fallback
      
      if (fileMimeType.includes('webm')) {
        extension = 'webm'
      } else if (fileMimeType.includes('aac')) {
        // AAC audio from iOS - use m4a extension which Groq accepts
        // AAC is the codec, M4A is the container - they're compatible
        extension = 'm4a'
        fileMimeType = 'audio/mp4' // Use audio/mp4 which is the proper MIME for m4a
      } else if (fileMimeType.includes('m4a')) {
        extension = 'm4a'
        fileMimeType = 'audio/mp4'
      } else if (fileMimeType.includes('mp4')) {
        extension = 'mp4'
      } else if (fileMimeType.includes('mp3') || fileMimeType.includes('mpeg')) {
        extension = 'mp3'
      } else if (fileMimeType.includes('wav')) {
        extension = 'wav'
      } else if (fileMimeType.includes('ogg')) {
        extension = 'ogg'
      } else if (fileMimeType.includes('opus')) {
        extension = 'opus'
      } else if (fileMimeType.includes('flac')) {
        extension = 'flac'
      }

      // Create a new blob with the correct mime type
      const convertedBlob = new Blob([audioBlob], { type: fileMimeType })
      const fileName = `recording.${extension}`
      const audioFile = new File([convertedBlob], fileName, { type: fileMimeType })

      console.log('Transcribing audio:', { 
        fileName, 
        finalMimeType: fileMimeType, 
        originalMimeType: mimeType,
        originalBlobType: audioBlob.type,
        size: audioBlob.size 
      })

      const formData = new FormData()
      formData.append('audio', audioFile)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      console.log('Transcription response status:', response.status)
      const data = await response.json()
      console.log('Transcription response data:', data)

      if (!response.ok) {
        const errorMsg = data.message || data.error || data.errorType || 'Failed to transcribe audio'
        console.error('Transcription API error details:', { status: response.status, ...data })
        throw new Error(errorMsg)
      }

      const transcript = data.transcript || ''
      return transcript
    } catch (err: any) {
      console.error('Transcription error:', err)
      console.error('Transcription error message:', err.message)
      console.error('Transcription error stack:', err.stack)
      setError(`Transcription failed: ${err.message}`)
      return ''
    } finally {
      setState(prev => ({ ...prev, isTranscribing: false }))
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<StopRecordingResult> => {
    stopTimer()

    // Primary: Use Web Speech API transcript (if available and working)
    if (useSpeechRecognition && recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null

      const speechTranscript = transcriptRef.current.trim()

      // If we have a Capacitor recording AND the speech transcript is empty,
      // use the Capacitor recording for transcription instead
      if (capacitorMediaRef.current && !speechTranscript) {
        try {
          const result = await VoiceRecorder.stopRecording()
          capacitorMediaRef.current = null

          // Convert base64 to blob
          const base64Response = await fetch(`data:${result.value.mimeType};base64,${result.value.recordDataBase64}`)
          const audioBlob = await base64Response.blob()

          // Transcribe the audio
          const transcribedText = await transcribeAudio(audioBlob, result.value.mimeType)

          isRecordingRef.current = false
          isPausedRef.current = false
          setState(prev => ({
            ...prev,
            transcript: transcribedText,
            isRecording: false,
            isPaused: false,
            audioBlob: audioBlob,
          }))

          return { transcript: transcribedText, audioBlob }
        } catch (err: any) {
          // If Capacitor transcription fails, continue with empty transcript
          console.error('Capacitor transcription fallback failed:', err)
        }
      }

      // Stop Capacitor recording in background if not used for transcription
      if (capacitorMediaRef.current) {
        VoiceRecorder.stopRecording().catch(() => {
        })
        capacitorMediaRef.current = null
      }

      isRecordingRef.current = false
      isPausedRef.current = false
      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }))

      // Web Speech API doesn't provide audio blob
      return { transcript: speechTranscript, audioBlob: null }
    }

    // Native Platform: Use Capacitor recording + Groq transcription
    if (useCapacitorMedia && capacitorMediaRef.current) {
      try {
        // Check minimum recording duration (at least 1 second)
        const recordingDurationMs = Date.now() - capacitorStartTimeRef.current
        console.log('[Capacitor Recording] Recording duration:', recordingDurationMs, 'ms')

        if (recordingDurationMs < 1000) {
          console.warn('[Capacitor Recording] Recording too short:', recordingDurationMs, 'ms')
          // Still try to stop, but warn the user
        }

        console.log('[Capacitor Recording] Stopping recording...')
        const result = await VoiceRecorder.stopRecording()
        console.log('[Capacitor Recording] Stop result:', {
          mimeType: result.value.mimeType,
          msDuration: result.value.msDuration,
          hasBase64: !!result.value.recordDataBase64,
          base64Length: result.value.recordDataBase64?.length || 0
        })
        capacitorMediaRef.current = null
        capacitorStartTimeRef.current = 0

        // Check if we got any audio data
        if (!result.value.recordDataBase64 || result.value.recordDataBase64.length === 0) {
          console.error('[Capacitor Recording] No audio data received!')
          // Provide more helpful error message based on recording duration
          if (recordingDurationMs < 1000) {
            throw new Error('Recording was too short. Please record for at least 2 seconds.')
          }
          throw new Error('No audio was captured. Please restart the app and try again. If the issue persists, check that no other apps are using the microphone.')
        }

        if (result.value.msDuration <= 0) {
          console.error('[Capacitor Recording] Duration is 0 or negative!')
          throw new Error('Recording failed to capture audio. Please close and reopen the app.')
        }

        // Convert base64 to blob
        console.log('[Capacitor Recording] Converting base64 to blob...')
        const base64Response = await fetch(`data:${result.value.mimeType};base64,${result.value.recordDataBase64}`)
        const audioBlob = await base64Response.blob()
        console.log('[Capacitor Recording] Blob size:', audioBlob.size)

        // Transcribe the audio
        console.log('[Capacitor Recording] Sending to transcription API...')
        const transcribedText = await transcribeAudio(audioBlob, result.value.mimeType)
        console.log('[Capacitor Recording] Transcription result length:', transcribedText.length)

        isRecordingRef.current = false
        isPausedRef.current = false
        console.log('[Capacitor Recording] Setting audioBlob in state:', audioBlob.size, 'bytes')
        setState(prev => ({
          ...prev,
          transcript: transcribedText,
          isRecording: false,
          isPaused: false,
          audioBlob: audioBlob,
        }))

        return { transcript: transcribedText, audioBlob }
      } catch (err: any) {
        capacitorMediaRef.current = null
        isRecordingRef.current = false
        isPausedRef.current = false
        console.log('[Capacitor Recording] Error, setting audioBlob to null')
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob: null,
        }))
        setError(err.message || 'Failed to stop recording')
        return { transcript: '', audioBlob: null }
      }
    }

    // Web: Use Web Media Recorder
    if (useWebMediaRecorder && mediaRecorderRef.current) {
      const recorderMimeType = mediaRecorderRef.current.mimeType || 'audio/webm'
      const recorder = mediaRecorderRef.current // Capture reference before nulling
      console.log('[WebMediaRecorder] Stopping, mimeType:', recorderMimeType)
      
      return new Promise<StopRecordingResult>(async (resolve) => {
        if (!recorder) {
          console.log('[WebMediaRecorder] No recorder ref, returning empty')
          resolve({ transcript: '', audioBlob: null })
          return
        }

        recorder.onstop = async () => {
          console.log('[WebMediaRecorder] onstop called, chunks:', audioChunksRef.current.length)
          const audioBlob = new Blob(audioChunksRef.current, { type: recorderMimeType })
          console.log('[HybridRecording] WebMediaRecorder audioBlob created:', audioBlob.size, 'bytes, type:', audioBlob.type)

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }

          // Transcribe the audio using the actual mime type
          const transcribedText = await transcribeAudio(audioBlob, recorderMimeType)

          isRecordingRef.current = false
          isPausedRef.current = false
          console.log('[HybridRecording] Setting audioBlob in state:', audioBlob.size, 'bytes')
          setState(prev => ({
            ...prev,
            transcript: transcribedText,
            isRecording: false,
            isPaused: false,
            audioBlob: audioBlob,
          }))

          resolve({ transcript: transcribedText, audioBlob })
        }

        recorder.stop()
        mediaRecorderRef.current = null
      })
    }

    isRecordingRef.current = false
    isPausedRef.current = false
    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
    }))

    return { transcript: '', audioBlob: null }
  }, [useSpeechRecognition, useCapacitorMedia, useWebMediaRecorder, stopTimer, transcribeAudio])

  // Reset recording
  const resetRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (capacitorMediaRef.current) {
      VoiceRecorder.stopRecording().catch(() => {}) // Stop if recording
      capacitorMediaRef.current = null
      capacitorStartTimeRef.current = 0
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    stopTimer()

    isRecordingRef.current = false
    isPausedRef.current = false
    transcriptRef.current = ''
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      transcript: '',
      interimTranscript: '',
      isTranscribing: false,
      audioBlob: null,
    })

    audioChunksRef.current = []
    pausedTimeRef.current = 0
    setError(null)
  }, [stopTimer])

  // Clear audio blob (call after saving lecture)
  const clearAudioBlob = useCallback(() => {
    setState(prev => ({ ...prev, audioBlob: null }))
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
      if (capacitorMediaRef.current) {
        VoiceRecorder.stopRecording().catch(() => {})
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
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
