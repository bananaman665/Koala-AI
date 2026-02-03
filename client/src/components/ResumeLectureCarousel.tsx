'use client'

import { useState, useEffect } from 'react'
import { hapticSelection } from '@/lib/haptics'
import type { Database } from '@/lib/supabase'

type Lecture = Database['public']['Tables']['lectures']['Row']

interface ResumeLectureCarouselProps {
  lectures: Lecture[]
  onSelectLecture: (lectureId: string) => void
  onNavigateToLibrary: () => void
  onToggleFavorite?: (lectureId: string) => void
}

export function ResumeLectureCarousel({
  lectures,
  onSelectLecture,
  onNavigateToLibrary,
  onToggleFavorite,
}: ResumeLectureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const hasLectures = lectures && lectures.length > 0
  const currentLecture = hasLectures ? lectures[currentIndex] : null

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!hasLectures || lectures.length <= 1 || isAnimating || isPaused) return

    const timer = setTimeout(() => {
      if (currentIndex < lectures.length - 1) {
        goToNextSlide()
      } else {
        goToSlide(0)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [currentIndex, lectures?.length, isAnimating, isPaused, hasLectures])

  // Keyboard navigation
  useEffect(() => {
    if (!hasLectures) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevSlide()
      if (e.key === 'ArrowRight') goToNextSlide()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasLectures])

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return
    if (index < 0 || index >= lectures.length) return

    hapticSelection()
    const direction = index > currentIndex ? ('right' as const) : ('left' as const)
    setSlideDirection(direction)
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentIndex(index)
      setTimeout(() => setIsAnimating(false), 300)
    }, 150)
  }

  const goToNextSlide = () => {
    if (isAnimating || currentIndex >= lectures.length - 1) return

    hapticSelection()
    setSlideDirection('right')
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => setIsAnimating(false), 300)
    }, 150)
  }

  const goToPrevSlide = () => {
    if (isAnimating || currentIndex <= 0) return

    hapticSelection()
    setSlideDirection('left')
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1)
      setTimeout(() => setIsAnimating(false), 300)
    }, 150)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      goToNextSlide()
    }
    if (touchStart - touchEnd < -50) {
      goToPrevSlide()
    }
  }

  // Empty state - shown when no lectures
  if (!hasLectures || !currentLecture) {
    return (
      <div className="mb-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="flex items-center gap-3">
            {/* Microphone Icon */}
            <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="text-gray-400 dark:text-gray-500 text-lg" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                Get Started
              </p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Create lectures to boost your studying
              </h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Carousel Card */}
      <div
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02] active:scale-[0.98] hover:border-gray-200 dark:hover:border-white/[0.1] transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide Content */}
        <div
          className={`transition-all duration-300 ${
            isAnimating
              ? slideDirection === 'right'
                ? 'opacity-0 translate-x-8'
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          <div
            className="cursor-pointer group flex items-center gap-3"
            onClick={() => {
              onSelectLecture(currentLecture.id)
              onNavigateToLibrary()
            }}
          >
            {/* Green Play Icon */}
            <div className="w-11 h-11 bg-green-100 dark:bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="text-green-600 dark:text-green-400 text-lg" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                Resume
              </p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {currentLecture.title}
              </h3>
            </div>

            {/* Star Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                hapticSelection()
                onToggleFavorite?.(currentLecture.id)
              }}
              className="p-1 flex-shrink-0 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all duration-200 ml-1"
            >
              <Star
                className={`w-5 h-5 transition-all duration-200 ${
                  currentLecture.is_favorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-white/30 group-hover:text-yellow-400'
                }`}
              />
            </button>

            {/* Chevron */}
            <ChevronRight className="text-gray-300 dark:text-white/30 flex-shrink-0 group-hover:text-gray-400 dark:group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      {lectures.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {lectures.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 bg-green-600 dark:bg-green-500'
                  : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}

      {/* View All Link (when 5 lectures) */}
      {lectures.length === 5 && (
        <div className="text-center mt-3">
          <button
            onClick={onNavigateToLibrary}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            View all lectures
          </button>
        </div>
      )}
    </div>
  )
}
