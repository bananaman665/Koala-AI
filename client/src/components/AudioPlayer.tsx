'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiSkipBack, FiSkipForward } from 'react-icons/fi'
import { useNativeAudioPlayer } from '@/hooks/useNativeAudioPlayer'

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
  /** Force web player even on native platforms (useful for testing) */
  forceWebPlayer?: boolean
}

export function AudioPlayer({
  audioUrl,
  duration: totalDuration,
  transcript,
  segments = [],
  onTimeUpdate,
  className = '',
  forceWebPlayer = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  
  // Web player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(totalDuration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Native audio player hook for iOS/Android
  const nativeAudio = useNativeAudioPlayer({
    audioUrl: (!forceWebPlayer && audioUrl) ? audioUrl : null,
    initialDuration: totalDuration,
    onTimeUpdate,
    onEnded: () => {
      // Native audio ended
    },
  })
  
  // Determine if we should use native player
  const useNative = nativeAudio.isNative && !forceWebPlayer
  
  // Get unified state values (native or web)
  const playerIsPlaying = useNative ? nativeAudio.isPlaying : isPlaying
  const playerCurrentTime = useNative ? nativeAudio.currentTime : currentTime
  const playerDuration = useNative ? (nativeAudio.duration || totalDuration || duration) : duration
  const playerIsLoading = useNative ? nativeAudio.isLoading : isLoading
  const playerError = useNative ? nativeAudio.error : error
  const playerIsMuted = useNative ? nativeAudio.isMuted : isMuted
  const playerVolume = useNative ? nativeAudio.volume : volume
  const playerPlaybackRate = useNative ? nativeAudio.playbackRate : playbackRate

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

  // Handle play/pause - works for both native and web
  const togglePlay = useCallback(async () => {
    if (!audioUrl) return
    
    if (useNative) {
      // Native player
      if (nativeAudio.isPlaying) {
        await nativeAudio.pause()
      } else {
        await nativeAudio.play()
      }
    } else {
      // Web player
      if (!audioRef.current) return
      
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((err) => {
          setError('Unable to play audio')
        })
      }
    }
  }, [audioUrl, useNative, nativeAudio, isPlaying])

  // Handle seeking - works for both native and web
  const handleSeek = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * playerDuration

    if (useNative) {
      await nativeAudio.seek(newTime)
    } else {
      if (!audioRef.current) return
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [playerDuration, useNative, nativeAudio])

  // Skip forward/backward - works for both native and web
  const skip = useCallback(async (seconds: number) => {
    const newTime = Math.max(0, Math.min(playerDuration, playerCurrentTime + seconds))
    
    if (useNative) {
      await nativeAudio.seek(newTime)
    } else {
      if (!audioRef.current) return
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [playerDuration, playerCurrentTime, useNative, nativeAudio])

  // Handle volume change - works for both native and web
  const handleVolumeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    
    if (useNative) {
      await nativeAudio.setVolume(newVolume)
    } else {
      setVolume(newVolume)
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }
      setIsMuted(newVolume === 0)
    }
  }, [useNative, nativeAudio])

  // Toggle mute - works for both native and web
  const toggleMute = useCallback(async () => {
    if (useNative) {
      await nativeAudio.toggleMute()
    } else {
      if (!audioRef.current) return

      if (isMuted) {
        audioRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [useNative, nativeAudio, isMuted, volume])

  // Change playback rate - works for both native and web
  const changePlaybackRate = useCallback(async () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = rates.indexOf(playerPlaybackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]

    if (useNative) {
      await nativeAudio.setPlaybackRate(newRate)
    } else {
      setPlaybackRate(newRate)
      if (audioRef.current) {
        audioRef.current.playbackRate = newRate
      }
    }
  }, [playerPlaybackRate, useNative, nativeAudio])

  // Seek to specific timestamp (for transcript sync) - works for both native and web
  const seekToTime = useCallback(async (time: number) => {
    if (useNative) {
      await nativeAudio.seek(time)
    } else {
      if (!audioRef.current) return

      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [useNative, nativeAudio, playerIsPlaying])

  // Audio event handlers (only for web player)
  useEffect(() => {
    // Skip setting up web audio events if using native
    if (useNative) return
    
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
  }, [totalDuration, onTimeUpdate, useNative])

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

  const progress = playerDuration > 0 ? (playerCurrentTime / playerDuration) * 100 : 0

  if (!audioUrl) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">No audio available for this lecture</p>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-4 ${className}`}>
      {/* Hidden audio element - only used for web player */}
      {!useNative && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Error message */}
      {playerError && (
        <div className="text-red-400 text-sm mb-2 text-center">{playerError}</div>
      )}

      {/* Waveform/Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="relative h-12 bg-gray-700/50 rounded-lg cursor-pointer mb-4 overflow-hidden group"
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
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
      <div className="space-y-4">
        {/* Top row: Time, Playback controls, Speed */}
        <div className="flex items-center justify-between">
          {/* Left: Time display */}
          <div className="text-white/80 text-sm font-mono min-w-[100px]">
            {formatTime(playerCurrentTime)} / {formatTime(playerDuration)}
          </div>

          {/* Center: Playback controls + Speed */}
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
              disabled={playerIsLoading}
              className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
              title={playerIsPlaying ? 'Pause' : 'Play'}
            >
              {playerIsLoading ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : playerIsPlaying ? (
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

            {/* Playback speed */}
            <button
              onClick={changePlaybackRate}
              className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white bg-white/10 rounded transition-colors min-w-[70px]"
              title="Change playback speed"
            >
              {playerPlaybackRate}x
            </button>
          </div>

          {/* Right spacer for balance */}
          <div className="min-w-[100px]" />
        </div>

        {/* Bottom row: Volume bar (full width) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMute}
            className="p-1 text-white/70 hover:text-white transition-colors flex-shrink-0"
            title={playerIsMuted ? 'Unmute' : 'Mute'}
          >
            {playerIsMuted ? (
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
            value={playerIsMuted ? 0 : playerVolume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
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
  const activeSegmentRef = useRef<HTMLDivElement>(null)

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
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xs text-gray-400 font-mono mr-2">
                {formatTimestamp(segment.start)}
              </span>
              <span className={isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>
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
    <div className={`prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${className}`}>
      {transcript}
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
