'use client'

import { useState } from 'react'
import { FiX, FiZap, FiBook, FiEdit3, FiCheckCircle, FiHelpCircle, FiTarget, FiTrendingUp, FiAlertCircle } from 'react-icons/fi'
import { QuestionType, DifficultyLevel } from '@/lib/groq'

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
    icon: <FiCheckCircle className="w-6 h-6" />,
  },
  {
    type: 'true_false',
    label: 'True / False',
    icon: <FiHelpCircle className="w-6 h-6" />,
  },
  {
    type: 'written',
    label: 'Written',
    icon: <FiEdit3 className="w-6 h-6" />,
  },
  {
    type: 'fill_in_blank',
    label: 'Fill in Blank',
    icon: <FiBook className="w-6 h-6" />,
  },
]

const difficultyOptions: { level: DifficultyLevel; label: string; icon: React.ReactNode }[] = [
  { level: 'easy', label: 'Easy', icon: <FiTarget className="w-5 h-5" /> },
  { level: 'medium', label: 'Medium', icon: <FiTrendingUp className="w-5 h-5" /> },
  { level: 'hard', label: 'Hard', icon: <FiAlertCircle className="w-5 h-5" /> },
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiTarget className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Learn Mode</h2>
                <p className="text-white/80 text-sm">Test your knowledge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
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
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50`}
                  >
                    <span className={`mb-2 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                      {option.icon}
                    </span>
                    <span className={`font-medium text-xs text-center ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
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
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedTypes.length === 0}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Creating your quiz...
              </>
            ) : (
              <>
                <FiZap className="w-6 h-6" />
                Start Learning
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
