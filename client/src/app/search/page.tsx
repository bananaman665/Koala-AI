'use client'

import Link from 'next/link'
import { useState } from 'react'
import AppIcon from '@/components/AppIcon'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const results = [
    {
      type: 'lecture',
      title: 'Binary Trees and Traversal',
      course: 'Data Structures & Algorithms',
      date: 'Nov 28, 2024',
      duration: '1h 15m',
      excerpt: 'Introduction to binary trees, including in-order, pre-order, and post-order traversal methods...'
    },
    {
      type: 'lecture',
      title: 'Neural Networks Basics',
      course: 'Machine Learning',
      date: 'Nov 27, 2024',
      duration: '1h 30m',
      excerpt: 'Fundamentals of neural networks, activation functions, and backpropagation...'
    },
    {
      type: 'note',
      title: 'Database Normalization',
      course: 'Database Systems',
      date: 'Nov 26, 2024',
      excerpt: 'Key concepts: 1NF, 2NF, 3NF, BCNF. Normalization reduces redundancy...'
    },
    {
      type: 'lecture',
      title: 'React Hooks Deep Dive',
      course: 'Web Development',
      date: 'Nov 25, 2024',
      duration: '55m',
      excerpt: 'Understanding useState, useEffect, useContext, and custom hooks...'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <AppIcon size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">Find your lectures, notes, and courses</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="text-lg">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lectures, notes, topics..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Results</option>
              <option value="lectures">Lectures Only</option>
              <option value="notes">Notes Only</option>
              <option value="courses">Courses Only</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-600">Quick filters:</span>
            {['This Week', 'Last Month', 'Favorites', 'CS Courses'].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stats */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{results.length}</span> results
          </p>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        result.type === 'lecture'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {result.type}
                    </span>
                    <span className="text-sm text-gray-600">{result.course}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                    {result.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{result.excerpt}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <span className="text-lg">📅</span>
                  <span>{result.date}</span>
                </div>
                {result.duration && (
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">⏰</span>
                    <span>{result.duration}</span>
                  </div>
                )}
                <Link href="/notes" className="text-blue-600 hover:text-blue-700 font-medium ml-auto">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {query && results.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">Try different keywords or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
