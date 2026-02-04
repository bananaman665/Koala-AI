'use client'

import { useState, useEffect } from 'react'
import { Flame, Lightning } from 'lucide-react'
import { hapticSuccess } from '@/lib/haptics'

interface StreakDisplayProps {
  streak: number
  lastActiveDate?: string | null
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  onStreakUpdate?: (newStreak: number) => void
}

export function StreakDisplay({
  streak,
  lastActiveDate,
  showDetails = false,
  size = 'md',
  onStreakUpdate
}: StreakDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)

  // Size configurations
  const sizes = {
    sm: { icon: 20, text: 'text-sm', container: 'px-2 py-1' },
    md: { icon: 28, text: 'text-base', container: 'px-3 py-1.5' },
    lg: { icon: 40, text: 'text-xl', container: 'px-4 py-2' },
  }

  const config = sizes[size]

  // Determine flame color based on streak length
  const getFlameColor = () => {
    if (streak === 0) return 'text-gray-400'
    if (streak < 3) return 'text-orange-400'
    if (streak < 7) return 'text-orange-500'
    if (streak < 14) return 'text-orange-600'
    if (streak < 30) return 'text-red-500'
    if (streak < 60) return 'text-red-600'
    return 'text-purple-500' // Ultra streak!
  }

  // Get glow effect based on streak
  const getGlowEffect = () => {
    if (streak === 0) return ''
    if (streak < 7) return 'drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]'
    if (streak < 30) return 'drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'
    return 'drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]'
  }

  // Milestone check
  const milestones = [3, 7, 14, 30, 60, 100, 365]
  const isMilestone = milestones.includes(streak)

  // Check for milestone celebration
  useEffect(() => {
    if (isMilestone && streak > 0) {
      setShowMilestone(true)
      hapticSuccess()
      const timer = setTimeout(() => setShowMilestone(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [streak, isMilestone])

  // Trigger animation on streak change
  useEffect(() => {
    if (streak > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [streak])

  const getMilestoneMessage = () => {
    if (streak >= 365) return "1 YEAR! You're legendary!"
    if (streak >= 100) return "100 days! Unstoppable!"
    if (streak >= 60) return "60 days! On fire!"
    if (streak >= 30) return "30 days! Amazing!"
    if (streak >= 14) return "2 weeks! Keep going!"
    if (streak >= 7) return "1 week streak!"
    if (streak >= 3) return "3 day streak!"
    return ""
  }

  return (
    <div className="relative">
      {/* Main streak display */}
      <div
        className={`flex items-center gap-1.5 ${config.container} rounded-full
          ${streak > 0
            ? 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
            : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }
          transition-all duration-300 ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
      >
        {/* Animated flame icon */}
        <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
          <Flame
            size={config.icon}
            weight={streak > 0 ? 'fill' : 'regular'}
            className={`${getFlameColor()} ${getGlowEffect()} transition-all duration-300
              ${streak > 0 ? 'animate-pulse-slow' : ''}
            `}
          />
          {/* Sparkle effect for high streaks */}
          {streak >= 7 && (
            <div className="absolute -top-1 -right-1">
              <span className="text-lg">⭐</span>
            </div>
          )}
        </div>

        {/* Streak count */}
        <span className={`font-bold ${config.text} ${streak > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
          {streak}
        </span>

        {/* "day" label for larger sizes */}
        {size !== 'sm' && (
          <span className={`text-xs ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {streak === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      {/* Milestone celebration popup */}
      {showMilestone && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-lg text-yellow-300">🏆</span>
              <span className="font-bold text-sm">{getMilestoneMessage()}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-orange-500" />
        </div>
      )}

      {/* Detailed view */}
      {showDetails && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Study Streak</h4>
            <div className="flex items-center gap-1 text-orange-500">
              <Lightning size={16} />
              <span className="text-sm font-medium">{streak} days</span>
            </div>
          </div>

          {/* Weekly progress */}
          <div className="flex justify-between gap-1 mb-3">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const isActive = i < (streak % 7) || streak >= 7
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${isActive
                        ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-gray-100 dark:bg-gray-800'
                      }
                    `}
                  >
                    <Flame
                      size={16}
                      weight={isActive ? 'fill' : 'regular'}
                      className={isActive ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day}</span>
                </div>
              )
            })}
          </div>

          {/* Next milestone */}
          {streak > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  const nextMilestone = milestones.find(m => m > streak)
                  if (!nextMilestone) return "You've reached the top!"
                  const daysLeft = nextMilestone - streak
                  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} until ${nextMilestone}-day milestone!`
                })()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook to manage streak state
export function useStreak(userId?: string) {
  const [streak, setStreak] = useState(0)
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load streak from localStorage on mount
  useEffect(() => {
    const savedStreak = localStorage.getItem('study-streak')
    const savedDate = localStorage.getItem('study-streak-date')

    if (savedStreak && savedDate) {
      const today = new Date().toDateString()
      const lastDate = new Date(savedDate).toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      if (lastDate === today) {
        // Already active today
        setStreak(parseInt(savedStreak))
        setLastActiveDate(savedDate)
      } else if (lastDate === yesterday) {
        // Last active yesterday, streak continues
        setStreak(parseInt(savedStreak))
        setLastActiveDate(savedDate)
      } else {
        // Streak broken
        setStreak(0)
        setLastActiveDate(null)
      }
    }
    setIsLoaded(true)
  }, [])

  // Record activity (call this when user studies, records, etc.)
  const recordActivity = () => {
    const today = new Date().toISOString()
    const todayString = new Date().toDateString()
    const lastDateString = lastActiveDate ? new Date(lastActiveDate).toDateString() : null

    if (lastDateString === todayString) {
      // Already recorded today
      return streak
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString()
    let newStreak: number

    if (lastDateString === yesterday) {
      // Continuing streak
      newStreak = streak + 1
    } else if (!lastDateString) {
      // Starting new streak
      newStreak = 1
    } else {
      // Streak was broken, starting fresh
      newStreak = 1
    }

    setStreak(newStreak)
    setLastActiveDate(today)
    localStorage.setItem('study-streak', String(newStreak))
    localStorage.setItem('study-streak-date', today)

    return newStreak
  }

  // Check if user has been active today
  const isActiveToday = () => {
    if (!lastActiveDate) return false
    return new Date(lastActiveDate).toDateString() === new Date().toDateString()
  }

  return {
    streak,
    lastActiveDate,
    isLoaded,
    recordActivity,
    isActiveToday,
  }
}
