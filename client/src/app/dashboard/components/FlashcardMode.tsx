'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { hapticSelection, hapticSuccess, hapticButton } from '@/lib/haptics'

interface Flashcard {
  question: string
  answer: string
}

interface FlashcardModeProps {
  flashcards: Flashcard[]
  onExit: () => void
}

export function FlashcardMode({ flashcards, onExit }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set())
  const [showCompletionScreen, setShowCompletionScreen] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      hapticSelection()
      setSlideDirection('right')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
        setSlideDirection(null)
      }, 150)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      hapticSelection()
      setSlideDirection('left')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setSlideDirection(null)
      }, 150)
    } else if (masteredCards.size > 0) {
      // Show completion screen when reaching the end
      hapticSuccess()
      setShowCompletionScreen(true)
    }
  }, [currentIndex, flashcards.length, masteredCards.size])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevious, handleNext])

  const toggleMastered = () => {
    hapticButton()
    const newMastered = new Set(masteredCards)
    if (newMastered.has(currentIndex)) {
      newMastered.delete(currentIndex)
    } else {
      newMastered.add(currentIndex)
      hapticSuccess()
    }
    setMasteredCards(newMastered)
  }

  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const masteredCount = masteredCards.size

  // Completion Screen
  if (showCompletionScreen) {
    const percentage = Math.round((masteredCount / flashcards.length) * 100)
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-[#0F172A] flex flex-col z-[100]">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.06]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={onExit}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <X size={22} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Complete!</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-12 pt-20">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
            <Sparkles size={48} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Great work!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
            You've reviewed all {flashcards.length} flashcards
          </p>

          {/* Stats Card */}
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06] mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-500 mb-2">
                {percentage}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {masteredCount} of {flashcards.length} cards mastered
              </p>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center mt-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#22c55e"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${percentage * 3.52} 352`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => {
                setShowCompletionScreen(false)
                setCurrentIndex(0)
                setIsFlipped(false)
                setMasteredCards(new Set())
              }}
              className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
              Study Again
            </button>
            <button
              onClick={onExit}
              className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-[#0F172A] flex flex-col z-[100] overflow-y-auto">
      {/* Safe area background fill */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl z-[101]" style={{ height: 'env(safe-area-inset-top)' }} />
      
      {/* Header */}
      <div className="fixed left-0 right-0 z-[101] bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.06]" style={{ top: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onExit}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={22} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Flashcards</h1>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
            {currentIndex + 1}/{flashcards.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5rem)' }}>
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mastered</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{masteredCount}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Star size={18} className="fill-gray-400 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{flashcards.length - masteredCount}</p>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div
            className={`w-full max-w-md cursor-pointer transition-all duration-300 ease-out ${
              slideDirection === 'left' 
                ? '-translate-x-full opacity-0' 
                : slideDirection === 'right'
                ? 'translate-x-full opacity-0'
                : 'translate-x-0 opacity-100'
            }`}
            onClick={() => {
              hapticSelection()
              setIsFlipped(!isFlipped)
            }}
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full aspect-[4/3] transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front - Question */}
              <div
                className="absolute inset-0 bg-white dark:bg-[#1E293B] rounded-3xl shadow-xl border border-gray-100 dark:border-white/[0.06] p-6 flex flex-col"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    Question
                  </span>
                  {masteredCards.has(currentIndex) && (
                    <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                      Mastered
                    </span>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed">
                    {flashcards[currentIndex].question}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                  Tap to reveal answer
                </p>
              </div>

              {/* Back - Answer */}
              <div
                className="absolute inset-0 bg-blue-500 rounded-3xl shadow-xl p-6 flex flex-col"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                    Answer
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xl font-semibold text-white text-center leading-relaxed">
                    {flashcards[currentIndex].answer}
                  </p>
                </div>
                <p className="text-xs text-white/60 text-center mt-4">
                  Tap to see question
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-4 mt-6">
          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
              disabled={currentIndex === 0}
              className="w-14 h-14 rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={toggleMastered}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all active:scale-95 shadow-sm ${
                masteredCards.has(currentIndex)
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/10'
              }`}
            >
              {masteredCards.has(currentIndex) ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-white" />
                  Mastered
                </span>
              ) : (
                'Mark as Mastered'
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              disabled={currentIndex === flashcards.length - 1 && masteredCards.size === 0}
              className="w-14 h-14 rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Card Dots */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-xs mx-auto">
            {flashcards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  hapticSelection()
                  setCurrentIndex(idx)
                  setIsFlipped(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'w-6 bg-blue-500'
                    : masteredCards.has(idx)
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
