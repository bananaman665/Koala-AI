'use client'

import { useMemo } from 'react'
import { FiFolder, FiPlus, FiBook, FiChevronRight, FiPlay, FiLoader, FiClock, FiStar } from 'react-icons/fi'
import { Mic, Trophy, FileText, GraduationCap, Calculator, Beaker, Atom, TestTube, Microscope, Dna, Zap, BookOpen } from 'lucide-react'
import { AnimatedCounter, AnimatedTimeCounter } from '@/components/AnimatedCounter'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { ResumeLectureCarousel } from '@/components/ResumeLectureCarousel'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']
type CourseWithLectureCount = Course & { lectureCount: number }

const MAX_LECTURES = 10

// Subject icon mapping
const subjectIcons: Record<string, any> = {
  math: Calculator,
  science: Beaker,
  chemistry: TestTube,
  biology: Microscope,
  physics: Atom,
  genetics: Dna,
  engineering: Zap,
  literature: BookOpen,
  default: FiBook,
}

// Subject color mapping
const subjectColors: Record<string, { text: string; bg: string }> = {
  math: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  science: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  chemistry: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  biology: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  physics: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/10' },
  genetics: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  engineering: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  literature: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  default: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
}

const getSubjectIcon = (subject?: string | null) => {
  if (!subject) return subjectIcons.default
  const iconComponent = subjectIcons[subject.toLowerCase()]
  return iconComponent || subjectIcons.default
}

