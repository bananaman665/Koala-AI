import { useState } from 'react'
import { useHybridRecording } from './useHybridRecording'

interface UseLectureRecordingV2Result {
  // Recording state
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  isTranscribing: boolean
  audioBlob: Blob | null

  // Notes generation state
  isGeneratingNotes: boolean
  notes: string | null
  notesError: string | null

  // Actions
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopAndGenerateNotes: () => Promise<{ transcript: string; notes: string; audioBlob: Blob | null } | null>
  generateNotes: () => Promise<void>
  reset: () => void
  clearAudioBlob: () => void

  // Errors
  recordingError: string | null
  isSupported: boolean
  isMobile: boolean
}

export function useLectureRecordingV2(): UseLectureRecordingV2Result {
  const recording = useHybridRecording()
  
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [notes, setNotes] = useState<string | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)

  const stopAndGenerateNotes = async (): Promise<{ transcript: string; notes: string; audioBlob: Blob | null } | null> => {
    try {
      // Stop recording and get final transcript + audio blob
      console.log('[V2 Hook] Calling stopRecording...')
      const result = await recording.stopRecording()
      const finalTranscript = result.transcript
      const capturedAudioBlob = result.audioBlob
      console.log('[V2 Hook] After stopRecording, audioBlob:', capturedAudioBlob ? `${capturedAudioBlob.size} bytes` : 'null')

      if (!finalTranscript || finalTranscript.trim().length === 0) {
        setNotesError('Nothing recorded. Please try again.')
        return null
      }

      // Generate notes from transcript
      let generatedNotes = ''
      try {
        setIsGeneratingNotes(true)
        setNotesError(null)

        const response = await fetch('/api/ai/generate-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: finalTranscript }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMsg = data.error || data.message || 'Failed to generate notes'
          throw new Error(errorMsg)
        }

        if (!data.notes || data.notes.trim().length === 0) {
          throw new Error('Notes generation returned empty result')
        }

        generatedNotes = data.notes
        setNotes(generatedNotes)
      } catch (err: any) {
        console.error('[V2 Hook] Notes generation failed:', err.message)
        setNotesError(err.message || 'Failed to generate notes')
        // Still return transcript and audioBlob even if notes failed
        // so the recording can be saved without notes
        return { transcript: finalTranscript, notes: '', audioBlob: capturedAudioBlob }
      } finally {
        setIsGeneratingNotes(false)
      }

      return { transcript: finalTranscript, notes: generatedNotes, audioBlob: capturedAudioBlob }
    } catch (err) {
      // Only reset on error - let dashboard reset after saving audio
      recording.resetRecording()
      return null
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
        const errorMsg = data.error || data.message || 'Failed to generate notes'
        throw new Error(errorMsg)
      }


      if (!data.notes) {
        throw new Error('No notes returned from API')
      }

      setNotes(data.notes)
    } catch (err: any) {
      setNotesError(err.message || 'Failed to generate notes')
    } finally {
      setIsGeneratingNotes(false)
    }
  }

  const generateNotes = async () => {
    if (!recording.transcript || recording.transcript.trim().length === 0) {
      setNotesError('Nothing recorded. Please record something first.')
      return
    }
    await generateNotesFromTranscript(recording.transcript)
  }

  const reset = () => {
    recording.resetRecording()
    setNotes(null)
    setNotesError(null)
  }

  return {
    // Recording
    isRecording: recording.isRecording,
    isPaused: recording.isPaused,
    duration: recording.duration,
    transcript: recording.transcript,
    interimTranscript: recording.interimTranscript,
    isTranscribing: recording.isTranscribing,
    audioBlob: recording.audioBlob,
    recordingError: recording.error,
    isSupported: recording.isSupported,
    isMobile: recording.isMobile,

    // Notes
    isGeneratingNotes,
    notes,
    notesError,

    // Actions
    startRecording: recording.startRecording,
    pauseRecording: recording.pauseRecording,
    resumeRecording: recording.resumeRecording,
    stopAndGenerateNotes,
    generateNotes,
    reset,
    clearAudioBlob: recording.clearAudioBlob,
  }
}
