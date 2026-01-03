'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Cloud, CheckCircle, Fire, Star, Rocket } from '@phosphor-icons/react'

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
          bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          textGradient: 'from-amber-600 to-orange-600 dark:from-amber-300 dark:to-orange-300',
        }
      case 'afternoon':
        return {
          greeting: 'Good Afternoon',
          emoji: '☀️',
          icon: Cloud,
          color: 'from-blue-400 to-cyan-500',
          message: 'Keep up the momentum!',
          bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
          textGradient: 'from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-300',
        }
      case 'evening':
        return {
          greeting: 'Good Evening',
          emoji: '🌙',
          icon: Moon,
          color: 'from-indigo-400 to-purple-500',
          message: 'Time to wrap up the day strong!',
          bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
          textGradient: 'from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300',
        }
    }
  }

  const content = getGreetingContent()
  const IconComponent = content.icon

  const getMotivation = () => {
    if (streak >= 7) return "You're on fire with that streak! 🔥"
    if (lecturesCompletedToday > 0) return "Great work today! Keep it going!"
    if (totalXP > 5000) return "You're a power learner! Let's keep climbing!"
    return "Every day is a chance to learn something new!"
  }

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 flex flex-col items-center justify-center z-[100] p-4 backdrop-blur-sm`}>
      {/* Animated background elements */}
      <div className="absolute top-10 right-10 opacity-10 animate-float">
        <IconComponent size={120} weight="fill" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-10 animate-pulse">
        <Star size={100} weight="fill" />
      </div>

      {/* Content Card */}
      <div className="relative z-10 text-center space-y-6 max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
        {/* Greeting */}
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">{content.emoji}</div>
          <h1 className={`text-5xl font-bold bg-gradient-to-r ${content.textGradient} bg-clip-text text-transparent`}>
            {content.greeting}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {content.message}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {/* Streak */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-2">
              <Fire size={24} weight="fill" className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Day Streak</div>
          </div>

          {/* XP */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-2">
              <Star size={24} weight="fill" className="text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalXP.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total XP</div>
          </div>

          {/* Today's Lectures */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-2">
              <CheckCircle size={24} weight="fill" className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{lecturesCompletedToday}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Today's Lectures</div>
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {getMotivation()}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-full hover:shadow-lg transition-all duration-300 text-lg mt-8 flex items-center justify-center gap-2"
        >
          Let's Go!
          <Rocket size={20} weight="fill" />
        </button>
      </div>
    </div>
  )
}
