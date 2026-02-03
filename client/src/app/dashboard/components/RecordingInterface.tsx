'use client'

import { formatDuration } from '@/hooks/useHybridRecording'

interface RecordingInterfaceProps {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string | null
  interimTranscript: string | null
  isGeneratingNotes: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function RecordingInterface({
  isRecording,
  isPaused,
  duration,
  transcript,
  interimTranscript,
  isGeneratingNotes,
  onPause,
  onResume,
  onStop,
}: RecordingInterfaceProps) {
  if (!isRecording) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="text-center">
        {/* Recording Indicator */}
        <div className="mb-6">
          <div
            className={`w-32 h-32 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4 ${
              !isPaused && 'recording-indicator'
            }`}
          >
            <span className="text-lg">🎤</span>
          </div>
          
          {/* Duration */}
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
            {formatDuration(duration)}
          </div>
          
          {/* Status Text */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Recording Lecture
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 max-w-md mx-auto mb-6">
          <button
            onClick={isPaused ? onResume : onPause}
            className="flex-1 bg-yellow-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors active:scale-[0.98]"
            aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? (
              <>
                <span className="text-lg">▶️</span>
                Resume
              </>
            ) : (
              <>
                <span className="text-lg">⏸</span>
                Pause
              </>
            )}
          </button>
          
          <button
            onClick={onStop}
            disabled={isGeneratingNotes}
            className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 active:scale-[0.98]"
            aria-label="Stop recording and generate notes"
          >
            <span className="text-lg">⬜</span>
            {isGeneratingNotes ? 'Generating...' : 'Stop & Generate'}
          </button>
        </div>

        {/* Live Transcription */}
        {(transcript || interimTranscript) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Live Transcription
              </p>
            </div>
            <div className="max-h-32 overflow-y-auto text-left">
              <p className="text-gray-900 dark:text-white text-sm">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-500 dark:text-gray-400 italic">
                    {' '}
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}