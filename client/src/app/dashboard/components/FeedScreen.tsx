'use client'
import { useState } from 'react'
import { FiPlus, FiUsers, FiChevronRight, FiStar } from 'react-icons/fi'
import { hapticButton, hapticSelection } from '@/lib/haptics'
import { SwipeToDelete } from '@/components/SwipeToDelete'

// Color classes for course icons
const courseColorClasses: Record<string, { bg: string; text: string; bar: string; glow: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-[#0066FF]', glow: 'shadow-blue-500/20' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-[#6366F1]', glow: 'shadow-purple-500/20' },
  green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', bar: 'bg-[#10B981]', glow: 'shadow-green-500/20' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-[#F59E0B]', glow: 'shadow-orange-500/20' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-[#EC4899]', glow: 'shadow-pink-500/20' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-[#FBBF24]', glow: 'shadow-yellow-500/20' },
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
  const [favoritedClasses, setFavoritedClasses] = useState<Set<string>>(new Set())

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-32 sm:pt-36 lg:pt-8 pb-32 lg:pb-8">
          {/* Vertical Stack Layout */}
          <div className="flex flex-col gap-6">
            {/* Class Management */}
            <div>
              <div className="space-y-6">
                {/* Join a Class */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
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
                      onClick={() => {
                        if (joinClassCode.trim() && !isJoiningClass) {
                          onJoinClass()
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] active:bg-[#0747A6] transition-all duration-200 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] active:shadow-inner text-sm relative border-b-2 border-[#0052CC]"
                    >
                      {isJoiningClass ? 'Joining...' : 'Join Class'}
                    </button>
                  </div>
                </div>

                {/* Create New Class */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Class</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Start a new class and share the code with your classmates.
                  </p>
                  <button
                    onClick={() => {
                      hapticButton()
                      onCreateNewClass()
                    }}
                    className="w-full px-4 py-2.5 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-[#0052CC] active:bg-[#0747A6] transition-all duration-200 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] active:shadow-inner text-sm flex items-center justify-center gap-2 relative border-b-2 border-[#0052CC]"
                  >
                    <FiPlus />
                    <span>New Class</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Your Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Classes</h2>
              {userClasses && userClasses.length > 0 ? (
                <div className="space-y-2">
                  {userClasses.map((cls: any) => {
                    const memberCount = cls.class_memberships?.length || 0
                    const colorKey = cls.color || 'blue'
                    const colorClasses = courseColorClasses[colorKey] || courseColorClasses.blue
                    return (
                    <SwipeToDelete
                      key={cls.id}
                      onDelete={() => onDeleteClass(cls.id)}
                      itemName={`"${cls.name}"`}
                    >
                      <div
                        onClick={() => {
                          hapticButton()
                          onViewClass(cls.id)
                        }}
                        className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.06] p-4 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer group hover:border-blue-300 dark:hover:border-blue-500/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 ${colorClasses.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                            >
                              <FiUsers
                                className={`text-base ${colorClasses.text}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Class</p>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cls.name}</h4>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {cls.code && `${cls.code} • `}
                                {memberCount} member{memberCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {/* Star Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              hapticSelection()
                              setFavoritedClasses((prev) => {
                                const newSet = new Set(prev)
                                if (newSet.has(cls.id)) {
                                  newSet.delete(cls.id)
                                } else {
                                  newSet.add(cls.id)
                                }
                                return newSet
                              })
                            }}
                            className="p-2 flex-shrink-0 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all duration-200"
                          >
                            <FiStar
                              className={`w-5 h-5 transition-all duration-200 ${
                                favoritedClasses.has(cls.id)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-white/30 group-hover:text-yellow-400'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </SwipeToDelete>
                  )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
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
        </div>

      {/* Mobile: Create Class Button */}
      <button
        onClick={() => {
          hapticButton()
          onCreateNewClass()
        }}
        className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-[#0066FF] text-white rounded-full font-semibold hover:bg-[#0052CC] active:bg-[#0747A6] transition-all duration-200 flex items-center justify-center shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.05] active:scale-[0.95] active:shadow-inner border-b-2 border-[#0052CC]"
      >
        <FiPlus className="text-xl" />
      </button>
    </div>
  )
}
