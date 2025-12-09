'use client'

import Link from 'next/link'
import { 
  FiUser, 
  FiSettings, 
  FiAward, 
  FiBook, 
  FiClock,
  FiTrendingUp,
  FiEdit2,
  FiShare2
} from 'react-icons/fi'

export default function ProfilePage() {
  const user = {
    name: 'John Doe',
    email: 'john.doe@mit.edu',
    university: 'MIT',
    graduationYear: '2026',
    major: 'Computer Science',
    joinedDate: 'September 2024',
    avatar: 'JD'
  }

  const stats = [
    { label: 'Total Lectures', value: '24', icon: FiBook, color: 'blue' },
    { label: 'Study Hours', value: '48.5h', icon: FiClock, color: 'purple' },
    { label: 'Current Streak', value: '7 days', icon: FiTrendingUp, color: 'green' },
    { label: 'Achievements', value: '12', icon: FiAward, color: 'yellow' },
  ]

  const recentActivity = [
    { course: 'Data Structures & Algorithms', lecture: 'Binary Trees', date: 'Today', duration: '1h 15m' },
    { course: 'Machine Learning', lecture: 'Neural Networks', date: 'Yesterday', duration: '1h 30m' },
    { course: 'Web Development', lecture: 'React Hooks', date: '2 days ago', duration: '55m' },
    { course: 'Database Systems', lecture: 'SQL Optimization', date: '3 days ago', duration: '1h 20m' },
  ]

  const achievements = [
    { emoji: '🔥', name: 'Week Warrior', description: '7 day streak' },
    { emoji: '📚', name: 'Bookworm', description: '20+ lectures' },
    { emoji: '⏰', name: 'Time Master', description: '40+ hours' },
    { emoji: '🎯', name: 'Goal Getter', description: 'Weekly goal x5' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🐨</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiSettings className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="inline-block relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {user.avatar}
                  </div>
                  <button className="absolute bottom-3 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50">
                    <FiEdit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  Free Plan
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">University:</span>
                  <span className="text-gray-900 font-medium">{user.university}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Major:</span>
                  <span className="text-gray-900 font-medium">{user.major}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Graduating:</span>
                  <span className="text-gray-900 font-medium">{user.graduationYear}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Member since:</span>
                  <span className="text-gray-900 font-medium">{user.joinedDate}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link
                  href="/settings"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <FiEdit2 />
                  <span>Edit Profile</span>
                </Link>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900">
                  <FiShare2 />
                  <span>Share Profile</span>
                </button>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-3xl mb-1">{achievement.emoji}</div>
                    <div className="text-xs font-medium text-gray-900">{achievement.name}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/analytics"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
              >
                View All Achievements →
              </Link>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-${stat.color}-100 rounded-lg mb-3`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                <Link
                  href="/dashboard/library"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{activity.lecture}</h4>
                      <p className="text-sm text-gray-600">{activity.course}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">{activity.duration}</div>
                      <div className="text-xs text-gray-600">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Study Progress</h3>
              <div className="space-y-4">
                {[
                  { name: 'Data Structures & Algorithms', lectures: 8, total: 12, color: 'blue' },
                  { name: 'Machine Learning', lectures: 6, total: 10, color: 'purple' },
                  { name: 'Web Development', lectures: 5, total: 8, color: 'green' },
                  { name: 'Database Systems', lectures: 5, total: 15, color: 'orange' },
                ].map((course, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{course.name}</span>
                      <span className="text-sm text-gray-600">
                        {course.lectures}/{course.total} lectures
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`bg-${course.color}-600 h-2 rounded-full`}
                        style={{ width: `${(course.lectures / course.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
