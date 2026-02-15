import { hapticButton, hapticSelection } from '@/lib/haptics'

const courseColorClasses: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
}

interface NewClassData {
  name: string
  code: string
  professor: string
  color: string
}

interface CreateClassModalProps {
  isOpen: boolean
  newClassData: NewClassData
  isCreatingClass: boolean
  onClassDataChange: (data: NewClassData) => void
  onCancel: () => void
  onCreate: () => void
}

export function CreateClassModal({
  isOpen,
  newClassData,
  isCreatingClass,
  onClassDataChange,
  onCancel,
  onCreate,
}: CreateClassModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Class</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class Name
            </label>
            <input
              type="text"
              value={newClassData.name}
              onChange={(e) => onClassDataChange({ ...newClassData, name: e.target.value })}
              placeholder="e.g., Introduction to Computer Science"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isCreatingClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class Code
            </label>
            <input
              type="text"
              value={newClassData.code}
              onChange={(e) => onClassDataChange({ ...newClassData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., CS101AB"
              minLength={6}
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 uppercase"
              disabled={isCreatingClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Professor
            </label>
            <input
              type="text"
              value={newClassData.professor}
              onChange={(e) => onClassDataChange({ ...newClassData, professor: e.target.value })}
              placeholder="e.g., Dr. Jane Smith"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isCreatingClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Theme
            </label>
            <div className="flex space-x-2">
              {['blue', 'purple', 'green', 'orange', 'pink', 'yellow'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    hapticSelection()
                    onClassDataChange({ ...newClassData, color })
                  }}
                  disabled={isCreatingClass}
                  className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${
                    courseColorClasses[color]?.bg || courseColorClasses.blue.bg
                  } ${
                    newClassData.color === color ? 'ring-4 ring-offset-2 dark:ring-offset-gray-800 ring-gray-800 dark:ring-gray-200' : ''
                  } ${isCreatingClass ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => {
                hapticButton()
                onCancel()
              }}
              disabled={isCreatingClass}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              disabled={isCreatingClass || !newClassData.name.trim() || !newClassData.code.trim() || newClassData.code.length < 6 || !newClassData.professor.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingClass ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
