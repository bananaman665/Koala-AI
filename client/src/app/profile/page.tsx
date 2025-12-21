'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  Loader2,
  Flame,
  Target,
  Mic,
  GraduationCap,
  Trophy,
  Zap,
  ChevronLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { useStreak } from '@/components/StreakDisplay'
import AppIcon from '@/components/AppIcon'

interface Lecture {
  id: string
  title: string
  duration: number
  created_at: string
  course_id: string
  courses?: {
    name: string
  }
}

interface Course {
  id: string
  name: string
  color: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { streak } = useStreak()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchData()
    }
  }, [user, authLoading])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      // Fetch lectures
      const { data: lecturesData } = await supabase
        .from('lectures')
        .select('*, courses(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)

      setLectures(lecturesData || [])
      setCourses(coursesData || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate real stats
  const totalLectures = lectures.length
  const totalHours = (lectures.reduce((sum, l) => sum + (l.duration || 0), 0) / 3600).toFixed(1)
  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const stats = [
    { label: 'Total Lectures', value: totalLectures.toString(), icon: BookOpen, bgClass: 'bg-blue-100 dark:bg-blue-500/15', iconClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'Study Hours', value: `${totalHours}h`, icon: Clock, bgClass: 'bg-purple-100 dark:bg-purple-500/15', iconClass: 'text-purple-600 dark:text-purple-400' },
    { label: 'Current Streak', value: `${streak} ${streak === 1 ? 'day' : 'days'}`, icon: TrendingUp, bgClass: 'bg-emerald-100 dark:bg-emerald-500/15', iconClass: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Courses', value: courses.length.toString(), icon: GraduationCap, bgClass: 'bg-amber-100 dark:bg-amber-500/15', iconClass: 'text-amber-600 dark:text-amber-400' },
  ]

  // Get recent activity from real lectures
  const recentActivity = lectures.slice(0, 4).map(lecture => {
    const createdDate = new Date(lecture.created_at)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
    const dateDisplay = diffHours < 24
      ? 'Today'
      : diffHours < 48
      ? 'Yesterday'
      : `${Math.floor(diffHours / 24)} days ago`
    const durationMinutes = Math.floor(lecture.duration / 60)
    const formattedDuration = durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      : `${durationMinutes}m`

    return {
      course: lecture.courses?.name || 'No course',
      lecture: lecture.title,
      date: dateDisplay,
      duration: formattedDuration
    }
  })

  // Calculate achievements based on real data
  const achievements = []
  if (streak >= 7) achievements.push({ icon: Flame, name: 'Week Warrior', description: '7 day streak', color: 'orange' })
  if (totalLectures >= 20) achievements.push({ icon: BookOpen, name: 'Bookworm', description: '20+ lectures', color: 'blue' })
  if (parseFloat(totalHours) >= 40) achievements.push({ icon: Clock, name: 'Time Master', description: '40+ hours', color: 'purple' })
  if (streak >= 3) achievements.push({ icon: Target, name: 'Getting Started', description: '3 day streak', color: 'green' })
  if (totalLectures >= 1) achievements.push({ icon: Mic, name: 'First Recording', description: 'First lecture', color: 'pink' })
  if (courses.length >= 3) achievements.push({ icon: GraduationCap, name: 'Multi-tasker', description: '3+ courses', color: 'cyan' })

  // Study progress from real courses
  const studyProgress = courses.slice(0, 4).map(course => {
    const courseLectures = lectures.filter(l => l.course_id === course.id)
    return {
      name: course.name,
      lectures: courseLectures.length,
      total: Math.max(courseLectures.length, 10), // Assume a goal of at least 10 per course
      color: course.color || 'blue'
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220]">
      {/* Navigation */}
      <nav className="bg-white dark:bg-[#151E2F] border-b border-gray-200 dark:border-[#1E293B] pt-12 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              <span className="text-gray-700 dark:text-[#F1F5F9] font-medium">Back</span>
            </Link>
            <span className="text-lg font-semibold text-gray-900 dark:text-[#F1F5F9]">Profile</span>
            <Link
              href="/settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile Card */}
            <div className="bg-white dark:bg-[#151E2F] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E293B] p-6">
              <div className="text-center">
                <div className="inline-block relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {userInitials}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-1">
                  {user.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-gray-600 dark:text-[#94A3B8] mb-3">{user.email}</p>
                <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  Free Plan
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#1E293B] space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 dark:text-[#94A3B8] w-32">Member since:</span>
                  <span className="text-gray-900 dark:text-[#F1F5F9] font-medium">{memberSince}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 dark:text-[#94A3B8] w-32">Courses:</span>
                  <span className="text-gray-900 dark:text-[#F1F5F9] font-medium">{courses.length}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 dark:text-[#94A3B8] w-32">Lectures:</span>
                  <span className="text-gray-900 dark:text-[#F1F5F9] font-medium">{totalLectures}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/settings"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg dark:shadow-purple-500/20 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-[#151E2F] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E293B] p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F1F5F9] mb-4">Achievements</h3>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 4).map((achievement, i) => {
                    const AchievementIcon = achievement.icon
                    return (
                      <div key={i} className="text-center p-4 bg-gray-50 dark:bg-[#1E293B] rounded-xl">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-${achievement.color}-100 dark:bg-${achievement.color}-500/20`}>
                          <AchievementIcon className={`w-6 h-6 text-${achievement.color}-600 dark:text-${achievement.color}-400`} />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-[#F1F5F9]">{achievement.name}</div>
                        <div className="text-xs text-gray-500 dark:text-[#94A3B8]">{achievement.description}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-[#94A3B8] text-center py-4">
                  Start recording lectures to earn achievements!
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="bg-white dark:bg-[#151E2F] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E293B] p-4 md:p-5">
                    <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 ${stat.bgClass} rounded-xl mb-3`}>
                      <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.iconClass}`} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-1">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-500 dark:text-[#94A3B8]">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#151E2F] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E293B] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F1F5F9]">Recent Activity</h3>
                <Link
                  href="/dashboard"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  View All
                </Link>
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-xl hover:bg-gray-100 dark:hover:bg-[#263549] transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-[#F1F5F9] mb-1">{activity.lecture}</h4>
                        <p className="text-sm text-gray-500 dark:text-[#94A3B8]">{activity.course}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#F1F5F9]">{activity.duration}</div>
                        <div className="text-xs text-gray-500 dark:text-[#94A3B8]">{activity.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-[#94A3B8] py-8">
                  No lectures recorded yet. Start recording to see your activity!
                </p>
              )}
            </div>

            {/* Study Progress */}
            {studyProgress.length > 0 && (
              <div className="bg-white dark:bg-[#151E2F] rounded-xl shadow-sm border border-gray-200 dark:border-[#1E293B] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F1F5F9] mb-5">Study Progress</h3>
                <div className="space-y-4">
                  {studyProgress.map((course, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-[#F1F5F9]">{course.name}</span>
                        <span className="text-sm text-gray-500 dark:text-[#94A3B8]">
                          {course.lectures} lectures
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#1E293B] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((course.lectures / course.total) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
