'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FiSearch, FiFilter, FiBook, FiClock, FiStar, FiTrendingUp, FiPlus, FiX } from 'react-icons/fi'
import AppIcon from '@/components/AppIcon'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Course {
  id: string
  name: string
  code: string
  professor: string
  lectures: number
  totalHours: number
  lastUpdated: string
  color: string
  category: string
  userId: string
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    professor: '',
    category: 'computer-science',
    color: 'blue'
  })
  const [submitting, setSubmitting] = useState(false)

  const categories = ['all', 'computer-science', 'mathematics', 'engineering', 'business', 'science']
  const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'red', 'yellow', 'indigo']

  // Fetch courses from Supabase (or use mock data if not configured)
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchCourses = async () => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured) {
          // Supabase not configured - use local storage for testing
          const savedCourses = localStorage.getItem('koala_courses')
          if (savedCourses) {
            setCourses(JSON.parse(savedCourses))
          }
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const coursesData = data.map((course: any) => ({
          id: course.id,
          name: course.name,
          code: course.code,
          professor: course.professor,
          category: course.category,
          color: course.color,
          lectures: course.lectures,
          totalHours: course.total_hours,
          lastUpdated: course.last_updated,
          userId: course.user_id
        })) as Course[]

        setCourses(coursesData)
      } catch (error) {
        // Fallback to local storage on error
        const savedCourses = localStorage.getItem('koala_courses')
        if (savedCourses) {
          setCourses(JSON.parse(savedCourses))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user])

  // Add new course (local storage or Supabase)
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign up or log in to add courses!')
      return
    }

    setSubmitting(true)
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        // Supabase not configured - use local storage
        const newCourse: Course = {
          id: Date.now().toString(),
          ...formData,
          userId: user.id,
          lectures: 0,
          totalHours: 0,
          lastUpdated: 'Just now'
        }
        
        const updatedCourses = [...courses, newCourse]
        setCourses(updatedCourses)
        localStorage.setItem('koala_courses', JSON.stringify(updatedCourses))
      } else {
        // Use Supabase
        const { data, error } = await supabase
          .from('courses')
          .insert({
            user_id: user.id,
            name: formData.name,
            code: formData.code,
            professor: formData.professor,
            category: formData.category,
            color: formData.color,
            lectures: 0,
            total_hours: 0,
            last_updated: 'Just now'
          } as any)
          .select()
          .single()

        if (error) throw error

        // Add to local state
        const newCourse: Course = {
          id: (data as any).id,
          ...formData,
          userId: user.id,
          lectures: 0,
          totalHours: 0,
          lastUpdated: 'Just now'
        }
        setCourses([...courses, newCourse])
      }

      // Reset form and close modal
      setFormData({
        name: '',
        code: '',
        professor: '',
        category: 'computer-science',
        color: 'blue'
      })
      setShowAddModal(false)
    } catch (error) {
      alert('Failed to add course. Check console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete course (local storage or Supabase)
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      if (isTestMode) {
        // Use local storage
        const updatedCourses = courses.filter(c => c.id !== courseId)
        setCourses(updatedCourses)
        localStorage.setItem('koala_courses', JSON.stringify(updatedCourses))
      } else {
        // Use Supabase
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId)

        if (error) throw error

        setCourses(courses.filter(c => c.id !== courseId))
      }
    } catch (error) {
      alert('Failed to delete course')
    }
  }

  const isTestMode = !isSupabaseConfigured

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Test Mode:</strong> Supabase not configured. Data is stored in browser memory and will reset on refresh. 
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline ml-2">Set up Supabase →</a>
            </p>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <AppIcon size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Dashboard
              </Link>
              <Link href="/dashboard/library" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Library
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Organize and manage your course recordings</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="computer-science">Computer Science</option>
              <option value="mathematics">Mathematics</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
            </select>

            {/* Add Course Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow whitespace-nowrap flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{courses.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Courses</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiBook className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.lectures || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Lectures</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiStar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.totalHours || 0), 0).toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600 mt-1">Study Time</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {courses.filter(c => (c.lectures || 0) > 0).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Courses</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteCourse(course.id)
                }}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete course"
              >
                <FiX className="w-4 h-4" />
              </button>

              <Link href={`/courses/${course.id}`} className="block">
                <div className={`h-2 bg-gradient-to-r from-${course.color}-500 to-${course.color}-600`}></div>
                <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{course.professor}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{course.lectures}</div>
                    <div className="text-xs text-gray-600">Lectures</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{course.totalHours}h</div>
                    <div className="text-xs text-gray-600">Total Time</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Updated {course.lastUpdated}</span>
                  <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                    View Details →
                  </span>
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">
              {courses.length === 0 ? 'Get started by adding your first course' : 'Try adjusting your search or filters'}
            </p>
            {courses.length === 0 ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Add Your First Course
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Course</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Data Structures & Algorithms"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., CS 201"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Professor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professor Name *
                </label>
                <input
                  type="text"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Dr. Sarah Johnson"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={submitting}
                >
                  <option value="computer-science">Computer Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="engineering">Engineering</option>
                  <option value="business">Business</option>
                  <option value="science">Science</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      disabled={submitting}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                      } ${
                        color === 'blue' ? 'bg-blue-500' :
                        color === 'purple' ? 'bg-purple-500' :
                        color === 'green' ? 'bg-green-500' :
                        color === 'orange' ? 'bg-orange-500' :
                        color === 'pink' ? 'bg-pink-500' :
                        color === 'red' ? 'bg-red-500' :
                        color === 'yellow' ? 'bg-yellow-500' :
                        'bg-indigo-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
