'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiSkipBack, FiSkipForward } from 'react-icons/fi'

interface TranscriptSegment {
  id: string
  text: string
  start: number
  end: number
  confidence?: number
}

interface AudioPlayerProps {
  audioUrl: string | null
  duration: number
  transcript?: string
  segments?: TranscriptSegment[]
  onTimeUpdate?: (currentTime: number) => void
  className?: string
}

export function AudioPlayer({
  audioUrl,
  duration: totalDuration,
  transcript,
  segments = [],
  onTimeUpdate,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(totalDuration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((err) => {
        setError('Unable to play audio')
      })
    }
  }, [isPlaying, audioUrl])

  // Handle seeking
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return

    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume || 1
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Change playback rate
  const changePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]

    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }, [playbackRate])

  // Seek to specific timestamp (for transcript sync)
  const seekToTime = useCallback((time: number) => {
    if (!audioRef.current) return

    audioRef.current.currentTime = time
    setCurrentTime(time)

    if (!isPlaying) {
    }
  }, [isPlaying])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || totalDuration)
      setIsLoading(false)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => setError('Error loading audio file')

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [totalDuration, onTimeUpdate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'm':
          toggleMute()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skip, toggleMute])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioUrl) {
    return (
      <div className={`bg-gray-100 rounded-xl p-4 ${className}`}>
        <p className="text-gray-500 text-center text-sm">No audio available for this lecture</p>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm mb-2 text-center">{error}</div>
      )}

      {/* Waveform/Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="relative h-12 bg-gray-700/50 rounded-lg cursor-pointer mb-4 overflow-hidden group"
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Fake waveform visualization */}
        <div className="absolute inset-0 flex items-center justify-around px-1">
          {Array.from({ length: 50 }).map((_, i) => {
            const barProgress = (i / 50) * 100
            const isActive = barProgress <= progress
            const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10

            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors ${
                  isActive ? 'bg-white/80' : 'bg-gray-500/50'
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        {/* Hover indicator */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Time tooltip on hover would go here */}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Time display */}
        <div className="text-white/80 text-sm font-mono min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center space-x-3">
          {/* Skip back 10s */}
          <button
            onClick={() => skip(-10)}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Skip back 10 seconds"
          >
            <FiSkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <FiPause className="w-6 h-6" />
            ) : (
              <FiPlay className="w-6 h-6 ml-0.5" />
            )}
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={() => skip(10)}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Skip forward 10 seconds"
          >
            <FiSkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume and Speed */}
        <div className="flex items-center space-x-3">
          {/* Playback speed */}
          <button
            onClick={changePlaybackRate}
            className="px-2 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/10 rounded transition-colors min-w-[45px]"
            title="Change playback speed"
          >
            {playbackRate}x
          </button>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-1 text-white/70 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <FiVolumeX className="w-5 h-5" />
              ) : (
                <FiVolume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-3 text-center">
        <p className="text-white/40 text-xs">
          Space to play/pause | ← → to skip 10s | M to mute
        </p>
      </div>
    </div>
  )
}

// Separate component for transcript with clickable timestamps
interface TranscriptViewerProps {
  transcript: string
  segments?: TranscriptSegment[]
  currentTime: number
  onSegmentClick: (time: number) => void
  className?: string
}

export function TranscriptViewer({
  transcript,
  segments = [],
  currentTime,
  onSegmentClick,
  className = '',
}: TranscriptViewerProps) {
  const activeSegmentRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentTime])

  // If we have segments, render with timestamps
  if (segments.length > 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        {segments.map((segment, index) => {
          const isActive = currentTime >= segment.start && currentTime < segment.end

          return (
            <div
              key={segment.id || index}
              ref={isActive ? activeSegmentRef : null}
              onClick={() => onSegmentClick(segment.start)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-xs text-gray-400 font-mono mr-2">
                {formatTimestamp(segment.start)}
              </span>
              <span className={isActive ? 'text-gray-900' : 'text-gray-700'}>
                {segment.text}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Fallback to plain transcript
  return (
    <div className={`prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap ${className}`}>
      {transcript}
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
