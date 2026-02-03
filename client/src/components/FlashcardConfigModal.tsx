'use client'

import { useState } from 'react'

export interface FlashcardConfig {
  numberOfCards: number
}

interface FlashcardConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (config: FlashcardConfig) => void
  isGenerating: boolean
}

const cardCountOptions = [5, 10, 15, 20, 25]

export function FlashcardConfigModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: FlashcardConfigModalProps) {
  const [numberOfCards, setNumberOfCards] = useState(10)

  const handleGenerate = () => {
    onGenerate({
      numberOfCards,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Layers className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Flashcards</h2>
                <p className="text-white/80 text-sm">Study with cards</p>
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
          {/* Number of Cards */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              How many flashcards?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {cardCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setNumberOfCards(count)}
                  disabled={isGenerating}
                  className={`py-3 rounded-xl font-semibold text-lg transition-all ${
                    numberOfCards === count
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3 px-1">
              <span>Quick review</span>
              <span>Deep study</span>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-200 dark:border-purple-500/20">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <span className="font-semibold">Tip:</span> Flashcards are generated from your lecture notes. Each card has a question on the front and an answer on the back.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Creating flashcards...
              </>
            ) : (
              <>
                <Layers className="w-6 h-6" />
                Generate {numberOfCards} Cards
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