const getSubjectColor = (subject?: string | null) => {
  if (!subject) return subjectColors.default
  const colors = subjectColors[subject.toLowerCase()]
  return colors || subjectColors.default
}

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
  selectedCourse,
  streak,
  isLoadingCourses,
  courseFilter,
  onCourseFilterChange,
  onStartRecording,
  onCreateCourse,
  onSelectCourse,
  onDeleteCourse,
  onSelectLecture,
  onNavigateToLibrary,
  onToggleFavorite,
}: DashboardHomeScreenProps) {
  // Calculate quick stats
  const getQuickStats = () => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Study time this week (in hours and minutes)
    const weekLectures = lectures.filter(l => new Date(l.created_at) >= sevenDaysAgo)
    const weekStudySeconds = weekLectures.reduce((sum, l) => sum + (l.duration || 0), 0)
    const weekStudyHours = Math.floor(weekStudySeconds / 3600)
    const weekStudyMinutes = Math.floor((weekStudySeconds % 3600) / 60)

    // Lectures this month
    const monthLectures = lectures.filter(l => new Date(l.created_at) >= startOfMonth).length

    // Most active course
    const courseLectureCounts = courses.map(course => ({
      course,
      count: lectures.filter(l => l.course_id === course.id).length
    }))
    const mostActiveCourse = courseLectureCounts.sort((a, b) => b.count - a.count)[0]?.course

    return {
      weekStudyHours,
      weekStudyMinutes,
      monthLectures,
      mostActiveCourse,
      streak
    }
  }

  const stats = getQuickStats()

  // Analyze patterns and generate insights
  const getStudyInsights = () => {
    const insights: string[] = []
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Pattern 1: Study momentum
    const thisWeekLectures = lectures.filter(l => new Date(l.created_at) >= sevenDaysAgo).length
    const lastWeekLectures = lectures.filter(l => {
      const date = new Date(l.created_at)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    }).length

    if (thisWeekLectures > lastWeekLectures && lastWeekLectures > 0) {
      insights.push(`You're building momentum! ${thisWeekLectures} lectures this week vs ${lastWeekLectures} last week.`)
    } else if (thisWeekLectures > 0 && lastWeekLectures === 0) {
      insights.push(`Great start! You've recorded ${thisWeekLectures} lectures this week.`)
    } else if (thisWeekLectures > 0 && thisWeekLectures < lastWeekLectures) {
      insights.push(`You recorded ${thisWeekLectures} lectures this week. Keep up the consistency!`)
    }

    // Pattern 2: Most productive day
    const dayOfWeekCounts = Array(7).fill(0)
    lectures.forEach(l => {
      const day = new Date(l.created_at).getDay()
      dayOfWeekCounts[day]++
    })
    const maxDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    if (lectures.length >= 5 && dayOfWeekCounts[maxDay] >= 2) {
      insights.push(`${dayNames[maxDay]} is your most productive day.`)
    }

    // Pattern 3: Course balance
    if (courses.length >= 3) {
      const lecturesPerCourse = courses.map(c =>
        lectures.filter(l => l.course_id === c.id).length
      )
      const avgLecturesPerCourse = lecturesPerCourse.reduce((a, b) => a + b, 0) / courses.length
      const balancedCourses = lecturesPerCourse.filter(count =>
        Math.abs(count - avgLecturesPerCourse) < 2
      ).length

      if (balancedCourses === courses.length) {
        insights.push('Great balance across all your courses!')
      } else {
        const underStudied = courses.filter(c =>
          lectures.filter(l => l.course_id === c.id).length < avgLecturesPerCourse - 1
        )
        if (underStudied.length > 0) {
          insights.push(`Consider recording more for "${underStudied[0].name}".`)
        }
      }
    }

    // Pattern 4: Streak insights
    if (streak >= 7) {
      insights.push(`Amazing ${streak}-day streak! Keep the momentum going.`)
    } else if (streak >= 3) {
      insights.push(`You're on a ${streak}-day streak. Can you make it to 7?`)
    } else if (streak === 0 && lectures.length > 0) {
      insights.push('Start a new streak by recording a lecture today!')
    }

    // Fallback insights if data is limited
    if (insights.length === 0) {
      if (lectures.length === 0) {
        insights.push('Record your first lecture to start tracking insights!')
      } else if (courses.length === 1) {
        insights.push('Create more courses to organize your content better.')
      } else {
        insights.push('Keep recording lectures to build study patterns.')
      }
    }

    return insights.slice(0, 4) // Max 4 insights
  }

  const studyInsights = getStudyInsights()

  // Get 5 most recent lectures for carousel
  const recentLectures = useMemo(() => {
    if (!lectures || lectures.length === 0) return []
    return [...lectures]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [lectures])

  // Get top 2-3 active courses (most lectures)
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Main Panel */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-32 sm:pt-36 lg:pt-8 pb-0">
          {/* Two Column Layout */}
          <div className="lg:flex lg:gap-6">

            {/* Left Column - Main Content */}
            <div className="lg:flex-1">
          {/* Desktop Resume Carousel */}
          <div className="hidden lg:block">
            {recentLectures.length > 0 && (
              <ResumeLectureCarousel
                lectures={recentLectures}
                onSelectLecture={onSelectLecture}
                onNavigateToLibrary={onNavigateToLibrary}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </div>

          {/* Desktop: Course Grid */}
          <div key={courseFilter} className="hidden lg:block">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300">Courses</h2>
              <button
                onClick={onCreateCourse}
                className="p-1.5 bg-[#0066FF] text-white hover:bg-[#0052CC] active:bg-[#0747A6] rounded-full transition-all duration-200 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.05] active:scale-[0.95] active:shadow-inner border-b-2 border-[#0052CC]"
              >
                <FiPlus className="text-sm" />
              </button>
            </div>

            {isLoadingCourses ? (
              <div className="text-center py-8">
                <FiLoader className="text-gray-400 text-2xl mx-auto animate-spin mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 px-2 lg:py-10">
                <FiBook className="text-gray-400 text-xl lg:text-2xl mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">No courses</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in">
                  {activeCourses.map((course, index) => {
                  const lectureCount = lectures.filter(l => l.course_id === course.id).length
                  const SubjectIcon = getSubjectIcon((course as any).subject)
                  const colors = getSubjectColor((course as any).subject)
                  return (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course.id)}
                      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer animate-card-in card-stagger-${Math.min(index + 1, 6)}`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <SubjectIcon className={`text-lg ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                            {course.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
                {courses.length > 3 && (
                  <button
                    onClick={() => {}}
                    className="mt-4 w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View all {courses.length} courses →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Resume Carousel */}
          <div className="lg:hidden">
            {recentLectures.length > 0 && (
              <ResumeLectureCarousel
                lectures={recentLectures}
                onSelectLecture={onSelectLecture}
                onNavigateToLibrary={onNavigateToLibrary}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </div>

          {/* Mobile: Section Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Courses</h2>
            <button
              onClick={onCreateCourse}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-full transition-colors"
            >
              <FiPlus className="text-sm" />
              Add
            </button>
          </div>

          {/* Mobile: Courses Grid */}
          <div className="lg:hidden space-y-6 mb-8">
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
                    {courseFilter === 'active' ? (
                      <FiClock className="text-violet-600 dark:text-violet-400 text-2xl" />
                    ) : courseFilter === 'favorites' ? (
                      <FiStar className="text-violet-600 dark:text-violet-400 text-2xl" />
                    ) : (
                      <FiBook className="text-violet-600 dark:text-violet-400 text-2xl" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {courseFilter === 'active'
                      ? 'No active courses'
                      : courseFilter === 'favorites'
                      ? 'No favorites yet'
                      : 'No courses yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {courseFilter === 'active'
                      ? 'Record a lecture to make a course active!'
                      : courseFilter === 'favorites'
                      ? 'Star your favorite courses to see them here'
                      : 'Tap + Add to create your first course'}
                  </p>
                </div>
              ) : (
                <>
                  {activeCourses.map((course, index) => {
                    const SubjectIcon = getSubjectIcon((course as any).subject)
                    const colors = getSubjectColor((course as any).subject)
                    return (
                      <SwipeToDelete
                        key={course.id}
                        onDelete={() => onDeleteCourse(course.id)}
                        itemName={`"${course.name}"`}
                        disabled={course.name === 'My Course' && course.code === '100'}
                      >
                        <div
                          onClick={() => onSelectCourse(course.id)}
                          className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer group touch-manipulation active:scale-[0.98] animate-card-in card-stagger-${Math.min(index + 1, 6)}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <SubjectIcon className={`text-lg ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                                {course.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {course.lectureCount} {course.lectureCount === 1 ? 'lecture' : 'lectures'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </SwipeToDelete>
                    )
                  })}
                  {courses.length > 3 && (
                    <div className="col-span-1 sm:col-span-2 text-center py-4">
                      <button
                        onClick={() => {}}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        View all {courses.length} courses →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop: Monthly Goal */}
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
            const isMonthOver = daysRemaining <= 0

            // If month is over, show summary card
            if (isMonthOver) {
              // Calculate completion percentage
              const completionPercent = Math.min((currentValue / currentGoal.target) * 100, 100)

              // Generate motivational message based on performance
              const getMotivationalMessage = () => {
                if (isCompleted) {
                  return 'Great job! 🎉'
                } else if (completionPercent >= 90) {
                  return 'So close! You\'ve got this next month! 💪'
                } else if (completionPercent >= 75) {
                  return 'Nice effort! Keep pushing next month! 🚀'
                } else if (completionPercent >= 50) {
                  return 'Good start! You\'ll crush it next time! 👊'
                } else {
                  return 'Don\'t worry, every month is a new chance! 💫'
                }
              }

              return (
                <div className="hidden lg:block bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mt-8 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${currentGoal.bgColor} flex items-center justify-center`}>
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Month Completed</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentValue} / {currentGoal.target}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-6 bg-gray-100 dark:bg-[#0B1220] rounded-full overflow-hidden mb-3">
                    <div
                      className={`absolute inset-y-0 left-0 ${currentGoal.bgColor} rounded-full transition-all duration-500 progress-animate`}
                      style={{ width: `${completionPercent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {Math.round(completionPercent)}%
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getMotivationalMessage()}
                  </p>
                </div>
              )
            }

            // Regular card for current month
            return (
              <div className="hidden lg:block bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mt-8 mb-6">
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
                    className={`absolute inset-y-0 left-0 ${currentGoal.bgColor} rounded-full transition-all duration-500 progress-animate`}
                    style={{ width: `${progress}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {currentValue} / {currentGoal.target}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Desktop: Continue Learning Options */}
          {(() => {
            // Check for saved Learn Mode progress
            const savedLearnMode = typeof window !== 'undefined' ? localStorage.getItem('koala_learnmode_progress') : null
            const savedFlashcards = typeof window !== 'undefined' ? localStorage.getItem('koala_flashcard_progress') : null
            
            let learnModeData = null
            let flashcardData = null
            
            try {
              if (savedLearnMode) learnModeData = JSON.parse(savedLearnMode)
              if (savedFlashcards) flashcardData = JSON.parse(savedFlashcards)
            } catch (e) {
              console.error('Failed to parse saved progress')
            }

            // Only show if there's actual progress
            if (!learnModeData && !flashcardData) return null

            return (
              <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Continue Flashcards - Only show if there's progress */}
                {flashcardData && (
                  <button
                    onClick={() => {
                      // Navigate to library and activate flashcard mode
                      if (flashcardData.lectureId) {
                        onSelectLecture(flashcardData.lectureId)
                        // TODO: Trigger flashcard mode activation
                      }
                    }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all duration-200 hover:shadow-md active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Continue Flashcards</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Card {flashcardData.currentIndex + 1} of {flashcardData.totalCards}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last card:</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                        {flashcardData.lastQuestion || 'Resume your review session'}
                      </p>
                    </div>
                  </button>
                )}

                {/* Continue Learn Mode - Only show if there's progress */}
                {learnModeData && (
                  <button
                    onClick={() => {
                      // Navigate to library and activate learn mode
                      if (learnModeData.lectureId) {
                        onSelectLecture(learnModeData.lectureId)
                        // TODO: Trigger learn mode activation
                      }
                    }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all duration-200 hover:shadow-md active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Continue Learn Mode</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Question {learnModeData.currentIndex + 1} of {learnModeData.totalQuestions}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last question:</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                        {learnModeData.lastQuestion || 'Pick up where you left off'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )
          })()}

          {/* Mobile: Monthly Goal */}
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
            const isMonthOver = daysRemaining <= 0

            // If month is over, show summary card
            if (isMonthOver) {
              // Calculate completion percentage
              const completionPercent = Math.min((currentValue / currentGoal.target) * 100, 100)

              // Generate motivational message based on performance
              const getMotivationalMessage = () => {
                if (isCompleted) {
                  return 'Great job! 🎉'
                } else if (completionPercent >= 90) {
                  return 'So close! You\'ve got this next month! 💪'
                } else if (completionPercent >= 75) {
                  return 'Nice effort! Keep pushing next month! 🚀'
                } else if (completionPercent >= 50) {
                  return 'Good start! You\'ll crush it next time! 👊'
                } else {
                  return 'Don\'t worry, every month is a new chance! 💫'
                }
              }

              return (
                <div className="lg:hidden bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${currentGoal.bgColor} flex items-center justify-center`}>
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Month Completed</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentValue} / {currentGoal.target}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-6 bg-gray-100 dark:bg-[#0B1220] rounded-full overflow-hidden mb-3">
                    <div
                      className={`absolute inset-y-0 left-0 ${currentGoal.bgColor} rounded-full transition-all duration-500 progress-animate`}
                      style={{ width: `${completionPercent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {Math.round(completionPercent)}%
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getMotivationalMessage()}
                  </p>
                </div>
              )
            }

            // Regular card for current month
            return (
              <div className="lg:hidden bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 mb-6 animate-card-in card-stagger-1 shadow-lg shadow-black/5 dark:shadow-black/20">
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
                    className={`absolute inset-y-0 left-0 ${currentGoal.bgColor} rounded-full transition-all duration-500 progress-animate`}
                    style={{ width: `${progress}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {currentValue} / {currentGoal.target}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Mobile: Continue Learning Options */}
          {(() => {
            // Check for saved Learn Mode progress
            const savedLearnMode = typeof window !== 'undefined' ? localStorage.getItem('koala_learnmode_progress') : null
            const savedFlashcards = typeof window !== 'undefined' ? localStorage.getItem('koala_flashcard_progress') : null
            
            let learnModeData = null
            let flashcardData = null
            
            try {
              if (savedLearnMode) learnModeData = JSON.parse(savedLearnMode)
              if (savedFlashcards) flashcardData = JSON.parse(savedFlashcards)
            } catch (e) {
              console.error('Failed to parse saved progress')
            }

            // Only show if there's actual progress
            if (!learnModeData && !flashcardData) return null

            return (
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Continue Flashcards - Only show if there's progress */}
                {flashcardData && (
                  <button
                    onClick={() => {
                      // Navigate to library and activate flashcard mode
                      if (flashcardData.lectureId) {
                        onSelectLecture(flashcardData.lectureId)
                        // TODO: Trigger flashcard mode activation
                      }
                    }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all duration-200 hover:shadow-md active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Continue Flashcards</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Card {flashcardData.currentIndex + 1} of {flashcardData.totalCards}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last card:</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                        {flashcardData.lastQuestion || 'Resume your review session'}
                      </p>
                    </div>
                  </button>
                )}

                {/* Continue Learn Mode - Only show if there's progress */}
                {learnModeData && (
                  <button
                    onClick={() => {
                      // Navigate to library and activate learn mode
                      if (learnModeData.lectureId) {
                        onSelectLecture(learnModeData.lectureId)
                        // TODO: Trigger learn mode activation
                      }
                    }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all duration-200 hover:shadow-md active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Continue Learn Mode</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Question {learnModeData.currentIndex + 1} of {learnModeData.totalQuestions}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last question:</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                        {learnModeData.lastQuestion || 'Pick up where you left off'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )
          })()}
            </div>
          </div>
        </div>
      </div>
  )
}
