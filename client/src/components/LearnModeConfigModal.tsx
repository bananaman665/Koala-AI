'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, HelpCircle, PenTool, BookOpen, Target, TrendingUp, AlertCircle, X } from 'lucide-react'
import { QuestionType, DifficultyLevel } from '@/lib/claude'

export interface LearnModeConfig {
  numberOfQuestions: number
  questionTypes: QuestionType[]
  difficulty: DifficultyLevel
}

interface LearnModeConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (config: LearnModeConfig) => void
  isGenerating: boolean
}

const questionTypeOptions: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    icon: <CheckCircle2 size={20} />,
  },
  {
    type: 'true_false',
    label: 'True / False',
    icon: <HelpCircle size={20} />,
  },
  {
    type: 'written',
    label: 'Written',
    icon: <PenTool size={20} />,
  },
  {
    type: 'fill_in_blank',
    label: 'Fill in Blank',
    icon: <BookOpen size={20} />,
  },
]

const difficultyOptions: { level: DifficultyLevel; label: string; icon: React.ReactNode }[] = [
  { level: 'easy', label: 'Easy', icon: <Target size={20} /> },
  { level: 'medium', label: 'Medium', icon: <TrendingUp size={20} /> },
  { level: 'hard', label: 'Hard', icon: <AlertCircle size={20} /> },
]

const questionCountOptions = [5, 10, 15, 20]

export function LearnModeConfigModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: LearnModeConfigModalProps) {
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple_choice', 'true_false'])
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium')
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen])

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }

  const handleGenerate = () => {
    onGenerate({
      numberOfQuestions,
      questionTypes: selectedTypes,
      difficulty,
    })
  }

  const handleClose = () => {
    if (!isGenerating) {
      onClose()
    }
  }

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Bottom Sheet - Full Screen */}
      <div
        className={`absolute top-12 inset-x-0 bottom-0 transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-full bg-gray-900 overflow-hidden flex flex-col rounded-t-3xl">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="bg-indigo-600 mx-4 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Quiz Configuration</h2>
                  <p className="text-white/80 text-sm">Test your knowledge</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col justify-evenly h-full min-h-fit gap-6">
              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  How many questions?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {questionCountOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setNumberOfQuestions(count)}
                      disabled={isGenerating}
                      className={`py-3 rounded-xl font-semibold text-lg transition-all ${
                        numberOfQuestions === count
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-4">
                  Question types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {questionTypeOptions.map((option) => {
                    const isSelected = selectedTypes.includes(option.type)
                    return (
                      <button
                        key={option.type}
                        onClick={() => toggleQuestionType(option.type)}
                        disabled={isGenerating}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-900/30'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        } disabled:opacity-50`}
                      >
                        <span className={`mb-2 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`}>
                          {option.icon}
                        </span>
                        <span className={`font-medium text-xs text-center ${isSelected ? 'text-indigo-300' : 'text-gray-300'}`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-4">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {difficultyOptions.map((option) => {
                    const isSelected = difficulty === option.level
                    return (
                      <button
                        key={option.level}
                        onClick={() => setDifficulty(option.level)}
                        disabled={isGenerating}
                        className={`py-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        } disabled:opacity-50`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="p-4 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedTypes.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Creating your quiz...
                </>
              ) : (
                <>
                  <span className="text-lg">⚡</span>
                  Create Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
