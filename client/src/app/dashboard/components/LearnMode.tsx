'use client'

import { useState, useEffect } from 'react'
import { hapticSelection, hapticSuccess, hapticError, hapticButton } from '@/lib/haptics'
import { soundSuccess, soundError } from '@/lib/sounds'
import type { QuestionType } from '@/lib/claude'

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
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [showCompletionScreen, setShowCompletionScreen] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer
  const isLastQuestion = currentIndex === questions.length - 1

  // Track correct answers
  useEffect(() => {
    if (showExplanation && !answeredQuestions.has(currentIndex)) {
      setAnsweredQuestions(prev => new Set(prev).add(currentIndex))
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1)
        hapticSuccess()
        soundSuccess()
      } else {
        hapticError()
        soundError()
      }
    }
  }, [showExplanation, currentIndex, isCorrect, answeredQuestions])

  const handleAnswerClick = (option: string) => {
    if (!showExplanation) {
      hapticSelection()
      onAnswerSelect(option)
    }
  }

  const handleNextOrComplete = () => {
    hapticButton()
    if (isLastQuestion) {
      setShowCompletionScreen(true)
    } else {
      onNextQuestion()
    }
  }

  // Completion Screen
  if (showCompletionScreen) {
    const percentage = Math.round((correctAnswers / questions.length) * 100)
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
    const message = percentage >= 90 ? 'Outstanding!' : percentage >= 80 ? 'Great job!' : percentage >= 70 ? 'Good work!' : percentage >= 60 ? 'Keep practicing!' : 'Don\'t give up!'

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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-12 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${
            percentage >= 70 
              ? 'bg-amber-500 shadow-amber-500/25' 
              : 'bg-blue-500 shadow-blue-500/25'
          }`}>
            {percentage >= 70 ? (
              <Trophy size={48} weight="fill" className="text-white" />
            ) : (
              <Target size={48} weight="fill" className="text-white" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {message}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
            You've completed the quiz
          </p>

          {/* Score Card */}
          <div className="w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06] mb-8">
            {/* Big Score */}
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${
                percentage >= 70 
                  ? 'text-green-500' 
                  : 'text-blue-500'
              }`}>
                {percentage}%
              </div>
              <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                percentage >= 90 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                percentage >= 80 ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                percentage >= 70 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
              }`}>
                Grade: {grade}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={20} weight="fill" className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{correctAnswers}</p>
                <p className="text-xs text-green-600 dark:text-green-500">Correct</p>
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                  <XCircle size={20} weight="fill" className="text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{questions.length - correctAnswers}</p>
                <p className="text-xs text-red-600 dark:text-red-500">Incorrect</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => {
                setShowCompletionScreen(false)
                setCorrectAnswers(0)
                setAnsweredQuestions(new Set())
                // Reset to first question - this should trigger parent to reset
                onExit()
              }}
              className="w-full py-3.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/25"
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCw size={20} weight="bold" />
                Try Again
              </span>
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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz</h1>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
            {currentIndex + 1}/{questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5rem)' }}>
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={18} weight="fill" className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Correct</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{correctAnswers}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Lightning size={18} weight="fill" className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{questions.length - currentIndex - (showExplanation ? 1 : 0)}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
            {/* Question Type Badge */}
            <div className="px-5 pt-5">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                currentQuestion.type === 'multiple_choice'
                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
              }`}>
                {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'True / False'}
              </span>
            </div>

            {/* Question */}
            <div className="px-5 py-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Keywords */}
            {currentQuestion.keywords && currentQuestion.keywords.length > 0 && !showExplanation && (
              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="px-5 pb-5 space-y-3">
              {(currentQuestion.type === 'true_false' &&
              (!currentQuestion.options || currentQuestion.options.length === 0)
                ? ['True', 'False']
                : currentQuestion.options
              ).map((option, idx) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = option === currentQuestion.correctAnswer
                const showCorrect = showExplanation && isCorrectAnswer
                const showIncorrect = showExplanation && isSelected && !isCorrectAnswer

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerClick(option)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-2xl text-left font-medium transition-all active:scale-[0.98] ${
                      showCorrect
                        ? 'bg-green-100 dark:bg-green-500/15 border-2 border-green-500 text-green-900 dark:text-green-200'
                        : showIncorrect
                        ? 'bg-red-100 dark:bg-red-500/15 border-2 border-red-500 text-red-900 dark:text-red-200'
                        : isSelected && !showExplanation
                        ? 'bg-purple-100 dark:bg-purple-500/15 border-2 border-purple-500 text-purple-900 dark:text-purple-200'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Option Letter/Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        showCorrect
                          ? 'bg-green-500 text-white'
                          : showIncorrect
                          ? 'bg-red-500 text-white'
                          : isSelected && !showExplanation
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {showCorrect ? (
                          <CheckCircle size={18} weight="fill" />
                        ) : showIncorrect ? (
                          <XCircle size={18} weight="fill" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={`mx-5 mb-5 p-4 rounded-2xl ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30'
                  : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'
                  }`}>
                    {isCorrect ? (
                      <Sparkle size={18} weight="fill" className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Lightning size={18} weight="fill" className="text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${
                      isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                    }`}>
                      {isCorrect ? 'Correct!' : 'Not quite right'}
                    </p>
                    <p className={`text-sm ${
                      isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-6">
          {!showExplanation && selectedAnswer ? (
            <button
              onClick={() => {
                hapticButton()
                onSubmitAnswer()
              }}
              className="w-full py-4 rounded-2xl bg-purple-500 text-white font-semibold hover:bg-purple-600 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/25"
            >
              Submit Answer
            </button>
          ) : showExplanation ? (
            <button
              onClick={handleNextOrComplete}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
            >
              {isLastQuestion ? 'See Results' : 'Next Question'}
            </button>
          ) : (
            <div className="py-4 text-center text-gray-400 dark:text-gray-500 text-sm">
              Select an answer to continue
            </div>
          )}
        </div>

        {/* Question Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap max-w-xs mx-auto">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-6 bg-purple-500'
                  : answeredQuestions.has(idx)
                  ? idx < currentIndex && selectedAnswer === questions[idx].correctAnswer
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
