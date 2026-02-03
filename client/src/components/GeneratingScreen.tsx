'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface GeneratingScreenProps {
  isVisible: boolean
  type: 'quiz' | 'flashcards'
}

export function GeneratingScreen({ isVisible, type }: GeneratingScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  const displayType = type === 'quiz' ? 'Quiz' : 'Flashcards'
  const messages = [
    `Generating your ${displayType}...`,
    'Using AI to create smart questions...',
    'Making learning interactive...',
    `Almost there with your ${displayType}...`,
  ]

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isVisible, messages.length])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Animated Icon */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Creating your {displayType}
          </h2>

          {/* Rotating Messages */}
          <p
            key={messageIndex}
            className="text-gray-300 text-center mb-8 h-6 animate-fade-in-out max-w-xs"
          >
            {messages[messageIndex]}
          </p>

          {/* Loading Dots */}
          <div className="flex gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
          </div>

          {/* Loading Bar */}
          <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* CSS for fade in/out animation */}
      <style jsx>{`
        @keyframes fade-in-out {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out;
        }
      `}</style>
    </div>
  )
}
