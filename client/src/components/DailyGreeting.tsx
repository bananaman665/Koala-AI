'use client'

import { useState, useEffect } from 'react'

interface DailyGreetingProps {
  userName?: string
  streak: number
  totalXP: number
  lecturesCompletedToday: number
  onDismiss: () => void
}

export function DailyGreeting({
  userName = 'there',
  streak,
  totalXP,
  lecturesCompletedToday,
  onDismiss,
}: DailyGreetingProps) {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setTimeOfDay('morning')
    } else if (hour < 18) {
      setTimeOfDay('afternoon')
    } else {
      setTimeOfDay('evening')
    }
  }, [])

  const getGreetingContent = () => {
    switch (timeOfDay) {
      case 'morning':
        return {
          greeting: 'Good Morning',
          emoji: '🌅',
          icon: Sun,
          color: 'from-amber-400 to-orange-500',
          message: 'Ready to ace your studies today?',
          bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950',
          textGradient: 'from-amber-600 to-orange-600 dark:from-amber-300 dark:to-orange-300',
        }
      case 'afternoon':
        return {
          greeting: 'Good Afternoon',
          emoji: '☀️',
          icon: Cloud,
          color: 'from-blue-400 to-cyan-500',
          message: 'Keep up the momentum!',
          bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
          textGradient: 'from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-300',
        }
      case 'evening':
        return {
          greeting: 'Good Evening',
          emoji: '🌙',
          icon: Moon,
          color: 'from-indigo-400 to-purple-500',
          message: 'Time to wrap up the day strong!',
          bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950',
          textGradient: 'from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300',
        }
    }
  }

  const content = getGreetingContent()

  const getMotivation = () => {
    if (streak >= 7) return "You're on fire with that streak! 🔥"
    if (lecturesCompletedToday > 0) return "Great work today! Keep it going!"
    if (totalXP > 5000) return "You're a power learner! Let's keep climbing!"
    return "Every day is a chance to learn something new!"
  }

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-gradient-to-br ${content.bgGradient} z-[100] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto`}>
      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
      >
        <X size={24} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl text-center space-y-8 sm:space-y-10">
        {/* Main Greeting */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-8xl sm:text-9xl animate-bounce">{content.emoji}</div>
          <div>
            <h1 className={`text-6xl sm:text-7xl lg:text-8xl font-black bg-gradient-to-r ${content.textGradient} bg-clip-text text-transparent leading-tight`}>
              {content.greeting}
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 mt-4 font-medium">
              {content.message}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-12">
          {/* Streak */}
          <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-200 border border-white/40 dark:border-gray-700/40">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Flame size={40} className="text-orange-500" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">{streak}</div>
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-2">Day Streak</div>
          </div>

          {/* XP */}
          <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-200 border border-white/40 dark:border-gray-700/40">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Star size={40} className="text-yellow-500" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">{(totalXP / 1000).toFixed(1)}k</div>
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-2">Total XP</div>
          </div>

          {/* Today's Lectures */}
          <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-200 border border-white/40 dark:border-gray-700/40">
            <div className="flex justify-center mb-3 sm:mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">{lecturesCompletedToday}</div>
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-2">Today's Lectures</div>
          </div>
        </div>

        {/* Motivation Box */}
        <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-white/40 dark:border-gray-700/40">
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-200 font-bold">
            {getMotivation()}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onDismiss}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-5 sm:py-6 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300 text-xl sm:text-2xl flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl"
        >
          Let's Go!
          <Rocket size={28} />
        </button>
      </div>
    </div>
  )
}
