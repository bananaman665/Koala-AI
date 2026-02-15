import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']

interface SaveLectureModalProps {
  isOpen: boolean
  courses: Course[]
  lectureTitle: string
  selectedCourseForRecording: string | null
  isSavingRecording: boolean
  onLectureTitleChange: (title: string) => void
  onSelectCourse: (courseId: string) => void
  onCancel: () => void
  onSave: () => void
}

export function SaveLectureModal({
  isOpen,
  courses,
  lectureTitle,
  selectedCourseForRecording,
  isSavingRecording,
  onLectureTitleChange,
  onSelectCourse,
  onCancel,
  onSave,
}: SaveLectureModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 pb-8 space-y-4 animate-slide-in-up">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Save Lecture</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Name your lecture and select a course</p>
        </div>

        {/* Lecture Title Input */}
        <div>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => onLectureTitleChange(e.target.value)}
            placeholder={`Lecture ${new Date().toLocaleDateString()}`}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Course List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedCourseForRecording === course.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 transition-all"
                  style={{
                    borderColor: course.color || '#3b82f6',
                    backgroundColor:
                      selectedCourseForRecording === course.id ? course.color || '#3b82f6' : 'transparent',
                  }}
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{course.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.code}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!selectedCourseForRecording || isSavingRecording}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSavingRecording ? 'Saving...' : 'Save Lecture'}
          </button>
        </div>
      </div>
    </div>
  )
}
