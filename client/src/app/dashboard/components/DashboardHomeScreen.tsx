'use client'

import { useMemo, useState } from 'react'
import { Mic, Clock, Flame, Target, Play, Plus, Loader, BookOpen, Star, ChevronRight, Timer, CheckCircle, Gift, HelpCircle, Lock } from 'lucide-react'
import { hapticSelection, hapticButton } from '@/lib/haptics'
import { XP_REWARDS } from '@/hooks/useLevel'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { SubjectIcon } from '@/components/SubjectIcon'
import { getSubjectColor } from '@/lib/subject-utils'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']
type CourseWithLectureCount = Course & { lectureCount: number }

interface DashboardHomeScreenProps {
  user: any
  lectures: Lecture[]
  courses: Course[]
  selectedCourse: string | null
  streak: number
  isLoadingCourses: boolean
  courseFilter: 'active' | 'all' | 'favorites'
  onCourseFilterChange: (filter: 'active' | 'all' | 'favorites') => void
  onStartRecording: () => void
  onCreateCourse: () => void
  onSelectCourse: (courseId: string) => void
  onDeleteCourse: (courseId: string) => void
  onSelectLecture: (lectureId: string) => void
  onNavigateToLibrary: () => void
  onToggleFavorite?: (lectureId: string) => void
}

