'use client'

import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20 animate-zoom-in">
      {/* Flashcard */}
      <div
        className="w-full max-w-md perspective-1000 cursor-pointer"
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
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">
              Question
            </span>
            <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              {flashcards[currentIndex].question}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">Tap to flip</p>
          </div>

          {/* Back - Answer */}
          <div
            className="absolute inset-0 bg-purple-50 dark:bg-purple-900/30 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-6 flex flex-col items-center justify-center backface-hidden rotate-y-180"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">
              Answer
            </span>
            <p className="text-lg font-semibold text-purple-900 dark:text-purple-100 text-center">
              {flashcards[currentIndex].answer}
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-6">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center space-x-6 mt-8">
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

        <div className="text-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

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

      {/* Keyboard Hint */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Use arrow keys or swipe to navigate
      </p>

      {/* Exit Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onExit()
        }}
        className="mt-8 px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 font-medium transition-colors"
      >
        ← Back to Lecture
      </button>
    </div>
  )
}
