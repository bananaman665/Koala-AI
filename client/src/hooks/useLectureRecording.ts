import { useState } from 'react'
import { useAudioRecording } from './useAudioRecording'

interface UseLectureRecordingResult {
  // Recording state
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  
  // Transcription state
  isTranscribing: boolean
  transcript: string | null
  transcriptionError: string | null
  
  // Notes generation state
  isGeneratingNotes: boolean
  notes: string | null
  notesError: string | null
  
  // Actions
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopAndTranscribe: (courseId?: string, userId?: string) => Promise<void>
  generateNotes: () => Promise<void>
  reset: () => void
  
  // Errors
  recordingError: string | null
}

export function useLectureRecording(): UseLectureRecordingResult {
  const recording = useAudioRecording()
  
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [notes, setNotes] = useState<string | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)

  const stopAndTranscribe = async (courseId?: string, userId?: string) => {
    try {
      setIsTranscribing(true)
      setTranscriptionError(null)

      // Stop recording and get audio blob
      const audioBlob = await recording.stopRecording()
      
      if (!audioBlob) {
        throw new Error('No audio recorded')
      }

      // Create form data for transcription
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      if (courseId) formData.append('courseId', courseId)
      if (userId) formData.append('userId', userId)

      // Send to transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      setTranscript(data.transcript)
      
      // Automatically generate notes after transcription
      await generateNotesFromTranscript(data.transcript)
      
    } catch (err: any) {
      setTranscriptionError(err.message || 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const generateNotesFromTranscript = async (transcriptText: string) => {
    try {
      setIsGeneratingNotes(true)
      setNotesError(null)

      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes')
      }

      setNotes(data.notes)
    } catch (err: any) {
      setNotesError(err.message || 'Failed to generate notes')
    } finally {
      setIsGeneratingNotes(false)
    }
  }

  const generateNotes = async () => {
    if (!transcript) {
      setNotesError('No transcript available')
      return
    }
    await generateNotesFromTranscript(transcript)
  }

  const reset = () => {
    recording.resetRecording()
    setTranscript(null)
    setNotes(null)
    setTranscriptionError(null)
    setNotesError(null)
  }

  return {
    // Recording
    isRecording: recording.isRecording,
    isPaused: recording.isPaused,
    duration: recording.duration,
    audioBlob: recording.audioBlob,
    recordingError: recording.error,
    
    // Transcription
    isTranscribing,
    transcript,
    transcriptionError,
    
    // Notes
    isGeneratingNotes,
    notes,
    notesError,
    
    // Actions
    startRecording: recording.startRecording,
    pauseRecording: recording.pauseRecording,
    resumeRecording: recording.resumeRecording,
    stopAndTranscribe,
    generateNotes,
    reset,
  }
}
