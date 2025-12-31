'use client'

import { useState } from 'react'
import { FiPlus, FiUsers } from 'react-icons/fi'
import { Lightbulb } from 'lucide-react'
import { hapticButton } from '@/lib/haptics'
import { SwipeToDelete } from '@/components/SwipeToDelete'

// Color classes for course icons (full class names for Tailwind to detect)
const courseColorClasses: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
}

interface FeedScreenProps {
  userClasses: any[]
  joinClassCode: string
  isJoiningClass: boolean
  onJoinClassCodeChange: (code: string) => void
  onJoinClass: () => void
  onCreateNewClass: () => void
  onViewClass: (classId: string) => void
  onDeleteClass: (classId: string) => void
}

export function FeedScreen({
  userClasses,
  joinClassCode,
  isJoiningClass,
  onJoinClassCodeChange,
  onJoinClass,
  onCreateNewClass,
  onViewClass,
  onDeleteClass,
}: FeedScreenProps) {
  return (
    <div className="overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8 pt-32 sm:pt-36 larger-phone:pt-36 larger-phone:sm:pt-40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Classes</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Collaborate with classmates</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                hapticButton()
                onCreateNewClass()
              }}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <FiPlus />
              <span className="hidden sm:inline">New Class</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Your Classes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Classes</h3>
              {userClasses && userClasses.length > 0 ? (
                <div className="space-y-3">
                  {userClasses.map((cls: any) => (
                    <SwipeToDelete
                      key={cls.id}
                      onDelete={() => onDeleteClass(cls.id)}
                      itemName={`"${cls.name}"`}
                    >
                      <div
                        className="p-4 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 ${
                                courseColorClasses[cls.color]?.bg || courseColorClasses.blue.bg
                              } rounded-xl flex items-center justify-center flex-shrink-0`}
                            >
                              <FiUsers
                                className={`${courseColorClasses[cls.color]?.text || courseColorClasses.blue.text}`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{cls.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {cls.code && `${cls.code} • `}
                                {cls.class_memberships?.length || 0} members
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              hapticButton()
                              onViewClass(cls.id)
                            }}
                            className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg font-medium transition-colors text-sm flex-shrink-0"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </SwipeToDelete>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FiUsers className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No classes yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create or join a class to get started
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Join a Class */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Join a Class</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC123"
                    value={joinClassCode}
                    onChange={(e) => onJoinClassCodeChange(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={onJoinClass}
                  disabled={isJoiningClass || !joinClassCode.trim()}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isJoiningClass ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Pro Tip
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your class code with classmates so they can join and access shared lectures and notes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
