'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Microphone,
  Sparkle,
  Books,
  Fire,
  Trophy,
  ArrowRight,
  ArrowLeft,
  X
} from '@phosphor-icons/react'
import { hapticSelection, hapticSuccess } from '@/lib/haptics'

interface OnboardingCarouselProps {
  onComplete: () => void
  onSkip: () => void
}

interface Slide {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const slides: Slide[] = [
  {
    icon: <GraduationCap size={80} weight="duotone" />,
    title: 'Welcome to Koala.ai',
    description: 'Your AI-powered study companion for recording, transcribing, and mastering your lectures.',
    color: 'bg-blue-500',
  },
  {
    icon: <Microphone size={80} weight="duotone" />,
    title: 'One-Tap Recording',
    description: 'Record lectures with a single tap. We\'ll transcribe everything automatically using AI.',
    color: 'bg-green-500',
  },
  {
    icon: <Sparkle size={80} weight="duotone" />,
    title: 'AI-Powered Notes',
    description: 'Get intelligent, structured notes with summaries, key points, and action items.',
    color: 'bg-amber-500',
  },
  {
    icon: <Books size={80} weight="duotone" />,
    title: 'Study Your Way',
    description: 'Review with interactive flashcards, learn mode quizzes, or browse your organized notes.',
    color: 'bg-pink-500',
  },
  {
    icon: (
      <div className="flex items-center gap-2">
        <Fire size={70} weight="duotone" />
        <Trophy size={70} weight="duotone" />
      </div>
    ),
    title: 'Track Your Progress',
    description: 'Build study streaks, earn milestones, and stay consistent with your learning journey.',
    color: 'bg-orange-500',
  },
]

export function OnboardingCarousel({ onComplete, onSkip }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [isAnimating, setIsAnimating] = useState(false)

  const isLastSlide = currentSlide === slides.length - 1
  const isFirstSlide = currentSlide === 0

  // Prevent body scrolling while onboarding is active
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const goToNextSlide = () => {
    if (isAnimating) return
    hapticSelection()

    if (isLastSlide) {
      hapticSuccess()
      onComplete()
      return
    }

    setSlideDirection('right')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide(prev => prev + 1)
      setIsAnimating(false)
    }, 150)
  }

  const goToPrevSlide = () => {
    if (isAnimating || isFirstSlide) return
    hapticSelection()

    setSlideDirection('left')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1)
      setIsAnimating(false)
    }, 150)
  }

  const handleSkip = () => {
    hapticSelection()
    onSkip()
  }

  const slide = slides[currentSlide]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 pb-20 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1a2235] rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-in-up overflow-hidden mb-safe">
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Close/Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <X size={24} weight="bold" />
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          {/* Icon with gradient background */}
          <div
            className={`mx-auto w-40 h-40 rounded-full ${slide.color} flex items-center justify-center text-white mb-6 transition-all duration-300 ${
              isAnimating
                ? slideDirection === 'right'
                  ? 'opacity-0 translate-x-8'
                  : 'opacity-0 -translate-x-8'
                : 'opacity-100 translate-x-0'
            }`}
          >
            {slide.icon}
          </div>

          {/* Text content */}
          <div
            className={`text-center transition-all duration-300 ${
              isAnimating
                ? slideDirection === 'right'
                  ? 'opacity-0 translate-x-8'
                  : 'opacity-0 -translate-x-8'
                : 'opacity-100 translate-x-0'
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {slide.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (isAnimating) return
                hapticSelection()
                setSlideDirection(index > currentSlide ? 'right' : 'left')
                setIsAnimating(true)
                setTimeout(() => {
                  setCurrentSlide(index)
                  setIsAnimating(false)
                }, 150)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-6 bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={goToPrevSlide}
            disabled={isFirstSlide}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              isFirstSlide
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowLeft size={20} weight="bold" />
            Back
          </button>

          {/* Next/Get Started button */}
          <button
            onClick={goToNextSlide}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isLastSlide ? (
              <>
                Get Started
                <Sparkle size={20} weight="fill" />
              </>
            ) : (
              <>
                Next
                <ArrowRight size={20} weight="bold" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
