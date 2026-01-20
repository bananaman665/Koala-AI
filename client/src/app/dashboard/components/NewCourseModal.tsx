'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const SUBJECTS = [
  'Math',
  'Science',
  'Chemistry',
  'Biology',
  'Physics',
  'Genetics',
  'Engineering',
  'Literature',
  'Other',
]

interface NewCourseModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  code: string
  professor: string
  subject: string
  onNameChange: (value: string) => void
  onCodeChange: (value: string) => void
  onProfessorChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onSubmit: () => void
  isCreating: boolean
}

export function NewCourseModal({
  isOpen,
  onClose,
  name,
  code,
  professor,
  subject,
  onNameChange,
  onCodeChange,
  onProfessorChange,
  onSubjectChange,
  onSubmit,
  isCreating,
}: NewCourseModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Course"
      description="Add a new course to your library"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course Name */}
        <div>
          <label
            htmlFor="course-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Course Name *
          </label>
          <input
            id="course-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Data Structures"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>

        {/* Course Code */}
        <div>
          <label
            htmlFor="course-code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Course Code *
          </label>
          <input
            id="course-code"
            type="text"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="e.g., CS101"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>

        {/* Professor Name */}
        <div>
          <label
            htmlFor="professor-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Professor Name *
          </label>
          <input
            id="professor-name"
            type="text"
            value={professor}
            onChange={(e) => onProfessorChange(e.target.value)}
            placeholder="e.g., Dr. Smith"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>

        {/* Subject Selection */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          >
            <option value="">Select a subject</option>
            {SUBJECTS.map((subj) => (
              <option key={subj} value={subj.toLowerCase()}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isCreating}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isCreating}
            fullWidth
          >
            Create Course
          </Button>
        </div>
      </form>
    </Modal>
  )
}