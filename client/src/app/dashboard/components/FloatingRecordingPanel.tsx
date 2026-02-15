import { Mic, Play, Pause } from 'lucide-react'
import { formatDuration } from '@/hooks/useHybridRecording'
import { hapticSelection } from '@/lib/haptics'

interface FloatingRecordingPanelProps {
  isRecording: boolean
  isPaused: boolean
  duration: number
  transcript: string
  interimTranscript: string
  audioLevels: number[]
  isStoppingRecording: boolean
  isGeneratingNotes: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function FloatingRecordingPanel({
  isRecording,
  isPaused,
  duration,
  transcript,
  interimTranscript,
  audioLevels,
  isStoppingRecording,
  isGeneratingNotes,
  onPause,
  onResume,
  onStop,
}: FloatingRecordingPanelProps) {
  if (!isRecording) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-in-up overflow-hidden">
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-8 pt-6 pb-6">
          {/* Recording Icon with gradient background */}
          <div className={`mx-auto w-32 h-32 rounded-full bg-red-500 flex items-center justify-center text-white mb-4 ${!isPaused && 'recording-indicator'}`}>
            <Mic size={48} className="text-white" />
          </div>

          {/* Waveform Visualization */}
          <div className="flex items-center justify-center gap-1 h-8 mb-4">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full transition-all duration-75"
                style={{
                  height: isPaused ? '8px' : `${level}px`,
                }}
              />
            ))}
          </div>

          {/* Timer and Status */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-mono mb-2">
              {formatDuration(duration)}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base">
              {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
            </p>
          </div>

          {/* Live Transcript */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${!isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Live Transcript</span>
            </div>
            {transcript || interimTranscript ? (
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-500 dark:text-gray-400 italic"> {interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Start speaking... your words will appear here
              </p>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => { hapticSelection(); isPaused ? onResume() : onPause() }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
            >
              {isPaused ? (
                <>
                  <Play size={20} className="text-white" /> Resume
                </>
              ) : (
                <>
                  <Pause size={20} className="text-white" /> Pause
                </>
              )}
            </button>
            <button
              onClick={onStop}
              disabled={isStoppingRecording || isGeneratingNotes}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              <span className="text-lg">&#x2B1C;</span>
              {isStoppingRecording || isGeneratingNotes ? 'Processing...' : 'Stop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
