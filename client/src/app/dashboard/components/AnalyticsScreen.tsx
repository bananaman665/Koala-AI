'use client'

import { useState } from 'react'
import { FiClock, FiFileText, FiBook, FiMic, FiTrendingUp } from 'react-icons/fi'
import { hapticButton } from '@/lib/haptics'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']

interface AnalyticsScreenProps {
  lectures: Lecture[]
  courses: Course[]
  streak: number
  isActiveToday: () => boolean
  onLectureClick: (lectureId: string) => void
}

export function AnalyticsScreen({
  lectures,
  courses,
  streak,
  isActiveToday,
  onLectureClick,
}: AnalyticsScreenProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week')

  // Filter lectures based on time period
  const filteredLectures = lectures.filter((lecture) => {
    const lectureDate = new Date(lecture.created_at)
    const now = new Date()

    if (timeFilter === 'week') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(now.getDate() - 7)
      return lectureDate >= oneWeekAgo
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(now.getMonth() - 1)
      return lectureDate >= oneMonthAgo
    }

    return true // 'all' - show everything
  })

  // Calculate study time
  const totalSeconds = filteredLectures.reduce((sum, lec) => sum + lec.duration, 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const studyTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  // Calculate completion rate
  const completionRate = filteredLectures.length > 0
    ? Math.round((filteredLectures.filter(l => l.transcription_status === 'completed').length / filteredLectures.length) * 100)
    : 0

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="max-w-7xl lg:max-w-none mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 pb-32 lg:pb-8 pt-32 sm:pt-36 lg:pt-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>

          {/* Time Period Selector */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                timeFilter === 'week'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 active:shadow-inner border-b-2 border-[#0052CC]'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                timeFilter === 'month'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 active:shadow-inner'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                timeFilter === 'all'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 active:shadow-inner'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Study Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Study Streak</h3>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <FiTrendingUp className="text-orange-600 dark:text-orange-400 text-2xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streak} {streak === 1 ? 'Day' : 'Days'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400">
                  {streak === 0 ? 'Start your streak!' : streak >= 7 ? 'Amazing progress!' : 'Keep it up!'}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                // Calculate which days should be active based on streak
                const today = new Date().getDay()
                const adjustedToday = today === 0 ? 6 : today - 1 // Convert Sunday=0 to index 6, Monday=1 to index 0
                const isActive = isActiveToday()
                  ? i <= adjustedToday && (adjustedToday - i) < streak
                  : i < adjustedToday && (adjustedToday - 1 - i) < streak
                return (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className={`w-full h-8 rounded ${
                        isActive ? 'bg-[#0066FF] shadow-lg shadow-blue-500/40' : 'bg-gray-200 dark:bg-gray-700'
                      } mb-1 transition-all duration-200`}
                    ></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{day}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Top Courses</h3>
            <div className="space-y-4">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-4">No courses yet</p>
              ) : (
                courses.slice(0, 3).map((course) => {
                  const courseLectures = lectures.filter(l => l.course_id === course.id)
                  const totalHours = courseLectures.reduce((sum, l) => sum + l.duration, 0) / 3600
                  const maxHours = Math.max(
                    ...courses.map(c =>
                      lectures.filter(l => l.course_id === c.id).reduce((sum, l) => sum + l.duration, 0) / 3600
                    ),
                    1
                  )

                  return (
                    <div key={course.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-white">{course.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="progress-bar-gradient h-3 rounded-full transition-all duration-500 progress-animate"
                          style={{ width: `${(totalHours / maxHours) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Recent Activity</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {lectures.length === 0 ? (
                <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-4">No activity yet</p>
              ) : (
                lectures.slice(0, 5).map((lecture) => {
                  const createdDate = new Date(lecture.created_at)
                  const now = new Date()
                  const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
                  const timeDisplay = diffHours < 1
                    ? 'Just now'
                    : diffHours < 24
                    ? `${diffHours}h ago`
                    : diffHours < 48
                    ? 'Yesterday'
                    : `${Math.floor(diffHours / 24)}d ago`

                  const statusText = lecture.transcription_status === 'completed' ? 'Completed lecture' :
                                    lecture.transcription_status === 'failed' ? 'Lecture failed' :
                                    lecture.transcription_status === 'processing' ? 'Processing lecture' : 'Recorded lecture'

                  // Proper Tailwind classes for dark mode
                  const iconBgClass = lecture.transcription_status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                     lecture.transcription_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  const iconTextClass = lecture.transcription_status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                       lecture.transcription_status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'

                  return (
                    <div
                      key={lecture.id}
                      onClick={() => {
                        hapticButton()
                        onLectureClick(lecture.id)
                      }}
                      className="flex items-center space-x-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                        <FiMic className={`text-lg ${iconTextClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{statusText}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 truncate">{lecture.title} • {timeDisplay}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
