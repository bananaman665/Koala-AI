'use client'

import { useState, useEffect, useCallback } from 'react'
import { hapticSuccess } from '@/lib/haptics'
import { soundAchievement, soundStreakExtended } from '@/lib/sounds'

// Achievement definitions
export const ACHIEVEMENTS = [
  // Getting Started
  {
    id: 'first_lecture',
    name: 'First Steps',
    description: 'Record your first lecture',
    icon: "Mic",
    category: 'getting_started',
    condition: (stats: UserStats) => stats.totalLectures >= 1,
    xpReward: 100,
  },
  {
    id: 'first_notes',
    name: 'Note Taker',
    description: 'Generate notes for the first time',
    icon: "BookOpen",
    category: 'getting_started',
    condition: (stats: UserStats) => stats.notesGenerated >= 1,
    xpReward: 50,
  },
  {
    id: 'first_quiz',
    name: 'Quiz Whiz',
    description: 'Complete your first Learn Mode quiz',
    icon: "Brain",
    category: 'getting_started',
    condition: (stats: UserStats) => stats.quizzesCompleted >= 1,
    xpReward: 50,
  },
  
  // Recording Milestones
  {
    id: 'lectures_5',
    name: 'Getting Serious',
    description: 'Record 5 lectures',
    icon: "Mic",
    category: 'recording',
    condition: (stats: UserStats) => stats.totalLectures >= 5,
    xpReward: 150,
  },
  {
    id: 'lectures_10',
    name: 'Dedicated Learner',
    description: 'Record 10 lectures',
    icon: "Star",
    category: 'recording',
    condition: (stats: UserStats) => stats.totalLectures >= 10,
    xpReward: 300,
  },
  {
    id: 'lectures_25',
    name: 'Knowledge Seeker',
    description: 'Record 25 lectures',
    icon: "Zap",
    category: 'recording',
    condition: (stats: UserStats) => stats.totalLectures >= 25,
    xpReward: 500,
  },
  {
    id: 'lectures_50',
    name: 'Lecture Legend',
    description: 'Record 50 lectures',
    icon: "Crown",
    category: 'recording',
    condition: (stats: UserStats) => stats.totalLectures >= 50,
    xpReward: 1000,
  },
  
  // Time Milestones
  {
    id: 'time_1h',
    name: 'Hour of Power',
    description: 'Record 1 hour of lectures total',
    icon: "Clock",
    category: 'time',
    condition: (stats: UserStats) => stats.totalRecordingTime >= 3600,
    xpReward: 200,
  },
  {
    id: 'time_5h',
    name: 'Marathon Learner',
    description: 'Record 5 hours of lectures total',
    icon: "Clock",
    category: 'time',
    condition: (stats: UserStats) => stats.totalRecordingTime >= 18000,
    xpReward: 500,
  },
  {
    id: 'time_10h',
    name: 'Time Master',
    description: 'Record 10 hours of lectures total',
    icon: "Trophy",
    category: 'time',
    condition: (stats: UserStats) => stats.totalRecordingTime >= 36000,
    xpReward: 1000,
  },
  
  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Warming Up',
    description: 'Reach a 3-day streak',
    icon: "Flame",
    category: 'streak',
    condition: (stats: UserStats) => stats.currentStreak >= 3,
    xpReward: 75,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: "Flame",
    category: 'streak',
    condition: (stats: UserStats) => stats.currentStreak >= 7,
    xpReward: 200,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Reach a 30-day streak',
    icon: "Flame",
    category: 'streak',
    condition: (stats: UserStats) => stats.currentStreak >= 30,
    xpReward: 750,
  },
  
  // Quiz Achievements
  {
    id: 'quizzes_10',
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    icon: "Brain",
    category: 'quiz',
    condition: (stats: UserStats) => stats.quizzesCompleted >= 10,
    xpReward: 250,
  },
  {
    id: 'perfect_quiz',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: "Target",
    category: 'quiz',
    condition: (stats: UserStats) => stats.perfectQuizzes >= 1,
    xpReward: 150,
  },
  
  // Course Achievements
  {
    id: 'courses_3',
    name: 'Multi-Tasker',
    description: 'Create 3 courses',
    icon: "GraduationCap",
    category: 'courses',
    condition: (stats: UserStats) => stats.totalCourses >= 3,
    xpReward: 200,
  },
  {
    id: 'courses_5',
    name: 'Course Collector',
    description: 'Create 5 courses',
    icon: "GraduationCap",
    category: 'courses',
    condition: (stats: UserStats) => stats.totalCourses >= 5,
    xpReward: 400,
  },
  
  // Level Achievements
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: "✨",
    category: 'level',
    condition: (stats: UserStats) => stats.level >= 5,
    xpReward: 500,
  },
  {
    id: 'level_10',
    name: 'Legend Status',
    description: 'Reach level 10',
    icon: "Crown",
    category: 'level',
    condition: (stats: UserStats) => stats.level >= 10,
    xpReward: 2000,
  },
  
  // Special Achievements
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Record a lecture before 8 AM',
    icon: "🚀",
    category: 'special',
    condition: (stats: UserStats) => stats.earlyBirdLectures >= 1,
    xpReward: 100,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Record a lecture after 10 PM',
    icon: "Star",
    category: 'special',
    condition: (stats: UserStats) => stats.nightOwlLectures >= 1,
    xpReward: 100,
  },
] as const

