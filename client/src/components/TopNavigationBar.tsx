'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { StreakDisplay } from './StreakDisplay'

interface TopNavigationBarProps {
  onStartRecording: () => void
  levelInfo: { level: number; name: string }
  streak: number
  userEmail: string | undefined
  isRecording: boolean
  isStoppingRecording: boolean
  isGeneratingNotes: boolean
  isTranscribing: boolean
  onShowLevelModal: () => void
  onShowStreakModal: () => void
}

export function TopNavigationBar({
  onStartRecording,
  levelInfo,
  streak,
  userEmail,
  isRecording,
  isStoppingRecording,
  isGeneratingNotes,
  isTranscribing,
  onShowLevelModal,
  onShowStreakModal,
}: TopNavigationBarProps) {
  const isDisabled = isRecording || isStoppingRecording || isGeneratingNotes || isTranscribing

  return (
    <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#1a2235] border-b border-gray-200 dark:border-white/[0.08] z-50 relative">
      {/* Cover left border where sidebar connects */}
      <div className="absolute left-0 top-0 w-64 h-full bg-white dark:bg-[#1a2235]"></div>
      <div className="flex items-center w-full px-6 max-w-[1920px] mx-auto relative">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            Koala.ai
          </div>
        </div>

        {/* Center Spacer */}
        <div className="flex-1" />

        {/* Right Section - User Info + Actions */}
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <button
            onClick={onShowLevelModal}
            className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{levelInfo.level}</span>
            </div>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 hidden xl:block">
              {levelInfo.name}
            </span>
          </button>

          {/* Streak - Duolingo Style */}
          <button
            onClick={onShowStreakModal}
            className="hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-lg transition-colors"
          >
            <StreakDisplay streak={streak} size="sm" />
          </button>

          {/* Record Button */}
          <button
            onClick={onStartRecording}
            disabled={isDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <span className="text-lg">➕</span>
            <span className="hidden xl:inline text-sm">Record</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-700 dark:text-gray-300" />
          </Link>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            {userEmail?.substring(0, 2).toUpperCase() || 'AN'}
          </Link>
        </div>
      </div>
    </nav>
  )
}
