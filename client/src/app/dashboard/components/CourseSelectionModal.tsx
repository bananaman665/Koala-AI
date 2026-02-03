'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']

const courseColorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
}

interface CourseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  courses: Course[]
  selectedCourseId: string | null
  lectureTitle: string
  onCourseSelect: (courseId: string) => void
  onTitleChange: (title: string) => void
  onCreateCourse: () => void
  onStartRecording: () => void
}

export function CourseSelectionModal({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  lectureTitle,
  onCourseSelect,
  onTitleChange,
  onCreateCourse,
  onStartRecording,
}: CourseSelectionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ready to Record"
      description="Select a course and give your lecture a title"
      size="md"
    >
      <div className="space-y-4">
        {/* Lecture Title Input */}
        <div>
          <label
            htmlFor="lecture-title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Lecture Title
          </label>
          <input
            id="lecture-title"
            type="text"
            value={lectureTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Introduction to Data Structures"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Course
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {courses.map((course) => {
              const colorClass = courseColorClasses[course.color] || courseColorClasses.blue

              return (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect(course.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCourseId === course.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colorClass.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Folder className={`text-lg ${colorClass.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {course.code ? `${course.code} - ${course.name}` : course.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {course.lectures} {course.lectures === 1 ? 'lecture' : 'lectures'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Create New Course Button */}
          <button
            onClick={onCreateCourse}
            className="w-full mt-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
          >
            <span className="text-lg">➕</span>
            <span className="font-medium">Create New Course</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onStartRecording}
            disabled={!selectedCourseId}
            fullWidth
          >
            Start Recording
          </Button>
        </div>
      </div>
    </Modal>
  )
}