'use client'

import { ACHIEVEMENTS, AchievementId } from '@/hooks/useAchievements'

interface AchievementCardProps {
  achievement: typeof ACHIEVEMENTS[number] & { isUnlocked: boolean }
  size?: 'sm' | 'md'
}

export function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const Icon = achievement.icon
  
  const sizes = {
    sm: {
      container: 'p-3',
      icon: 'w-8 h-8',
      iconInner: 'w-4 h-4',
      title: 'text-xs',
      desc: 'text-[10px]',
      xp: 'text-[10px]',
    },
    md: {
      container: 'p-4',
      icon: 'w-12 h-12',
      iconInner: 'w-6 h-6',
      title: 'text-sm',
      desc: 'text-xs',
      xp: 'text-xs',
    },
  }

  const config = sizes[size]

  // Category colors
  const getCategoryColor = () => {
    switch (achievement.category) {
      case 'getting_started': return 'bg-green-500'
      case 'recording': return 'bg-blue-500'
      case 'time': return 'bg-purple-500'
      case 'streak': return 'bg-orange-500'
      case 'quiz': return 'bg-pink-500'
      case 'courses': return 'bg-teal-500'
      case 'level': return 'bg-amber-500'
      case 'special': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`${config.container} rounded-2xl border transition-all ${
        achievement.isUnlocked
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`${config.icon} rounded-xl flex items-center justify-center flex-shrink-0 ${
            achievement.isUnlocked
              ? getCategoryColor()
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {achievement.isUnlocked ? (
            <Icon className={`${config.iconInner} text-white`} />
          ) : (
            <Lock className={`${config.iconInner} text-gray-400 dark:text-gray-500`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`${config.title} font-semibold ${
            achievement.isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {achievement.name}
          </h3>
          <p className={`${config.desc} text-gray-500 dark:text-gray-400 mt-0.5`}>
            {achievement.description}
          </p>
          <p className={`${config.xp} font-medium mt-1 ${
            achievement.isUnlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
          }`}>
            +{achievement.xpReward} XP
          </p>
        </div>
      </div>
    </div>
  )
}

interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
  achievements: Array<typeof ACHIEVEMENTS[number] & { isUnlocked: boolean }>
  unlockedCount: number
  totalCount: number
}

export function AchievementsModal({ isOpen, onClose, achievements, unlockedCount, totalCount }: AchievementsModalProps) {
  if (!isOpen) return null

  // Group achievements by category
  const categories = [
    { id: 'getting_started', name: 'Getting Started', icon: "🚀" },
    { id: 'recording', name: 'Recording', icon: "🎤" },
    { id: 'time', name: 'Time', icon: "⏰" },
    { id: 'streak', name: 'Streaks', icon: "🔥" },
    { id: 'quiz', name: 'Quizzes', icon: "🧠" },
    { id: 'courses', name: 'Courses', icon: "📚" },
    { id: 'level', name: 'Levels', icon: "⭐" },
    { id: 'special', name: 'Special', icon: "✨" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unlockedCount} of {totalCount} unlocked
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="sr-only">Close</span>
              <span className="text-lg">❌</span>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryAchievements = achievements.filter(a => a.category === category.id)
              if (categoryAchievements.length === 0) return null

              const CategoryIcon = category.icon
              return (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <CategoryIcon className="w-4 h-4" />
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {categoryAchievements.map(achievement => (
                      <AchievementCard key={achievement.id} achievement={achievement} size="sm" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AchievementUnlockedModalProps {
  isOpen: boolean
  onClose: () => void
  achievement: typeof ACHIEVEMENTS[number] | null
}

export function AchievementUnlockedModal({ isOpen, onClose, achievement }: AchievementUnlockedModalProps) {
  if (!isOpen || !achievement) return null

  const Icon = achievement.icon

  const getCategoryColor = () => {
    switch (achievement.category) {
      case 'getting_started': return 'bg-green-500'
      case 'recording': return 'bg-blue-500'
      case 'time': return 'bg-purple-500'
      case 'streak': return 'bg-orange-500'
      case 'quiz': return 'bg-pink-500'
      case 'courses': return 'bg-teal-500'
      case 'level': return 'bg-amber-500'
      case 'special': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate-bounce-in">
        {/* Celebration Header */}
        <div className={`${getCategoryColor()} p-8 text-center text-white relative overflow-hidden`}>
          {/* Sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
          
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">🏆</span>
            </div>
            <h2 className="text-lg font-bold mb-1 opacity-90">Achievement Unlocked!</h2>
            <div className="w-20 h-20 mx-auto my-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <p className="text-2xl font-bold">{achievement.name}</p>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {achievement.description}
          </p>
          <p className="text-green-600 dark:text-green-400 font-semibold mb-6">
            +{achievement.xpReward} XP
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 ${getCategoryColor()} text-white rounded-xl font-medium transition-transform hover:scale-105 active:scale-95`}
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  )
}
