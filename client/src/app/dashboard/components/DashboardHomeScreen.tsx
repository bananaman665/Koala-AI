'use client'

import { FiFolder, FiPlus, FiBook, FiChevronRight, FiPlay, FiLoader } from 'react-icons/fi'
import { Mic, Trophy } from 'lucide-react'
import { AnimatedCounter, AnimatedTimeCounter } from '@/components/AnimatedCounter'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']

const MAX_LECTURES = 10

// Color classes for course icons
const courseColorClasses: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
}

interface DashboardHomeScreenProps {
  user: any
  lectures: Lecture[]
  courses: Course[]
  selectedCourse: string | null
  streak: number
  isLoadingCourses: boolean
  onStartRecording: () => void
  onCreateCourse: () => void
  onSelectCourse: (courseId: string) => void
  onDeleteCourse: (courseId: string) => void
  onSelectLecture: (lectureId: string) => void
  onNavigateToLibrary: () => void
}

export function DashboardHomeScreen({
  user,
  lectures,
  courses,
  selectedCourse,
  streak,
  isLoadingCourses,
  onStartRecording,
  onCreateCourse,
  onSelectCourse,
  onDeleteCourse,
  onSelectLecture,
  onNavigateToLibrary,
}: DashboardHomeScreenProps) {
  const totalStudyTime = lectures.reduce((sum, lecture) => sum + lecture.duration, 0)
  const todaysLectures = lectures.filter(l => {
    const today = new Date().toDateString()
    return new Date(l.created_at).toDateString() === today
  })

  return (
    <div className="overflow-y-auto bg-gray-50 dark:bg-[#111827] h-full relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-8 pt-32 sm:pt-36 larger-phone:pt-36 larger-phone:sm:pt-40">
        {/* Hero Section - Clean & Focused */}
        <div className="mb-6">
          {/* Greeting */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {(() => {
              const hour = new Date().getHours()
              const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
              const fullName = user?.fullName || user?.displayName || user?.email?.split('@')[0] || ''
              const userName = fullName.slice(0, 7)
              return `${greeting}${userName ? ', ' + userName : ''}! 👋`
            })()}
          </h1>

          {/* Hero Button */}
          <button
            onClick={onStartRecording}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base rounded-xl transition-all duration-200 active:scale-[0.97]"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        </div>

        {/* Continue Learning - Right under button */}
        {lectures.length > 0 && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mb-6 dark:hover:bg-white/5 transition-colors">
            <div
              onClick={() => {
                onSelectLecture(lectures[0].id)
                onNavigateToLibrary()
              }}
              className="cursor-pointer group flex items-center gap-3"
            >
              <div className="w-11 h-11 bg-green-100 dark:bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPlay className="text-green-600 dark:text-green-400 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Continue</p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lectures[0].title}</h3>
              </div>
              <FiChevronRight className="text-gray-300 dark:text-white/30 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Monthly Goal */}
        {(() => {
          // Calculate this month's progress
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const daysInMonth = endOfMonth.getDate()
          const currentDay = now.getDate()
          const daysRemaining = daysInMonth - currentDay
          const monthIndex = now.getMonth()

          // Define monthly goals that cycle
          const monthlyGoals = [
            {
              id: 'lectures',
              title: 'Record 10 lectures',
              description: 'Record <span class="font-semibold text-violet-600 dark:text-violet-400">10 lectures</span> this month',
              target: 10,
              getCurrent: () => lectures.filter(l => new Date(l.created_at) >= startOfMonth).length,
              bgColor: 'bg-violet-500',
            },
            {
              id: 'study_hours',
              title: 'Study for 8 hours',
              description: 'Accumulate <span class="font-semibold text-blue-600 dark:text-blue-400">8 hours</span> of lecture time',
              target: 8,
              getCurrent: () => Math.floor(lectures.filter(l => new Date(l.created_at) >= startOfMonth).reduce((sum, l) => sum + (l.duration || 0), 0) / 3600),
              bgColor: 'bg-blue-500',
            },
            {
              id: 'courses',
              title: 'Create 3 courses',
              description: 'Create <span class="font-semibold text-emerald-600 dark:text-emerald-400">3 new courses</span> this month',
              target: 3,
              getCurrent: () => courses.filter(c => new Date(c.created_at) >= startOfMonth).length,
              bgColor: 'bg-emerald-500',
            },
            {
              id: 'streak',
              title: 'Reach 15-day streak',
              description: 'Maintain a <span class="font-semibold text-orange-600 dark:text-orange-400">15-day streak</span> this month',
              target: 15,
              getCurrent: () => streak,
              bgColor: 'bg-orange-500',
            },
          ]

          // Cycle through goals based on month
          const currentGoal = monthlyGoals[monthIndex % monthlyGoals.length]
          const currentValue = currentGoal.getCurrent()
          const progress = Math.min((currentValue / currentGoal.target) * 100, 100)
          const isCompleted = currentValue >= currentGoal.target

          return (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mb-6 animate-card-in card-stagger-1 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${currentGoal.bgColor} flex items-center justify-center`}>
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Goal</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{daysRemaining} days remaining</p>
                  </div>
                </div>
                {isCompleted && (
                  <span className="text-xs font-semibold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
                    Completed!
                  </span>
                )}
              </div>

              <p
                className="text-sm text-gray-600 dark:text-gray-300 mb-3"
                dangerouslySetInnerHTML={{ __html: currentGoal.description }}
              />

              {/* Progress Bar */}
              <div className="relative h-6 bg-gray-100 dark:bg-[#0B1220] rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${currentGoal.bgColor} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {currentValue} / {currentGoal.target}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Courses</h2>
          <button
            onClick={onCreateCourse}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-full transition-colors"
          >
            <FiPlus className="text-sm" />
            Add
          </button>
        </div>

        <div className="space-y-6">
          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isLoadingCourses ? (
              <div className="col-span-2 text-center py-12">
                <FiLoader className="text-gray-400 text-4xl mx-auto animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              /* Empty State */
              <div className="col-span-2 text-center py-12 px-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-violet-100 dark:bg-violet-500/10 rounded-xl flex items-center justify-center">
                  <FiBook className="text-violet-600 dark:text-violet-400 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tap + Add to create your first course</p>
              </div>
            ) : (
              courses.map((course, index) => {
                const lectureCount = lectures.filter(l => l.course_id === course.id).length
                return (
                  <SwipeToDelete
                    key={course.id}
                    onDelete={() => onDeleteCourse(course.id)}
                    itemName={`"${course.name}"`}
                  >
                    <div
                      onClick={() => onSelectCourse(course.id)}
                      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all cursor-pointer group touch-manipulation active:scale-[0.98] dark:hover:bg-white/5 animate-card-in card-stagger-${Math.min(index + 1, 6)}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 ${courseColorClasses[course.color]?.bg || courseColorClasses.blue.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <FiBook className={`text-lg ${courseColorClasses[course.color]?.text || courseColorClasses.blue.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                            {course.name}
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {lectureCount} lecture{lectureCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <FiChevronRight className="text-gray-300 dark:text-white/30 text-lg flex-shrink-0" />
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${courseColorClasses[course.color]?.bar || 'bg-blue-500'}`}
                          style={{ width: `${lectureCount > 0 ? Math.min((lectureCount / 10) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </SwipeToDelete>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
