import { Flame, Star, Trophy, Lock } from 'lucide-react'
import { StreakDisplay } from '@/components/StreakDisplay'
import { hapticButton } from '@/lib/haptics'

interface StreakDetailModalProps {
  isOpen: boolean
  streak: number
  isActiveToday: () => boolean
  onClose: () => void
}

export function StreakDetailModal({ isOpen, streak, isActiveToday, onClose }: StreakDetailModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

        {/* Large streak display */}
        <div className="text-center mb-6">
          <StreakDisplay streak={streak} size="lg" />
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {streak === 0 ? 'Start Your Streak!' : `${streak} Day Streak!`}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {streak === 0
              ? 'Record your first lecture today to begin your study streak.'
              : streak < 7
              ? 'Keep going! Record a lecture every day to build your streak.'
              : streak < 30
              ? "You're on fire! Keep up the great work."
              : "Amazing dedication! You're a study champion!"}
          </p>
        </div>

        {/* Weekly calendar */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">This Week</h3>
          <div className="flex justify-between">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const today = new Date().getDay()
              const adjustedToday = today === 0 ? 6 : today - 1
              const isToday = i === adjustedToday
              const isPast = i < adjustedToday
              const isActive = (isPast && streak > 0) || (isToday && isActiveToday())

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className={`text-xs ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {day}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-orange-500'
                      : isToday
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {isActive ? (
                      <Flame size={20} className="text-white" />
                    ) : (
                      <span className={`text-sm ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                        {isToday ? '?' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Milestones</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { days: 3, label: '3 days', icon: <span className="text-lg">🌱</span> },
              { days: 7, label: '1 week', icon: <Star size={20} className="text-yellow-500" /> },
              { days: 14, label: '2 weeks', icon: <span className="text-lg">🎖️</span> },
              { days: 30, label: '1 month', icon: <Trophy size={20} className="text-yellow-600" /> },
              { days: 60, label: '2 months', icon: <span className="text-lg">💎</span> },
              { days: 100, label: '100 days', icon: <span className="text-lg">👑</span> },
            ].map(({ days, label, icon }) => (
              <div
                key={days}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-center ${
                  streak >= days
                    ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
                    : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {streak >= days ? (
                  <div className="text-orange-600 dark:text-orange-400">{icon}</div>
                ) : (
                  <Lock size={20} className="text-gray-500 dark:text-gray-400 mx-auto" />
                )}
                <p className={`text-xs mt-1 font-medium ${streak >= days ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => { hapticButton(); onClose() }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          Keep Studying!
        </button>
      </div>
    </div>
  )
}