export function DashboardHomeScreen({
  lectures,
  courses,
  streak,
  isLoadingCourses,
  onStartRecording,
  onCreateCourse,
  onSelectCourse,
  onDeleteCourse,
  onSelectLecture,
  onNavigateToLibrary,
}: DashboardHomeScreenProps) {
  const [favoritedCourses, setFavoritedCourses] = useState<Set<string>>(new Set())

  // Calculate today's stats
  const getTodayStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLectures = lectures.filter(l => new Date(l.created_at) >= today)
    const todayMinutes = Math.floor(todayLectures.reduce((sum, l) => sum + (l.duration || 0), 0) / 60)

    return {
      lecturesRecorded: todayLectures.length,
      minutesStudied: todayMinutes,
    }
  }

  const todayStats = getTodayStats()

  // Daily goal: Record at least 1 lecture or study for 15 minutes
  const dailyGoalTarget = 1
  const dailyGoalCurrent = todayStats.lecturesRecorded
  const dailyGoalProgress = Math.min((dailyGoalCurrent / dailyGoalTarget) * 100, 100)
  const isDailyGoalComplete = dailyGoalCurrent >= dailyGoalTarget

  // Get most recent lecture for "Continue" card
  const mostRecentLecture = useMemo(() => {
    if (!lectures || lectures.length === 0) return null
    return [...lectures].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }, [lectures])

  // Get course for the most recent lecture
  const recentLectureCourse = useMemo(() => {
    if (!mostRecentLecture) return null
    return courses.find(c => c.id === mostRecentLecture.course_id)
  }, [mostRecentLecture, courses])

  // Get top 3 active courses
  const activeCourses = useMemo((): CourseWithLectureCount[] => {
    if (!courses || courses.length === 0) return []
    return [...courses]
      .map(course => ({
        ...course,
        lectureCount: (lectures || []).filter(l => l.course_id === course.id).length
      }))
      .sort((a, b) => b.lectureCount - a.lectureCount)
      .slice(0, 3)
  }, [courses, lectures])

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekLectures = lectures.filter(l => new Date(l.created_at) >= sevenDaysAgo)
    const totalMinutes = Math.floor(weekLectures.reduce((sum, l) => sum + (l.duration || 0), 0) / 60)

    return {
      lectures: weekLectures.length,
      minutes: totalMinutes,
    }
  }

  const weeklyStats = getWeeklyStats()

  // Calculate time until midnight for quest reset
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const hoursUntilReset = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60))
  const minutesUntilReset = Math.floor(((midnight.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))

  // Map quest icon names to lucide components
  const questIconMap: Record<string, any> = {
    record_lecture: Mic,
    study_10_min: Clock,
    maintain_streak: Flame,
  }

  // Daily Quests
  const dailyQuests = [
    {
      id: 'record_lecture',
      title: 'Record a lecture',
      current: Math.min(todayStats.lecturesRecorded, 1),
      target: 1,
      iconBgClass: 'bg-amber-100 dark:bg-amber-500/20',
      iconClass: 'text-amber-500',
      progressClass: 'bg-amber-400',
      borderClass: 'border-l-amber-500',
      completed: todayStats.lecturesRecorded >= 1,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
    {
      id: 'study_10_min',
      title: 'Study for 10 minutes',
      current: Math.min(todayStats.minutesStudied, 10),
      target: 10,
      iconBgClass: 'bg-blue-100 dark:bg-blue-500/20',
      iconClass: 'text-blue-500',
      progressClass: 'bg-blue-400',
      borderClass: 'border-l-blue-500',
      completed: todayStats.minutesStudied >= 10,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
    {
      id: 'maintain_streak',
      title: 'Maintain your streak',
      current: streak > 0 ? 1 : 0,
      target: 1,
      iconBgClass: 'bg-orange-100 dark:bg-orange-500/20',
      iconClass: 'text-orange-500',
      progressClass: 'bg-orange-400',
      borderClass: 'border-l-orange-500',
      completed: streak > 0,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-36 sm:pt-40 lg:pt-8 pb-32">

        {/* Hero Section - Daily Progress */}
        <div className="mb-8">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-gray-100 dark:border-white/[0.06]">

            <div className="relative z-10">
              {/* Daily Goal */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={20} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Today's Goal</span>
                  </div>
                  {isDailyGoalComplete && (
                    <span className="text-xs font-semibold bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                      Complete!
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Record {dailyGoalTarget} lecture{dailyGoalTarget > 1 ? 's' : ''} to keep your streak going
                </p>
                <div className="relative h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${dailyGoalProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{dailyGoalCurrent} / {dailyGoalTarget}</span>
                  <span>{Math.round(dailyGoalProgress)}%</span>
                </div>
              </div>

              {/* Quick Action Button */}
              <button
                onClick={() => {
                  hapticButton()
                  onStartRecording()
                }}
                className="w-full bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg"
              >
                <Mic size={20} />
                Start Recording
              </button>
            </div>
          </div>
        </div>

        {/* Continue Learning Card */}
        {mostRecentLecture && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Continue Learning
            </h2>
            <button
              onClick={() => {
                hapticSelection()
                onSelectLecture(mostRecentLecture.id)
                onNavigateToLibrary()
              }}
              className="w-full bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                {/* Play Button */}
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                  <Play size={20} className="text-white fill-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {mostRecentLecture.title || 'Untitled Lecture'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {recentLectureCourse?.name || 'Unknown Course'}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </button>
          </div>
        )}

        {/* Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Courses</h2>
            <button
              onClick={onCreateCourse}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {isLoadingCourses ? (
            <div className="text-center py-12">
              <Loader size={24} className="text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <BookOpen size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Create your first course to organize your lectures
              </p>
              <button
                onClick={onCreateCourse}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCourses.map((course) => {
                const colors = getSubjectColor((course as any).subject)

                return (
                  <SwipeToDelete
                    key={course.id}
                    onDelete={() => onDeleteCourse(course.id)}
                    itemName={`"${course.name}"`}
                  >
                    <div
                      onClick={() => onSelectCourse(course.id)}
                      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <SubjectIcon subject={(course as any).subject} size={24} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {course.lectureCount} {course.lectureCount === 1 ? 'lecture' : 'lectures'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              hapticSelection()
                              setFavoritedCourses((prev) => {
                                const newSet = new Set(prev)
                                if (newSet.has(course.id)) {
                                  newSet.delete(course.id)
                                } else {
                                  newSet.add(course.id)
                                }
                                return newSet
                              })
                            }}
                            className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors"
                          >
                            <Star
                              size={20}
                              className={`transition-colors ${
                                favoritedCourses.has(course.id)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-400 dark:text-gray-600'
                              }`}
                            />
                          </button>
                          <ChevronRight size={20} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </SwipeToDelete>
                )
              })}

              {courses.length > 3 && (
                <button
                  onClick={() => {}}
                  className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  View all {courses.length} courses
                </button>
              )}
            </div>
          )}
        </div>

        {/* Daily Quests */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Quests</h3>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Timer size={20} className="text-amber-500" />
              <span className="text-sm font-semibold">{hoursUntilReset}H {minutesUntilReset}M</span>
            </div>
          </div>

          {/* Quest Cards */}
          <div className="px-5 pb-5 space-y-3">
            {dailyQuests.map((quest, i) => {
              const QuestIcon = questIconMap[quest.id]
              const progressPercent = (quest.current / quest.target) * 100

              return (
                <div
                  key={i}
                  className={`relative bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/[0.06] border-l-4 ${quest.borderClass} rounded-xl p-4 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${quest.iconBgClass}`}>
                      {QuestIcon && <QuestIcon size={20} className={`${quest.iconClass}`} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{quest.title}</h4>
                      </div>
                      {/* Progress Bar */}
                      <div className="relative h-5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${quest.progressClass} rounded-full transition-all duration-500`}
                          style={{ width: `${progressPercent}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {quest.current} / {quest.target}
                        </span>
                      </div>
                    </div>

                    {/* Reward Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quest.completed ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-200 dark:bg-gray-800'}`}>
                      {quest.completed ? (
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <Gift size={20} className="text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Upcoming Quest */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Upcoming</h4>
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/[0.06] border-l-4 border-l-gray-300 dark:border-l-gray-600 rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <HelpCircle size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-500 dark:text-gray-400">Revealed tomorrow</h4>
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full mt-2" />
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <Lock size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
