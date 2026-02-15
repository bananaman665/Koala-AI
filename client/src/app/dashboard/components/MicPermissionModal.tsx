import { Mic } from 'lucide-react'
import { hapticButton } from '@/lib/haptics'

interface MicPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onReset: () => void
}

export function MicPermissionModal({ isOpen, onClose, onReset }: MicPermissionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Mic size={32} className="text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Microphone Access Required</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            To record lectures, please enable microphone access in your device settings.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-left">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">How to enable:</p>
            <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open Settings on your device</li>
              <li>Find Koala.ai in your apps</li>
              <li>Enable Microphone permission</li>
              <li>Return and try recording again</li>
            </ol>
          </div>
        </div>

        <button
          onClick={() => {
            hapticButton()
            onClose()
            onReset()
          }}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
