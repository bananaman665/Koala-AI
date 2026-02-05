'use client'

import Link from 'next/link'
import { hapticSelection } from '@/lib/haptics'
import { Home, Library, BarChart3, Users, Settings, User } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Lecture = Database['public']['Tables']['lectures']['Row']

interface LeftSidebarProps {
  activeScreen: 'dashboard' | 'library' | 'analytics' | 'feed'
  onNavigate: (screen: 'dashboard' | 'library' | 'analytics' | 'feed') => void
  courseFilter: 'active' | 'all' | 'favorites'
  onCourseFilterChange: (filter: 'active' | 'all' | 'favorites') => void
  recentLectures: Lecture[]
  onSelectLecture: (lectureId: string) => void
  onToggleFavorite?: (lectureId: string) => void
}

export function LeftSidebar({
  activeScreen,
  onNavigate,
  courseFilter,
  onCourseFilterChange,
  recentLectures,
  onSelectLecture,
  onToggleFavorite,
}: LeftSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home' },
    { id: 'library', label: 'Library' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'feed', label: 'Classes' },
  ]

  const iconMap = {
    dashboard: Home,
    library: Library,
    analytics: BarChart3,
    feed: Users,
  } as const

  return (
    <div className="hidden lg:fixed lg:left-0 lg:top-16 lg:w-64 lg:h-[calc(100vh-64px)] lg:flex lg:flex-col lg:bg-white dark:bg-[#1a2235] lg:border-r lg:border-gray-200 dark:border-white/[0.08] lg:overflow-y-auto lg:pt-6 lg:pb-6 lg:z-40">
      {/* Main Navigation */}
      <div className="px-4 mb-8">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
          Navigation
        </h3>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.id as keyof typeof iconMap]
            const isActive = activeScreen === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as 'dashboard' | 'library' | 'analytics' | 'feed')}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 border-t border-gray-200 dark:border-white/[0.08] pt-6">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Links
        </h3>

        <div className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
          >
            <User size={16} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
