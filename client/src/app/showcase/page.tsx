'use client'

import { useState } from 'react'

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz'>('notes')
  const [isPlaying, setIsPlaying] = useState(false)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [currentFlashcard, setCurrentFlashcard] = useState(0)

  const flashcards = [
    { question: 'What is a binary tree?', answer: 'A hierarchical data structure where each node has at most two children' },
    { question: 'What are the three main traversal methods?', answer: 'In-order, Pre-order, and Post-order' },
    { question: 'What is the time complexity of balanced tree operations?', answer: 'O(log n)' },
  ]

  const handleNextFlashcard = () => {
    if (currentFlashcard < flashcards.length - 1) {
      setCurrentFlashcard(currentFlashcard + 1)
      setFlashcardFlipped(false)
    }
  }

  const handlePrevFlashcard = () => {
    if (currentFlashcard > 0) {
      setCurrentFlashcard(currentFlashcard - 1)
      setFlashcardFlipped(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Lecture Study Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preview of notes, flashcards, and quiz modes
          </p>
        </div>

        {/* Lecture Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Binary Trees & Tree Traversal
              </h2>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <span>CS101 - Data Structures</span>
                <span>•</span>
                <span>Nov 27, 2024</span>
                <span>•</span>
                <span>1h 15m</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
              Completed
            </span>
          </div>

          {/* Audio Player */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                {isPlaying ? (
                  <span className="text-lg">Pause</span>
                ) : (
                  <span className="text-lg">Play</span>
                )}
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>12:34</span>
                  <span>1:15:23</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm">
                1x
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'notes'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            "BookOpen"
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'flashcards'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            "FileText"
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            "CheckCircle2"
            <span>Quiz</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px]">
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* AI Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">Bot</span>
                  AI Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  This lecture covers the fundamentals of binary trees, a hierarchical data structure where each node has at most two children. Key topics include tree terminology, different types of binary trees, and three main traversal methods: in-order, pre-order, and post-order.
                </p>
              </div>

              {/* Key Points */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Points</h3>
                <div className="space-y-3">
                  {[
                    { time: '00:05:30', point: 'Definition: Binary tree is a hierarchical structure with max 2 children per node' },
                    { time: '00:24:40', point: 'Types of binary trees: Full, Complete, Perfect, and Balanced trees' },
                    { time: '00:38:20', point: 'In-order traversal: Left → Root → Right (produces sorted output for BST)' },
                    { time: '01:03:15', point: 'Time complexity: O(log n) for balanced trees, O(n) for skewed trees' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="flex-shrink-0 w-20 text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                        <span className="text-lg">Clock</span>
                        {item.time}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 flex-1">{item.point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics Covered */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topics Covered</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Binary Tree Structure
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A hierarchical data structure with nodes containing at most two children (left and right).
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      Tree Traversal Methods
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      In-order (LNR), Pre-order (NLR), and Post-order (LRN) traversal techniques.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
              {/* Flashcard */}
              <div
                className="w-full max-w-md cursor-pointer mb-8"
                onClick={() => setFlashcardFlipped(!flashcardFlipped)}
              >
                <div
                  className="relative w-full h-64 transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front - Question */}
                  <div
                    className="absolute inset-0 bg-white dark:bg-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-8 flex flex-col items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">
                      Question
                    </span>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                      {flashcards[currentFlashcard].question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">Tap to reveal answer</p>
                  </div>

                  {/* Back - Answer */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-8 flex flex-col items-center justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">
                      Answer
                    </span>
                    <p className="text-xl font-semibold text-purple-900 dark:text-purple-100 text-center">
                      {flashcards[currentFlashcard].answer}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-6">Tap to flip back</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevFlashcard()
                  }}
                  disabled={currentFlashcard === 0}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-lg">◀</span>
                </button>

                <div className="text-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {currentFlashcard + 1} / {flashcards.length}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextFlashcard()
                  }}
                  disabled={currentFlashcard === flashcards.length - 1}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-lg">▶</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Binary Trees Quiz
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  5 questions • 10 minutes
                </p>
              </div>

              {/* Quiz Questions */}
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Question 1 of 5
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">2 points</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 mb-4">
                    What is the time complexity of searching in a balanced binary search tree?
                  </p>
                  <div className="space-y-2">
                    {['O(1)', 'O(log n)', 'O(n)', 'O(n²)'].map((option, i) => (
                      <label key={i} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
                        <input type="radio" name="q1" className="mr-3" />
                        <span className="text-gray-800 dark:text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Question 2 of 5
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">2 points</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 mb-4">
                    Which traversal method visits nodes in sorted order for a BST?
                  </p>
                  <div className="space-y-2">
                    {['Pre-order', 'In-order', 'Post-order', 'Level-order'].map((option, i) => (
                      <label key={i} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
                        <input type="radio" name="q2" className="mr-3" />
                        <span className="text-gray-800 dark:text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow">
                  Submit Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
