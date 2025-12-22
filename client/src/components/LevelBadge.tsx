'use client'

import { useState } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { LevelInfo, LEVELS } from '@/hooks/useLevel'

interface LevelBadgeProps {
  levelInfo: LevelInfo
  totalXP: number
  size?: 'sm' | 'md'
  onClick?: () => void
}

export function LevelBadge({ levelInfo, totalXP, size = 'sm', onClick }: LevelBadgeProps) {
  const sizes = {
    sm: {
      container: 'px-2 py-1 gap-1.5',
      icon: 'w-4 h-4',
      text: 'text-xs',
      xp: 'text-[10px]',
    },
    md: {
      container: 'px-3 py-1.5 gap-2',
      icon: 'w-5 h-5',
      text: 'text-sm',
      xp: 'text-xs',
    },
  }

  const config = sizes[size]

  // Color based on level
  const getLevelColor = () => {
    if (levelInfo.level <= 2) return 'from-gray-400 to-gray-500'
    if (levelInfo.level <= 4) return 'from-green-400 to-emerald-500'
    if (levelInfo.level <= 6) return 'from-blue-400 to-indigo-500'
    if (levelInfo.level <= 8) return 'from-purple-400 to-violet-500'
    return 'from-amber-400 to-orange-500'
  }

  const getBgColor = () => {
    if (levelInfo.level <= 2) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    if (levelInfo.level <= 4) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (levelInfo.level <= 6) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    if (levelInfo.level <= 8) return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  }

  const getTextColor = () => {
    if (levelInfo.level <= 2) return 'text-gray-600 dark:text-gray-400'
    if (levelInfo.level <= 4) return 'text-green-600 dark:text-green-400'
    if (levelInfo.level <= 6) return 'text-blue-600 dark:text-blue-400'
    if (levelInfo.level <= 8) return 'text-purple-600 dark:text-purple-400'
    return 'text-amber-600 dark:text-amber-400'
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center ${config.container} rounded-full border ${getBgColor()} transition-all hover:scale-105 active:scale-95`}
    >
      <div className={`${config.icon} rounded-full bg-gradient-to-br ${getLevelColor()} flex items-center justify-center`}>
        <span className="text-white text-[10px] font-bold">{levelInfo.level}</span>
      </div>
      <div className="flex flex-col items-start">
        <span className={`${config.text} font-semibold ${getTextColor()} leading-tight`}>
          {levelInfo.name}
        </span>
        <div className="flex items-center gap-0.5">
          <Zap className={`w-2.5 h-2.5 ${getTextColor()}`} />
          <span className={`${config.xp} ${getTextColor()} font-medium`}>
            {totalXP.toLocaleString()} XP
          </span>
        </div>
      </div>
    </button>
  )
}

interface LevelProgressModalProps {
  isOpen: boolean
  onClose: () => void
  levelInfo: LevelInfo
  totalXP: number
  xpHistory: Array<{ action: string; xp: number; timestamp: string }>
}

export function LevelProgressModal({ isOpen, onClose, levelInfo, totalXP, xpHistory }: LevelProgressModalProps) {
  if (!isOpen) return null

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'from-gray-400 to-gray-500'
    if (level <= 4) return 'from-green-400 to-emerald-500'
    if (level <= 6) return 'from-blue-400 to-indigo-500'
    if (level <= 8) return 'from-purple-400 to-violet-500'
    return 'from-amber-400 to-orange-500'
  }

  const getProgressColor = () => {
    if (levelInfo.level <= 2) return 'bg-gray-500'
    if (levelInfo.level <= 4) return 'bg-green-500'
    if (levelInfo.level <= 6) return 'bg-blue-500'
    if (levelInfo.level <= 8) return 'bg-purple-500'
    return 'bg-amber-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header with Level */}
        <div className={`bg-gradient-to-br ${getLevelColor(levelInfo.level)} p-6 text-center text-white`}>
          <div className="w-20 h-20 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-4xl font-bold">{levelInfo.level}</span>
          </div>
          <h2 className="text-2xl font-bold">{levelInfo.name}</h2>
          <p className="text-white/80 text-sm mt-1">{totalXP.toLocaleString()} Total XP</p>
        </div>

        <div className="p-6">
          {/* Progress to Next Level */}
          {levelInfo.level < 10 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress to Level {levelInfo.level + 1}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {levelInfo.xpForCurrentLevel} / {levelInfo.xpForNextLevel} XP
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor()} rounded-full transition-all duration-500`}
                  style={{ width: `${levelInfo.progress * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel} XP to next level
              </p>
            </div>
          )}

          {/* All Levels */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">All Levels</h3>
            <div className="grid grid-cols-5 gap-2">
              {LEVELS.map((level) => (
                <div
                  key={level.level}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 ${
                    levelInfo.level >= level.level
                      ? `bg-gradient-to-br ${getLevelColor(level.level)} text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  <span className="text-lg font-bold">{level.level}</span>
                  <span className="text-[8px] leading-tight truncate w-full">{level.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent XP */}
          {xpHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Recent XP</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {xpHistory.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{entry.action}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium ml-2">+{entry.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: { level: number; name: string } | null
}

export function LevelUpModal({ isOpen, onClose, newLevel }: LevelUpModalProps) {
  if (!isOpen || !newLevel) return null

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'from-gray-400 to-gray-500'
    if (level <= 4) return 'from-green-400 to-emerald-500'
    if (level <= 6) return 'from-blue-400 to-indigo-500'
    if (level <= 8) return 'from-purple-400 to-violet-500'
    return 'from-amber-400 to-orange-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate-bounce-in">
        {/* Celebration Header */}
        <div className={`bg-gradient-to-br ${getLevelColor(newLevel.level)} p-8 text-center text-white relative overflow-hidden`}>
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
          
          <div className="relative">
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold mb-1">Level Up!</h2>
            <div className="w-24 h-24 mx-auto my-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-5xl font-bold">{newLevel.level}</span>
            </div>
            <p className="text-xl font-semibold">{newLevel.name}</p>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've reached a new level! Keep up the great work!
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 bg-gradient-to-r ${getLevelColor(newLevel.level)} text-white rounded-xl font-medium transition-transform hover:scale-105 active:scale-95`}
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  )
}
