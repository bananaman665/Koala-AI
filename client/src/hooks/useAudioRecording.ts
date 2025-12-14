import { useState, useRef, useCallback, useEffect } from 'react'

interface AudioRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
}

interface UseAudioRecordingResult extends AudioRecordingState {
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<Blob | null>
  resetRecording: () => void
  error: string | null
}

export function useAudioRecording(): UseAudioRecordingResult {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  })
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
        }))

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder

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
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      
      startTimeRef.current = Date.now() - pausedTimeRef.current
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, duration: Math.floor(elapsed / 1000) }))
      }, 1000)

      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioUrl = URL.createObjectURL(audioBlob)
          
          setState(prev => ({
            ...prev,
            audioBlob,
            audioUrl,
            isRecording: false,
            isPaused: false,
          }))

          resolve(audioBlob)
        }

        mediaRecorderRef.current.stop()
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      } else {
        resolve(null)
      }
    })
  }, [])

  // Reset recording
  const resetRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl)
    }

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    })

    audioChunksRef.current = []
    pausedTimeRef.current = 0
    setError(null)
  }, [state.audioUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [state.audioUrl])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
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
