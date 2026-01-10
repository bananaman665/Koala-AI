'use client'
import { FiPlus, FiUsers, FiChevronRight } from 'react-icons/fi'
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
    <div className="overflow-hidden bg-gray-50 dark:bg-gray-900 h-full flex flex-col lg:flex-row">
      {/* Left Panel - Sidebar (320px on desktop) */}
      <div className="flex-1 lg:w-[320px] lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-4 pt-32 sm:pt-36 lg:pt-4 pb-8 lg:pb-4">
          {/* Mobile: Page Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 lg:hidden">Classes</h1>

          {/* Sections with increased spacing */}
          <div className="space-y-6">
            {/* Join a Class */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 dark:hover:bg-white/5 transition-colors">
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

            {/* Pro Tip */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 dark:hover:bg-white/5 transition-colors">
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

      {/* Right Panel - Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl lg:max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-32 lg:pb-8 pt-8 lg:pt-4">
          {/* Desktop: Page Title + Action */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Classes</h1>
            <button
              onClick={() => {
                hapticButton()
                onCreateNewClass()
              }}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <FiPlus />
              <span>New Class</span>
            </button>
          </div>

          {/* Mobile: Your Classes Container */}
          <div className="lg:hidden bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 dark:hover:bg-white/5 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Classes</h3>
            {userClasses && userClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userClasses.map((cls: any) => (
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
                      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all cursor-pointer group touch-manipulation active:scale-[0.98] dark:hover:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/30"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 ${
                            courseColorClasses[cls.color]?.bg || courseColorClasses.blue.bg
                          } rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <FiUsers
                            className={`text-lg ${courseColorClasses[cls.color]?.text || courseColorClasses.blue.text}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">{cls.name}</h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                            {cls.code && `${cls.code} • `}
                            {cls.class_memberships?.length || 0} members
                          </p>
                        </div>
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

          {/* Desktop: Classes Grid (No Container) */}
          {userClasses && userClasses.length > 0 ? (
            <div className="hidden lg:grid lg:grid-cols-1 gap-4">
              {userClasses.map((cls: any) => (
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
                    className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.06] p-4 transition-all cursor-pointer group dark:hover:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/30"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 ${
                          courseColorClasses[cls.color]?.bg || courseColorClasses.blue.bg
                        } rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <FiUsers
                          className={`text-base ${courseColorClasses[cls.color]?.text || courseColorClasses.blue.text}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Class</p>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cls.name}</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                          {cls.code && `${cls.code} • `}
                          {cls.class_memberships?.length || 0} members
                        </p>
                      </div>
                      <FiChevronRight className="text-gray-300 dark:text-white/30 flex-shrink-0" />
                    </div>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          ) : (
            <div className="hidden lg:block text-center py-12">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiUsers className="w-6 h-6 text-gray-300 dark:text-gray-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No classes yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create or join a class to get started
              </p>
            </div>
          )}

          {/* Mobile: Action Button */}
          <button
            onClick={() => {
              hapticButton()
              onCreateNewClass()
            }}
            className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center shadow-lg"
          >
            <FiPlus className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  )
}
