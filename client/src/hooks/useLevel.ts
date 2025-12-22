'use client'

import { useState, useEffect, useCallback } from 'react'
import { hapticSuccess } from '@/lib/haptics'

// XP rewards for different actions
export const XP_REWARDS = {
  RECORD_LECTURE: 50,
  COMPLETE_QUIZ: 30,
  REVIEW_FLASHCARDS: 25,
  GENERATE_NOTES: 20,
  DAILY_STREAK: 15,
  FIRST_LECTURE: 100, // Bonus for first lecture
} as const

// Level definitions with thresholds and names
export const LEVELS = [
  { level: 1, name: 'Beginner', minXP: 0, maxXP: 100 },
  { level: 2, name: 'Learner', minXP: 100, maxXP: 250 },
  { level: 3, name: 'Student', minXP: 250, maxXP: 500 },
  { level: 4, name: 'Scholar', minXP: 500, maxXP: 1000 },
  { level: 5, name: 'Academic', minXP: 1000, maxXP: 2000 },
  { level: 6, name: 'Expert', minXP: 2000, maxXP: 3500 },
  { level: 7, name: 'Master', minXP: 3500, maxXP: 5500 },
  { level: 8, name: 'Professor', minXP: 5500, maxXP: 8000 },
  { level: 9, name: 'Genius', minXP: 8000, maxXP: 12000 },
  { level: 10, name: 'Legend', minXP: 12000, maxXP: Infinity },
] as const

export interface LevelInfo {
  level: number
  name: string
  currentXP: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progress: number // 0-1 progress to next level
}

interface LevelState {
  totalXP: number
  lastUpdated: string
  xpHistory: Array<{ action: string; xp: number; timestamp: string }>
}

const STORAGE_KEY = 'koala_level_system'

function getInitialState(): LevelState {
  if (typeof window === 'undefined') {
    return { totalXP: 0, lastUpdated: new Date().toISOString(), xpHistory: [] }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { totalXP: 0, lastUpdated: new Date().toISOString(), xpHistory: [] }
    }
  }
  return { totalXP: 0, lastUpdated: new Date().toISOString(), xpHistory: [] }
}

export function useLevel() {
  const [state, setState] = useState<LevelState>(getInitialState)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState<typeof LEVELS[number] | null>(null)

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

  // Calculate current level info
  const getLevelInfo = useCallback((xp: number): LevelInfo => {
    const levelData = LEVELS.find(l => xp >= l.minXP && xp < l.maxXP) || LEVELS[LEVELS.length - 1]
    const nextLevel = LEVELS.find(l => l.level === levelData.level + 1)
    
    const xpInCurrentLevel = xp - levelData.minXP
    const xpNeededForLevel = (nextLevel?.minXP || levelData.maxXP) - levelData.minXP
    const progress = Math.min(xpInCurrentLevel / xpNeededForLevel, 1)

    return {
      level: levelData.level,
      name: levelData.name,
      currentXP: xp,
      xpForCurrentLevel: xpInCurrentLevel,
      xpForNextLevel: xpNeededForLevel,
      progress,
    }
  }, [])

  const levelInfo = getLevelInfo(state.totalXP)

  // Add XP and check for level up
  const addXP = useCallback((amount: number, action: string) => {
    setState(prev => {
      const oldLevel = getLevelInfo(prev.totalXP).level
      const newTotalXP = prev.totalXP + amount
      const newLevelNum = getLevelInfo(newTotalXP).level

      // Check for level up
      if (newLevelNum > oldLevel) {
        const levelData = LEVELS.find(l => l.level === newLevelNum)
        if (levelData) {
          setNewLevel(levelData)
          setShowLevelUp(true)
          hapticSuccess()
        }
      }

      return {
        ...prev,
        totalXP: newTotalXP,
        lastUpdated: new Date().toISOString(),
        xpHistory: [
          { action, xp: amount, timestamp: new Date().toISOString() },
          ...prev.xpHistory.slice(0, 99), // Keep last 100 entries
        ],
      }
    })
  }, [getLevelInfo])

  // Dismiss level up modal
  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false)
    setNewLevel(null)
  }, [])

  // Reset XP (for testing/debug)
  const resetXP = useCallback(() => {
    setState({ totalXP: 0, lastUpdated: new Date().toISOString(), xpHistory: [] })
  }, [])

  return {
    totalXP: state.totalXP,
    levelInfo,
    addXP,
    showLevelUp,
    newLevel,
    dismissLevelUp,
    xpHistory: state.xpHistory,
    resetXP,
    XP_REWARDS,
  }
}
