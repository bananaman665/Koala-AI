'use client'

import { useEffect, useState } from 'react'
import AppIcon from '@/components/AppIcon'

interface SplashScreenProps {
  onComplete?: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      if (onComplete) {
        setTimeout(onComplete, 300)
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="w-20 h-20 flex items-center justify-center">
          <AppIcon size="lg" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Koala.ai
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Learn smarter, study faster
        </p>

        {/* Loading Indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
            style={{
              animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '0s'
            }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
            style={{
              animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '0.2s'
            }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
            style={{
              animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '0.4s'
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}
