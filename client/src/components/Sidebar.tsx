'use client'

import Link from 'next/link'
import { Home, Library, BarChart3, Users, Flame, Settings } from 'lucide-react'

interface SidebarProps {
  activeScreen: 'dashboard' | 'library' | 'analytics' | 'feed'
  onNavigate: (screen: 'dashboard' | 'library' | 'analytics' | 'feed') => void
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

export function Sidebar({
  activeScreen,
  onNavigate,
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
}: SidebarProps) {
  const isDisabled = isRecording || isStoppingRecording || isGeneratingNotes || isTranscribing

  const navItems = [
    { id: 'dashboard', label: 'Home' },
    { id: 'library', label: 'Library' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'feed', label: 'Classes' },
  ]

  const iconMap = {
    dashboard: Home,
    library: Library,
    analytics: BarChart3,
    feed: Users,
  } as const

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:bg-white dark:lg:bg-[#1a2235] lg:border-r lg:border-gray-200 dark:lg:border-white/[0.08] lg:z-40">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-gray-200 dark:border-white/[0.08]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Koala.ai</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = iconMap[item.id as keyof typeof iconMap]
          const isActive = activeScreen === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}

        {/* Record Button - Hidden (using FAB on desktop instead) */}
        {/* <button
          onClick={onStartRecording}
          disabled={isDisabled}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
        >
          <span className="text-lg">🎤</span>
          <span>Record Lecture</span>
        </button> */}
      </nav>

      {/* User Info Section - Bottom */}
      <div className="border-t border-gray-200 dark:border-white/[0.08] p-4 space-y-3">
        {/* Level Badge */}
        <button
          onClick={onShowLevelModal}
          className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-2 py-1 rounded-lg w-full transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{levelInfo.level}</span>
          </div>
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 truncate">
            {levelInfo.name}
          </span>
        </button>

        {/* Streak */}
        <button
          onClick={onShowStreakModal}
          className="flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-2 py-1 rounded-lg w-full transition-colors"
        >
          <Flame size={20} className="text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
        </button>

        {/* Settings & Profile */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-700 dark:text-gray-300" />
          </Link>
          <Link
            href="/profile"
            className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            {userEmail?.substring(0, 2).toUpperCase() || 'AN'}
          </Link>
        </div>
      </div>
    </aside>
  )
}
