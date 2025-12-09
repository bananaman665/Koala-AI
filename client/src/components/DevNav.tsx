'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  FiHome, FiMic, FiFolder, FiBarChart2, FiFileText, FiSettings, 
  FiX, FiUser, FiBook, FiSearch, FiHelpCircle, FiLogIn, FiUserPlus,
  FiDollarSign, FiMenu
} from 'react-icons/fi'

export default function DevNav() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<'main' | 'auth' | 'other'>('main')

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50"
      >
        🐨
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-72 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🐨</span>
          <span className="font-semibold text-gray-900">All Pages</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <FiX />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 mb-3 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('main')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'main' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Main
        </button>
        <button
          onClick={() => setActiveSection('auth')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'auth' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Auth
        </button>
        <button
          onClick={() => setActiveSection('other')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSection === 'other' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Other
        </button>
      </div>

      {/* Main Pages */}
      {activeSection === 'main' && (
        <div className="space-y-1">
          <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiHome className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Landing Page</span>
          </Link>
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiMic className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Dashboard</span>
          </Link>
          <Link href="/dashboard/library" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiFolder className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Library</span>
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiBarChart2 className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Analytics</span>
          </Link>
          <Link href="/notes" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiFileText className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Notes Viewer</span>
          </Link>
          <Link href="/profile" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiUser className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Profile</span>
          </Link>
          <Link href="/courses" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiBook className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Courses</span>
          </Link>
          <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiSettings className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Settings</span>
          </Link>
        </div>
      )}

      {/* Auth Pages */}
      {activeSection === 'auth' && (
        <div className="space-y-1">
          <Link href="/auth/login" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiLogIn className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Login</span>
          </Link>
          <Link href="/auth/signup" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiUserPlus className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Sign Up</span>
          </Link>
          <Link href="/auth/forgot-password" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiHelpCircle className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Forgot Password</span>
          </Link>
        </div>
      )}

      {/* Other Pages */}
      {activeSection === 'other' && (
        <div className="space-y-1">
          <Link href="/search" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiSearch className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Search</span>
          </Link>
          <Link href="/help" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiHelpCircle className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Help Center</span>
          </Link>
          <Link href="/pricing" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiDollarSign className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Pricing</span>
          </Link>
          <Link href="/terms" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiFileText className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Terms of Service</span>
          </Link>
          <Link href="/privacy" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiSettings className="text-gray-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">Privacy Policy</span>
          </Link>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {activeSection === 'main' && '8 main pages'}
          {activeSection === 'auth' && '3 auth pages'}
          {activeSection === 'other' && '5 other pages'}
          <br />
          Total: 16 pages
        </p>
      </div>
    </div>
  )
}
