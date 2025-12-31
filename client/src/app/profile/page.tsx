'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  BookOpen,
  Clock,
  TrendingUp,
  Loader2,
  Flame,
  Mic,
  GraduationCap,
  ChevronLeft,
  Pencil,
  Check,
  X,
  Gift,
  Lock,
  HelpCircle,
  Timer,
  FileText
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
import { useStreak } from '@/components/StreakDisplay'
import { useLevel, XP_REWARDS } from '@/hooks/useLevel'

interface Lecture {
  id: string
  title: string
  duration: number
  created_at: string
  course_id: string
  transcription_status?: string
  courses?: {
    name: string
  }
}

interface Course {
  id: string
  name: string
  color: string
}

// Track which quests were rewarded today
const QUEST_REWARDS_KEY = 'koala_quest_rewards'

function getRewardedQuestsToday(): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(QUEST_REWARDS_KEY)
  if (!stored) return []
  try {
    const data = JSON.parse(stored)
    const today = new Date().toDateString()
    if (data.date !== today) return []
    return data.rewarded || []
  } catch {
    return []
  }
}

function markQuestRewarded(questId: string): void {
  if (typeof window === 'undefined') return
  const today = new Date().toDateString()
  const current = getRewardedQuestsToday()
  if (!current.includes(questId)) {
    localStorage.setItem(QUEST_REWARDS_KEY, JSON.stringify({
      date: today,
      rewarded: [...current, questId]
    }))
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { streak } = useStreak()
  const { addXP } = useLevel()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [rewardedQuests, setRewardedQuests] = useState<string[]>([])

  // Load rewarded quests on mount
  useEffect(() => {
    setRewardedQuests(getRewardedQuestsToday())
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchData()
    }
  }, [user, authLoading])

  // Award XP for newly completed quests (must be before early returns)
  useEffect(() => {
    // Only run when data is loaded
    if (authLoading || loading || !user) return

    const today = new Date().toDateString()
    const lecturesRecordedToday = lectures.filter(l => new Date(l.created_at).toDateString() === today).length
    const studyMinutesToday = Math.floor(lectures.filter(l => new Date(l.created_at).toDateString() === today).reduce((sum, l) => sum + (l.duration || 0), 0) / 60)

    const questsStatus = [
      { id: 'record_lecture', completed: lecturesRecordedToday >= 1 },
      { id: 'study_10_min', completed: studyMinutesToday >= 10 },
      { id: 'maintain_streak', completed: streak > 0 },
    ]

    questsStatus.forEach(quest => {
      if (quest.completed && !rewardedQuests.includes(quest.id)) {
        const questTitles: Record<string, string> = {
          'record_lecture': 'Record a lecture',
          'study_10_min': 'Study for 10 minutes',
          'maintain_streak': 'Maintain your streak',
        }
        addXP(XP_REWARDS.DAILY_QUEST, `Daily Quest: ${questTitles[quest.id]}`)
        markQuestRewarded(quest.id)
        setRewardedQuests(prev => [...prev, quest.id])
      }
    })
  }, [authLoading, loading, user, lectures, streak, rewardedQuests, addXP])

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

  const handleEditName = () => {
    setNewName(user?.user_metadata?.full_name || '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    
    setIsSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() }
      })
      
      if (error) throw error
      
      // Force a page reload to refresh user data
      window.location.reload()
    } catch (error) {
      console.error('Error updating name:', error)
    } finally {
      setIsSavingName(false)
      setIsEditingName(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setNewName('')
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
  const totalSeconds = lectures.reduce((sum, l) => sum + (l.duration || 0), 0)
  const studyHours = Math.floor(totalSeconds / 3600)
  const studyMinutes = Math.floor((totalSeconds % 3600) / 60)
  const studyTimeDisplay = studyHours > 0 ? `${studyHours}h ${studyMinutes}m` : `${studyMinutes}m`
  const completedPercent = totalLectures > 0
    ? Math.round((lectures.filter(l => l.transcription_status === 'completed').length / totalLectures) * 100)
    : 0
  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const stats = [
    { label: 'Study Time', value: studyTimeDisplay, icon: Clock, bgClass: 'bg-blue-50 dark:bg-gray-800', borderClass: 'border-blue-200 dark:border-gray-700', iconClass: 'text-blue-600 dark:text-gray-400', valueClass: 'text-blue-900 dark:text-white', labelClass: 'text-blue-700 dark:text-gray-400' },
    { label: 'Lectures', value: totalLectures.toString(), icon: FileText, bgClass: 'bg-purple-50 dark:bg-gray-800', borderClass: 'border-purple-200 dark:border-gray-700', iconClass: 'text-purple-600 dark:text-gray-400', valueClass: 'text-purple-900 dark:text-white', labelClass: 'text-purple-700 dark:text-gray-400' },
    { label: 'Courses', value: courses.length.toString(), icon: BookOpen, bgClass: 'bg-green-50 dark:bg-gray-800', borderClass: 'border-green-200 dark:border-gray-700', iconClass: 'text-green-600 dark:text-gray-400', valueClass: 'text-green-900 dark:text-white', labelClass: 'text-green-700 dark:text-gray-400' },
    { label: 'Completed', value: `${completedPercent}%`, icon: Mic, bgClass: 'bg-orange-50 dark:bg-gray-800', borderClass: 'border-orange-200 dark:border-gray-700', iconClass: 'text-orange-600 dark:text-gray-400', valueClass: 'text-orange-900 dark:text-white', labelClass: 'text-orange-700 dark:text-gray-400' },
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

  // Calculate time until midnight for quest reset
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const hoursUntilReset = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60))
  const minutesUntilReset = Math.floor(((midnight.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))

  // Calculate today's progress for daily quests
  const today = new Date().toDateString()
  const lecturesRecordedToday = lectures.filter(l => new Date(l.created_at).toDateString() === today).length
  const studyMinutesToday = Math.floor(lectures.filter(l => new Date(l.created_at).toDateString() === today).reduce((sum, l) => sum + (l.duration || 0), 0) / 60)

  // Daily Quests
  const dailyQuests = [
    {
      id: 'record_lecture',
      icon: Mic,
      title: 'Record a lecture',
      current: Math.min(lecturesRecordedToday, 1),
      target: 1,
      iconBgClass: 'bg-amber-100 dark:bg-amber-500/20',
      iconClass: 'text-amber-500',
      progressClass: 'bg-amber-400',
      completed: lecturesRecordedToday >= 1,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
    {
      id: 'study_10_min',
      icon: Clock,
      title: 'Study for 10 minutes',
      current: Math.min(studyMinutesToday, 10),
      target: 10,
      iconBgClass: 'bg-blue-100 dark:bg-blue-500/20',
      iconClass: 'text-blue-500',
      progressClass: 'bg-blue-400',
      completed: studyMinutesToday >= 10,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
    {
      id: 'maintain_streak',
      icon: Flame,
      title: 'Maintain your streak',
      current: streak > 0 ? 1 : 0,
      target: 1,
      iconBgClass: 'bg-orange-100 dark:bg-orange-500/20',
      iconClass: 'text-orange-500',
      progressClass: 'bg-orange-400',
      completed: streak > 0,
      xpReward: XP_REWARDS.DAILY_QUEST
    },
  ]

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#0B1220] border-b border-gray-200 dark:border-white/[0.06] pt-12 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2 w-20">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              <span className="text-gray-700 dark:text-[#F1F5F9] font-medium">Back</span>
            </Link>
            <span className="text-lg font-semibold text-gray-900 dark:text-[#F1F5F9]">Profile</span>
            <div className="w-20 flex justify-end">
              <Link
                href="/settings"
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 sm:pt-28">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-6 dark:hover:bg-white/5 transition-colors">
              <div className="text-center">
                <div className="inline-block relative">
                  <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {userInitials}
                  </div>
                </div>
                
                {/* Name with edit feature */}
                {isEditingName ? (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-xl font-bold text-gray-900 dark:text-[#F1F5F9] bg-gray-100 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] rounded-lg px-3 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName || !newName.trim()}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 bg-gray-200 dark:bg-[#1E293B] hover:bg-gray-300 dark:hover:bg-[#334155] text-gray-600 dark:text-[#94A3B8] rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F1F5F9]">
                      {user.user_metadata?.full_name || 'User'}
                    </h2>
                    <button
                      onClick={handleEditName}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors"
                      title="Edit name"
                    >
                      <Pencil className="w-4 h-4 text-gray-400 dark:text-[#94A3B8]" />
                    </button>
                  </div>
                )}
                
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
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className={`${stat.bgClass} rounded-xl p-4 border ${stat.borderClass} transition-colors hover:bg-opacity-70 dark:hover:bg-white/10`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`${stat.iconClass} text-xl`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
                    <p className={`text-xs ${stat.labelClass}`}>{stat.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Daily Quests */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] dark:hover:bg-white/5 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9]">Daily Quests</h3>
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-semibold">{hoursUntilReset}H {minutesUntilReset}M</span>
                </div>
              </div>

              {/* Quest Cards */}
              <div className="px-5 pb-5 space-y-3">
                {dailyQuests.map((quest, i) => {
                  const QuestIcon = quest.icon
                  const progressPercent = (quest.current / quest.target) * 100

                  // Map quest IDs to border colors
                  const borderColors: Record<string, string> = {
                    'record_lecture': 'border-l-amber-500',
                    'study_10_min': 'border-l-blue-500',
                    'maintain_streak': 'border-l-orange-500'
                  }

                  return (
                    <div
                      key={i}
                      className={`relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/[0.06] border-l-4 ${borderColors[quest.id]} rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/10`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${quest.iconBgClass}`}>
                          <QuestIcon className={`w-5 h-5 ${quest.iconClass}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-[#F1F5F9]">{quest.title}</h4>
                          </div>
                          {/* Progress Bar */}
                          <div className="relative h-5 bg-gray-200 dark:bg-[#0B1220] rounded-full overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 ${quest.progressClass} rounded-full transition-all duration-500 progress-animate`}
                              style={{ width: `${progressPercent}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white dark:text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                              {quest.current} / {quest.target}
                            </span>
                          </div>
                        </div>

                        {/* Reward Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quest.completed ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-200 dark:bg-[#0B1220]'}`}>
                          {quest.completed ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Gift className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Upcoming Quests */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-[#94A3B8] mb-3">Upcoming</h4>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/[0.06] border-l-4 border-l-gray-300 dark:border-l-gray-600 rounded-xl p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-[#0B1220]">
                          <HelpCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-500 dark:text-[#94A3B8]">Revealed tomorrow</h4>
                          <div className="h-5 bg-gray-200 dark:bg-[#0B1220] rounded-full mt-2" />
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-[#0B1220]">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-6 dark:hover:bg-white/5 transition-colors">
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
                      className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/[0.06] rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-6 dark:hover:bg-white/5 transition-colors">
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
                      <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 progress-animate"
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
