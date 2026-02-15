import { CheckCircle, Calculator, Microscope, Dna, Zap, BookOpen, Code, Atom, Wrench } from 'lucide-react'
import { useState } from 'react'

// Keep in sync with lucide imports
const Beaker = Atom // Using Atom as Beaker substitute if needed

interface NewCourseData {
  name: string
  code: string
  professor: string
  subject: string
  color: string
  category: string
}

interface CreateCourseModalProps {
  isOpen: boolean
  newCourseData: NewCourseData
  isCreatingCourse: boolean
  onCourseDataChange: (data: NewCourseData) => void
  onCancel: () => void
  onCreate: () => void
}

const SUBJECTS = [
  { value: 'math', label: 'Math', icon: Calculator },
  { value: 'science', label: 'Science', icon: Atom },
  { value: 'chemistry', label: 'Chemistry', icon: Atom },
  { value: 'biology', label: 'Biology', icon: Microscope },
  { value: 'physics', label: 'Physics', icon: Zap },
  { value: 'genetics', label: 'Genetics', icon: Dna },
  { value: 'engineering', label: 'Engineering', icon: Wrench },
  { value: 'computer_science', label: 'Computer Science', icon: Code },
  { value: 'literature', label: 'Literature', icon: BookOpen },
  { value: 'other', label: 'Other', icon: BookOpen },
]

function getSubjectIcon(subject: string) {
  const found = SUBJECTS.find(s => s.value === subject?.toLowerCase())
  if (found) {
    const Icon = found.icon
    return <Icon size={18} />
  }
  return <BookOpen size={18} />
}

export function CreateCourseModal({
  isOpen,
  newCourseData,
  isCreatingCourse,
  onCourseDataChange,
  onCancel,
  onCreate,
}: CreateCourseModalProps) {
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Course</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={newCourseData.name}
              onChange={(e) => onCourseDataChange({ ...newCourseData, name: e.target.value })}
              placeholder="e.g., Data Structures and Algorithms"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isCreatingCourse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Code
            </label>
            <input
              type="text"
              value={newCourseData.code}
              onChange={(e) => onCourseDataChange({ ...newCourseData, code: e.target.value })}
              placeholder="e.g., CS101"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isCreatingCourse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Professor
            </label>
            <input
              type="text"
              value={newCourseData.professor}
              onChange={(e) => onCourseDataChange({ ...newCourseData, professor: e.target.value })}
              placeholder="e.g., Dr. Smith"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isCreatingCourse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                disabled={isCreatingCourse}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {newCourseData.subject ? (
                    <>
                      {getSubjectIcon(newCourseData.subject)}
                      <span className="capitalize">{newCourseData.subject}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Select a subject</span>
                  )}
                </span>
                <span className={`text-lg transition-transform inline-block ${showSubjectDropdown ? 'rotate-180' : ''}`}>&#x25BC;</span>
              </button>

              {showSubjectDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject.value}
                      type="button"
                      onClick={() => {
                        onCourseDataChange({ ...newCourseData, subject: subject.value })
                        setShowSubjectDropdown(false)
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left ${
                        newCourseData.subject === subject.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <subject.icon size={20} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{subject.label}</span>
                      {newCourseData.subject === subject.value && (
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => {
                setShowSubjectDropdown(false)
                onCancel()
              }}
              disabled={isCreatingCourse}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              disabled={isCreatingCourse || !newCourseData.subject}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingCourse ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
