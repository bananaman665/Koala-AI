'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const COLORS = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500' },
]

const CATEGORIES = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Business',
  'Other',
]

interface NewCourseModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  code: string
  professor: string
  color: string
  category: string
  onNameChange: (value: string) => void
  onCodeChange: (value: string) => void
  onProfessorChange: (value: string) => void
  onColorChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSubmit: () => void
  isCreating: boolean
}

export function NewCourseModal({
  isOpen,
  onClose,
  name,
  code,
  professor,
  color,
  category,
  onNameChange,
  onCodeChange,
  onProfessorChange,
  onColorChange,
  onCategoryChange,
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

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex gap-3">
            {COLORS.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => onColorChange(colorOption.value)}
                className={`w-10 h-10 rounded-full ${colorOption.bg} transition-transform ${
                  color === colorOption.value
                    ? 'ring-4 ring-offset-2 ring-violet-500 scale-110'
                    : 'hover:scale-105'
                }`}
                aria-label={`Select ${colorOption.label} color`}
              />
            ))}
          </div>
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