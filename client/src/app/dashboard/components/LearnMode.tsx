'use client'

import { useState } from 'react'
import type { QuestionType } from '@/lib/groq'

interface LearnModeQuestion {
  question: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  keywords?: string[]
  acceptableAnswers?: string[]
}

interface LearnModeProps {
  questions: LearnModeQuestion[]
  currentIndex: number
  onAnswerSelect: (answer: string) => void
  onSubmitAnswer: () => void
  onNextQuestion: () => void
  onExit: () => void
  selectedAnswer: string | null
  showExplanation: boolean
}

export function LearnMode({
  questions,
  currentIndex,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  onExit,
  selectedAnswer,
  showExplanation,
}: LearnModeProps) {
  const currentQuestion = questions[currentIndex]

  const handleAnswerClick = (option: string) => {
    if (!showExplanation) {
      onAnswerSelect(option)
    }
  }

  return (
    <div className="space-y-4 pb-20 animate-zoom-in">
      {/* Header with Exit Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learn Mode</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#151E2F] rounded-xl p-5 sm:p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-[#1E293B] space-y-4">
        <div>
          <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
            {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
          </span>
        </div>
        <h4 className="text-xl font-semibold text-gray-900 dark:text-[#F1F5F9]">
          {currentQuestion.question}
        </h4>

        {/* Answer Options */}
        <div className="space-y-3">
          {(currentQuestion.type === 'true_false' &&
          (!currentQuestion.options || currentQuestion.options.length === 0)
            ? ['True', 'False']
            : currentQuestion.options
          ).map((option, idx) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === currentQuestion.correctAnswer
            const showCorrect = showExplanation && isCorrect
            const showIncorrect = showExplanation && isSelected && !isCorrect

            return (
              <button
                key={idx}
                onClick={() => handleAnswerClick(option)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                  showCorrect
                    ? 'bg-green-100 dark:bg-green-500/15 border-2 border-green-500 dark:border-green-400 text-green-900 dark:text-green-200'
                    : showIncorrect
                    ? 'bg-red-100 dark:bg-red-500/15 border-2 border-red-500 dark:border-red-400 text-red-900 dark:text-red-200'
                    : isSelected && !showExplanation
                    ? 'bg-blue-100 dark:bg-blue-500/15 border-2 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-[#1E293B] border-2 border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F1F5F9] hover:bg-gray-200 dark:hover:bg-[#263549] hover:border-gray-400 dark:hover:border-[#475569]'
                } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={`mt-4 p-4 sm:p-5 rounded-xl ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/40'
                : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/40'
            }`}
          >
            <p
              className={`text-sm ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}
            >
              <strong>Explanation:</strong> {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!showExplanation && selectedAnswer ? (
          <button
            onClick={onSubmitAnswer}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all"
          >
            Submit Answer
          </button>
        ) : showExplanation ? (
          <button
            onClick={onNextQuestion}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