export type AchievementId = typeof ACHIEVEMENTS[number]['id']

export interface UserStats {
  totalLectures: number
  totalCourses: number
  totalRecordingTime: number // in seconds
  notesGenerated: number
  quizzesCompleted: number
  perfectQuizzes: number
  currentStreak: number
  level: number
  earlyBirdLectures: number
  nightOwlLectures: number
}

interface AchievementState {
  unlockedAchievements: AchievementId[]
  lastChecked: string
}

const STORAGE_KEY = 'koala_achievements'

function getInitialState(): AchievementState {
  if (typeof window === 'undefined') {
    return { unlockedAchievements: [], lastChecked: new Date().toISOString() }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { unlockedAchievements: [], lastChecked: new Date().toISOString() }
    }
  }
  return { unlockedAchievements: [], lastChecked: new Date().toISOString() }
}

export function useAchievements() {
  const [state, setState] = useState<AchievementState>(getInitialState)
  const [newAchievement, setNewAchievement] = useState<typeof ACHIEVEMENTS[number] | null>(null)
  const [showAchievementModal, setShowAchievementModal] = useState(false)

  // Load state on mount
  useEffect(() => {
    setState(getInitialState())
  }, [])

  // Save state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  // Check for new achievements based on stats
  const checkAchievements = useCallback((stats: UserStats, addXP?: (amount: number, action: string) => void) => {
    const newlyUnlocked: typeof ACHIEVEMENTS[number][] = []

    ACHIEVEMENTS.forEach(achievement => {
      // Skip already unlocked
      if (state.unlockedAchievements.includes(achievement.id)) return

      // Check if condition is met
      if (achievement.condition(stats)) {
        newlyUnlocked.push(achievement)
      }
    })

    if (newlyUnlocked.length > 0) {
      setState(prev => ({
        ...prev,
        unlockedAchievements: [
          ...prev.unlockedAchievements,
          ...newlyUnlocked.map(a => a.id),
        ],
        lastChecked: new Date().toISOString(),
      }))

      // Show the first new achievement
      const firstAchievement = newlyUnlocked[0]
      setNewAchievement(firstAchievement)
      setShowAchievementModal(true)
      hapticSuccess()

      // Play achievement sound (use streak sound for streak achievements)
      if (firstAchievement.id.includes('streak')) {
        soundStreakExtended()
      } else {
        soundAchievement()
      }

      // Award XP for achievements
      if (addXP) {
        newlyUnlocked.forEach(achievement => {
          addXP(achievement.xpReward, `Achievement: ${achievement.name}`)
        })
      }
    }
  }, [state.unlockedAchievements])

  // Get all achievements with unlock status
  const getAllAchievements = useCallback(() => {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      isUnlocked: state.unlockedAchievements.includes(achievement.id),
    }))
  }, [state.unlockedAchievements])

  // Get unlocked count
  const unlockedCount = state.unlockedAchievements.length
  const totalCount = ACHIEVEMENTS.length

  // Dismiss achievement modal
  const dismissAchievement = useCallback(() => {
    setShowAchievementModal(false)
    setNewAchievement(null)
  }, [])

  // Reset achievements (for testing)
  const resetAchievements = useCallback(() => {
    setState({ unlockedAchievements: [], lastChecked: new Date().toISOString() })
  }, [])

  return {
    unlockedAchievements: state.unlockedAchievements,
    unlockedCount,
    totalCount,
    checkAchievements,
    getAllAchievements,
    newAchievement,
    showAchievementModal,
    dismissAchievement,
    resetAchievements,
  }
}
