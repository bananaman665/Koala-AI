'use client'

import Link from 'next/link'
import { Book, Loader, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import AppIcon from '@/components/AppIcon'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

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
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    professor: '',
    category: 'computer-science',
    color: 'blue'
  })
  const [submitting, setSubmitting] = useState(false)

  const isTestMode = !isSupabaseConfigured

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
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    // Check if trying to delete default "My Course"
    if (courseToDelete.name === 'My Course' && courseToDelete.code === '100') {
      toast.error('Cannot delete your default course')
      setShowDeleteModal(false)
      setCourseToDelete(null)
      return
    }

    setIsDeleting(true)
    try {
      if (isTestMode) {
        // Use local storage
        const updatedCourses = courses.filter(c => c.id !== courseToDelete.id)
        setCourses(updatedCourses)
        localStorage.setItem('koala_courses', JSON.stringify(updatedCourses))
      } else {
        // Use Supabase
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseToDelete.id)

        if (error) throw error

        setCourses(courses.filter(c => c.id !== courseToDelete.id))
      }
      toast.success('Course deleted')
    } catch (error) {
      toast.error('Failed to delete course')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setCourseToDelete(null)
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course)
    setShowDeleteModal(true)
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Test Mode:</strong> Supabase not configured. Data is stored in browser memory and will reset on refresh.
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline ml-2">Set up Supabase →</a>
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <AppIcon size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Koala.ai
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                Dashboard
              </Link>
              <Link href="/dashboard/library" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                Library
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize and manage your course recordings</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <Plus />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{courses.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Courses</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses.reduce((sum, course) => sum + (course.lectures || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Lectures</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses.reduce((sum, course) => sum + (course.totalHours || 0), 0).toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Study Time</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses.filter(c => (c.lectures || 0) > 0).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Courses</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (course.name !== 'My Course' || course.code !== '100') {
                    openDeleteModal(course)
                  }
                }}
                disabled={course.name === 'My Course' && course.code === '100'}
                className={`absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md transition-colors opacity-0 group-hover:opacity-100 ${
                  course.name === 'My Course' && course.code === '100'
                    ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500'
                    : 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600'
                }`}
                title={course.name === 'My Course' && course.code === '100' ? 'Cannot delete your default course' : 'Delete course'}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <Link href={`/courses/${course.id}`} className="block">
                <div className={`h-2 bg-gradient-to-r from-${course.color}-500 to-${course.color}-600`}></div>
                <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{course.code}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{course.professor}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{course.lectures}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Lectures</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{course.totalHours}h</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Updated {course.lastUpdated}</span>
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Course</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Data Structures & Algorithms"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., CS 201"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Professor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Professor Name *
                </label>
                <input
                  type="text"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Dr. Sarah Johnson"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-200 dark:border-gray-600'
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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

      {/* Delete Course Confirmation Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <Trash2 className="w-12 h-12 mx-auto text-red-600" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Course?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <strong>{courseToDelete.name}</strong>? This will also delete all associated lectures and notes.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setCourseToDelete(null)
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <Loader className="animate-spin text-lg" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
