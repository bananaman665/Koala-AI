import Link from 'next/link'
import { Flame, Settings } from 'lucide-react'
import { hapticButton } from '@/lib/haptics'

interface MobileTopNavProps {
  levelInfo: { level: number; name: string }
  streak: number
  userEmail: string | undefined
  onShowLevelModal: () => void
  onShowStreakModal: () => void
}

export function MobileTopNav({ levelInfo, streak, userEmail, onShowLevelModal, onShowStreakModal }: MobileTopNavProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1a2235] border-b border-gray-200 dark:border-white/[0.08] z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Combined Level & Streak */}
          <div className="flex items-center gap-0">
            {/* Level button */}
            <button
              onClick={() => { hapticButton(); onShowLevelModal() }}
              className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-1 rounded-full transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{levelInfo.level}</span>
              </div>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{levelInfo.name}</span>
            </button>

            <span className="text-gray-300 dark:text-gray-600">&middot;</span>

            {/* Streak button */}
            <button
              onClick={() => { hapticButton(); onShowStreakModal() }}
              className="flex items-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-1 rounded-full transition-colors"
            >
              <Flame size={20} className="text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streak} day{streak !== 1 ? 's' : ''}</span>
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Settings size={24} className="text-gray-700 dark:text-gray-300" />
            </Link>

            {/* Avatar */}
            <Link
              href="/profile"
              className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
            >
              {userEmail?.substring(0, 2).toUpperCase() || 'JD'}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
