import { useState } from 'react'

interface UseAINotesResult {
  notes: string | null
  isGenerating: boolean
  error: string | null
  generateNotes: (transcript: string) => Promise<void>
  reset: () => void
}

export function useAINotes(): UseAINotesResult {
  const [notes, setNotes] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateNotes = async (transcript: string) => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes')
      }

      setNotes(data.notes)
    } catch (err: any) {
      setError(err.message || 'Failed to generate notes')
      console.error('Error generating notes:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const reset = () => {
    setNotes(null)
    setError(null)
    setIsGenerating(false)
  }

  return {
    notes,
    isGenerating,
    error,
    generateNotes,
    reset,
  }
}

interface UseAISummaryResult {
  summary: string | null
  isGenerating: boolean
  error: string | null
  generateSummary: (content: string, maxWords?: number) => Promise<void>
  reset: () => void
}

export function useAISummary(): UseAISummaryResult {
  const [summary, setSummary] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async (content: string, maxWords: number = 150) => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, maxWords }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary')
      console.error('Error generating summary:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const reset = () => {
    setSummary(null)
    setError(null)
    setIsGenerating(false)
  }

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
    reset,
  }
}
