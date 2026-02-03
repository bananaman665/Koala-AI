'use client'

import { useState } from 'react'
import { hapticButton, hapticSelection, hapticSuccess } from '@/lib/haptics'
import { SwipeToDelete } from '@/components/SwipeToDelete'

// Color classes for class icons
const classColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30' },
  green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-500/30' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-500/30' },
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
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const toggleFavorite = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    hapticSelection()
    setFavoritedClasses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(classId)) {
        newSet.delete(classId)
      } else {
        newSet.add(classId)
      }
      return newSet
    })
  }

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    hapticSuccess()
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredClasses = filter === 'favorites'
    ? userClasses.filter(cls => favoritedClasses.has(cls.id))
    : userClasses

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 py-6 pt-36 lg:pt-6 pb-32 lg:pb-8">

        {/* Quick Actions - Google Classroom inspired */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Join Class Card */}
          <button
            onClick={() => {
              hapticButton()
              // Focus the join input or show modal
              const input = document.getElementById('join-class-input')
              input?.focus()
            }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 transition-all active:scale-[0.98] text-left group"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Join Class</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter a class code</p>
          </button>

          {/* Create Class Card */}
          <button
            onClick={() => {
              hapticButton()
              onCreateNewClass()
            }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 transition-all active:scale-[0.98] text-left group"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Plus size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Create Class</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start a new class</p>
          </button>
        </div>

        {/* Join Class Input - Clean inline design */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06] mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Join with Code
          </label>
          <div className="flex gap-2">
            <input
              id="join-class-input"
              type="text"
              placeholder="Enter class code (e.g., ABC123)"
              value={joinClassCode}
              onChange={(e) => onJoinClassCodeChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && joinClassCode.trim() && !isJoiningClass) {
                  onJoinClass()
                }
              }}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (joinClassCode.trim() && !isJoiningClass) {
                  hapticButton()
                  onJoinClass()
                }
              }}
              disabled={!joinClassCode.trim() || isJoiningClass}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoiningClass ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {userClasses.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                hapticSelection()
                setFilter('all')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.06]'
              }`}
            >
              <Users size={16} weight={filter === 'all' ? 'fill' : 'regular'} />
              All Classes
            </button>
            <button
              onClick={() => {
                hapticSelection()
                setFilter('favorites')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'favorites'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.06]'
              }`}
            >
              <Star size={16} weight={filter === 'favorites' ? 'fill' : 'regular'} />
              Favorites
            </button>
          </div>
        )}

        {/* Classes List */}
        {filteredClasses.length > 0 ? (
          <div className="space-y-3">
            {filteredClasses.map((cls: any) => {
              const memberCount = cls.class_memberships?.length || 0
              const colorKey = cls.color || 'blue'
              const colorClasses = classColorClasses[colorKey] || classColorClasses.blue
              const isFavorited = favoritedClasses.has(cls.id)

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
                    className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Class Icon */}
                      <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Users size={24} className={colorClasses.text} />
                      </div>

                      {/* Class Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {cls.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                          {cls.code && (
                            <button
                              onClick={(e) => copyCode(cls.code, e)}
                              className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            >
                              {copiedCode === cls.code ? (
                                <>
                                  <Check size={14} className="text-green-500" />
                                  <span className="text-green-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>{cls.code}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => toggleFavorite(cls.id, e)}
                        className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors"
                      >
                        <Star
                          size={20}
                          weight={isFavorited ? 'fill' : 'regular'}
                          className={isFavorited ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-400'}
                        />
                      </button>
                      <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </SwipeToDelete>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {filter === 'favorites' ? (
              <>
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Star size={32} className="text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Star your favorite classes for quick access
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No classes yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                  Join an existing class with a code or create your own to start collaborating
                </p>
                <button
                  onClick={() => {
                    hapticButton()
                    onCreateNewClass()
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create Your First Class
                </button>
              </>
            )}
          </div>
        )}

        {/* Tip Card */}
        {userClasses.length > 0 && (
          <div className="mt-6 bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkle size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Pro Tip</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Share your class code with classmates so everyone can access shared lectures and notes!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
