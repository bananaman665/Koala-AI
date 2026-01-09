'use client'

import { useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi'

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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const toggleMastered = () => {
    const newMastered = new Set(masteredCards)
    if (newMastered.has(currentIndex)) {
      newMastered.delete(currentIndex)
    } else {
      newMastered.add(currentIndex)
    }
    setMasteredCards(newMastered)
  }

  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const masteredCount = masteredCards.size

  return (
    <div className="overflow-hidden h-full flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Progress & Card List (280px on desktop) */}
      <div className="flex-1 lg:w-[280px] lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-4 pt-4 pb-8 lg:pb-4">
          {/* Mobile: Navigation */}
          <div className="flex items-center justify-between mb-4 lg:hidden space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiChevronLeft className="text-lg text-gray-700 dark:text-gray-300" />
            </button>
            <div className="text-center flex-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentIndex + 1} / {flashcards.length}
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiChevronRight className="text-lg text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</h3>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {currentIndex + 1} / {flashcards.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Percentage */}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(progress)}% reviewed
            </p>
          </div>

          {/* Mastered Stats */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiCheck className="text-blue-600 dark:text-blue-400 text-sm" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Mastered</span>
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {masteredCount} / {flashcards.length}
            </p>
          </div>

          {/* Card List - Desktop Only */}
          <div className="hidden lg:flex lg:flex-col mt-6 space-y-2 max-h-[40vh] overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide px-1">Cards</h3>
            {flashcards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx)
                  setIsFlipped(false)
                }}
                className={`p-2 rounded-lg text-xs font-medium text-left transition-all border ${
                  currentIndex === idx
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {masteredCards.has(idx) && (
                    <FiCheck className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                  <span className="truncate">Card {idx + 1}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: Exit Button */}
          <button
            onClick={onExit}
            className="hidden lg:block w-full mt-6 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Right Panel - Flashcard Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-8 lg:py-4 px-4">
        {/* Flashcard */}
        <div
          className="w-full max-w-md perspective-1000 cursor-pointer mb-8"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-64 transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front - Question */}
            <div
              className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-4">
                Question
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                {flashcards[currentIndex].question}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">Tap to flip</p>
            </div>

            {/* Back - Answer */}
            <div
              className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-6 flex flex-col items-center justify-center backface-hidden rotate-y-180"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-4">
                Answer
              </span>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 text-center">
                {flashcards[currentIndex].answer}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-6">Tap to flip back</p>
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Navigation Buttons - Desktop */}
          <div className="hidden lg:flex items-center justify-center space-x-6">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiChevronLeft className="text-xl text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={toggleMastered}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                masteredCards.has(currentIndex)
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {masteredCards.has(currentIndex) ? '✓ Mastered' : 'Mark Mastered'}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              disabled={currentIndex === flashcards.length - 1}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiChevronRight className="text-xl text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Mobile: Mark Mastered Button */}
          <button
            onClick={toggleMastered}
            className={`lg:hidden px-6 py-2 rounded-lg font-medium text-sm transition-all w-full ${
              masteredCards.has(currentIndex)
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/40'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {masteredCards.has(currentIndex) ? '✓ Mastered' : 'Mark Mastered'}
          </button>

          {/* Keyboard Hint */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use arrow keys or swipe to navigate
          </p>

          {/* Exit Button - Mobile */}
          <button
            onClick={onExit}
            className="lg:hidden px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 font-medium text-sm transition-colors w-full"
          >
            ← Back to Lecture
          </button>
        </div>
      </div>
    </div>
  )
}
