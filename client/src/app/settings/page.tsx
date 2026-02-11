'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Volume2, Moon, Sun, Bell, Shield, HelpCircle, Mail, Play, ChevronRight, Lock, ChevronLeft, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { hapticButton, hapticSelection, hapticSuccess } from '@/lib/haptics'
import { DailyGreeting } from '@/components/DailyGreeting'
import { useStreak } from '@/components/StreakDisplay'
import { useLevel } from '@/hooks/useLevel'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { isDark, toggleDarkMode } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [showDailyGreeting, setShowDailyGreeting] = useState(false)
  const { streak } = useStreak()
  const { totalXP } = useLevel()

  // Settings state
  const [notifications, setNotifications] = useState(true)
  const [hapticFeedback, setHapticFeedback] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('settings-notifications')
    const savedHaptic = localStorage.getItem('settings-haptic')
    const savedAutoSave = localStorage.getItem('settings-autosave')

    if (savedNotifications !== null) setNotifications(savedNotifications === 'true')
    if (savedHaptic !== null) setHapticFeedback(savedHaptic === 'true')
    if (savedAutoSave !== null) setAutoSave(savedAutoSave === 'true')

    setIsLoading(false)
  }, [])

  // Auth guard
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push('/auth/login')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [user, router])

  const handleToggle = (setting: string, value: boolean, setter: (v: boolean) => void) => {
    hapticSelection()
    setter(value)
    localStorage.setItem(`settings-${setting}`, String(value))
  }

  const handleSignOut = async () => {
    hapticButton()
    await logout()
    router.push('/auth/login')
  }

  const handleBack = () => {
    hapticButton()
    router.back()
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
      {/* Daily Greeting Modal */}
      {showDailyGreeting && (
        <DailyGreeting
          streak={streak}
          totalXP={totalXP}
          lecturesCompletedToday={0}
          onDismiss={() => setShowDailyGreeting(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 animate-slide-in-up">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account</h2>
          </div>

          <Link
            href="/profile"
            onClick={() => hapticButton()}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.email?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View profile</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <button
            onClick={() => { hapticButton(); router.push('/auth/change-password') }}
            className="flex items-center justify-between p-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Lock size={20} className="text-gray-600 dark:text-gray-300" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preferences</h2>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {isDark ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDark ? 'On' : 'Off'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { hapticSelection(); toggleDarkMode() }}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isDark ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Push notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('notifications', !notifications, setNotifications)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                notifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Haptic Feedback</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vibration on actions</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleToggle('haptic', !hapticFeedback, setHapticFeedback)
                if (!hapticFeedback) hapticSuccess() // Demo the haptic when turning on
              }}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                hapticFeedback ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto-Save</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Save recordings automatically</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('autosave', !autoSave, setAutoSave)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                autoSave ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Support</h2>
          </div>

          <Link
            href="/help"
            onClick={() => hapticButton()}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Help & FAQ</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            href="mailto:support@koala.ai"
            onClick={() => hapticButton()}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Contact Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <button
            onClick={() => {
              hapticButton()
              localStorage.removeItem('onboarding_completed')
              router.push('/dashboard')
            }}
            className="flex items-center justify-between p-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Replay Tutorial</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View the app introduction again</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => {
              hapticButton()
              setShowDailyGreeting(true)
            }}
            className="flex items-center justify-between p-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-current" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Replay Daily Greeting</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View the morning/afternoon/evening greeting</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h2>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-between p-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">Sign Out</span>
            </div>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">Koala.ai v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
