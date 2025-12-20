import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { VoiceRecorder } from 'capacitor-voice-recorder'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

interface HybridRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  isTranscribing: boolean
}

interface UseHybridRecordingResult extends HybridRecordingState {
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<string>
  resetRecording: () => void
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
  })
  const [error, setError] = useState<string | null>(null)

  // Detection
  const isNativePlatform = Capacitor.isNativePlatform()
  const isMobile = isNativePlatform || (typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  const hasSpeechRecognition = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const hasMediaRecorder = isNativePlatform || (typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined')

  // Use Web Speech API for transcription whenever available (primary method)
  // Use Capacitor Media to record audio for storage on native platforms (backup)
  // Use Web Media Recorder as fallback for mobile web
  const useSpeechRecognition = hasSpeechRecognition
  const useCapacitorMedia = isNativePlatform
  const useWebMediaRecorder = isMobile && !isNativePlatform

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
      // Request microphone permission
      const hasPermission = await VoiceRecorder.requestAudioRecordingPermission()
      if (!hasPermission.value) {
        throw new Error('Microphone permission denied')
      }

      // Start recording
      await VoiceRecorder.startRecording()
      capacitorMediaRef.current = 'recording' // Just a flag
    } catch (err: any) {
      throw new Error(err.message || 'Failed to start Capacitor recording')
    }
  }, [])

  // Web MediaRecorder Methods (Mobile Web)
  const startWebMediaRecorder = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    })

    streamRef.current = stream

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    })

    audioChunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.start(1000) // Collect data every second
    mediaRecorderRef.current = mediaRecorder
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)

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

      // Start Web Speech Recognition for transcription (primary)
      if (useSpeechRecognition) {
        await startSpeechRecognition()
      }

      // Also start Capacitor recording for audio backup on native platforms
      if (useCapacitorMedia && useSpeechRecognition) {
        await startCapacitorVoiceRecorder().catch(() => {
          // Capacitor recording is optional, don't fail if it doesn't start
        })
      } else if (useCapacitorMedia) {
        await startCapacitorVoiceRecorder()
      }

      // Web Media Recorder as fallback if Speech Recognition not available
      if (useWebMediaRecorder && !useSpeechRecognition) {
        await startWebMediaRecorder()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start recording')
      isRecordingRef.current = false
      setState(prev => ({ ...prev, isRecording: false }))
      stopTimer()
    }
  }, [isSupported, useSpeechRecognition, useCapacitorMedia, useWebMediaRecorder, startSpeechRecognition, startCapacitorVoiceRecorder, startWebMediaRecorder, startTimer, stopTimer])

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

  // Convert audio to MP3 using FFmpeg
  const convertAudioToMp3 = useCallback(async (audioBlob: Blob, inputMimeType: string): Promise<Blob> => {
    try {
      // If already MP3, return as is
      if (inputMimeType === 'audio/mpeg') {
        return audioBlob
      }


      const ffmpeg = new FFmpeg()

      if (!ffmpeg.loaded) {
        await ffmpeg.load()
      }

      // Write input file
      const inputFileName = 'input.aac'
      await ffmpeg.writeFile(inputFileName, await fetchFile(audioBlob))

      // Convert to MP3
      await ffmpeg.exec(['-i', inputFileName, '-q:a', '9', 'output.mp3'])

      // Read output file
      const mp3Data = await ffmpeg.readFile('output.mp3')
      const mp3Blob = new Blob([Buffer.from(mp3Data)], { type: 'audio/mpeg' })

      // Clean up
      ffmpeg.deleteFile(inputFileName)
      ffmpeg.deleteFile('output.mp3')

      return mp3Blob
    } catch (err: any) {
      // If conversion fails, return original blob
      return audioBlob
    }
  }, [])

  // Transcribe audio via API
  const transcribeAudio = useCallback(async (audioBlob: Blob, mimeType?: string): Promise<string> => {
    setState(prev => ({ ...prev, isTranscribing: true }))

    try {
      let audioToSend = audioBlob
      const fileMimeType = mimeType || audioBlob.type || 'audio/wav'

      // Convert to MP3 if it's AAC or other unsupported format
      if (fileMimeType.toLowerCase() === 'audio/aac' || fileMimeType.toLowerCase() === 'audio/x-m4a') {
        audioToSend = await convertAudioToMp3(audioBlob, fileMimeType)
      }

      const fileName = `recording.mp3`
      const audioFile = new File([audioToSend], fileName, { type: 'audio/mpeg' })

      const formData = new FormData()
      formData.append('audio', audioFile)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })


      const data = await response.json()


      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Failed to transcribe audio'
        throw new Error(errorMsg)
      }

      const transcript = data.transcript || ''
      return transcript
    } catch (err: any) {
      setError(`Transcription failed: ${err.message}`)
      return ''
    } finally {
      setState(prev => ({ ...prev, isTranscribing: false }))
    }
  }, [convertAudioToMp3])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string> => {
    stopTimer()

    // Primary: Use Web Speech API transcript (if available and working)
    if (useSpeechRecognition && recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null

      // Stop Capacitor recording in background
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

      return transcriptRef.current.trim()
    }

    // Native Platform: Use Capacitor recording + Groq transcription
    if (useCapacitorMedia && capacitorMediaRef.current) {
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
        }))

        return transcribedText
      } catch (err: any) {
        capacitorMediaRef.current = null
        isRecordingRef.current = false
        isPausedRef.current = false
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
        }))
        setError(err.message || 'Failed to stop recording')
        return ''
      }
    }

    // Web: Use Web Media Recorder
    if (useWebMediaRecorder && mediaRecorderRef.current) {
      return new Promise(async (resolve) => {
        if (!mediaRecorderRef.current) {
          resolve('')
          return
        }

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }

          // Transcribe the audio
          const transcribedText = await transcribeAudio(audioBlob, 'audio/webm')

          isRecordingRef.current = false
          isPausedRef.current = false
          setState(prev => ({
            ...prev,
            transcript: transcribedText,
            isRecording: false,
            isPaused: false,
          }))

          resolve(transcribedText)
        }

        mediaRecorderRef.current.stop()
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

    return ''
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
    })

    audioChunksRef.current = []
    pausedTimeRef.current = 0
    setError(null)
  }, [stopTimer])

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
