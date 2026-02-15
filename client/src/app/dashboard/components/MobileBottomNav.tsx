import { Home, BookOpen, Mic, Loader, BarChart2, Users } from 'lucide-react'
import { hapticSelection, hapticImpact } from '@/lib/haptics'

interface MobileBottomNavProps {
  activeScreen: string
  isRecording: boolean
  isStoppingRecording: boolean
  isGeneratingNotes: boolean
  isTranscribing: boolean
  onNavigate: (screen: string) => void
  onRecordPress: () => void
  onStopRecording: () => void
}

export function MobileBottomNav({
  activeScreen,
  isRecording,
  isStoppingRecording,
  isGeneratingNotes,
  isTranscribing,
  onNavigate,
  onRecordPress,
  onStopRecording,
}: MobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2235] border-t border-gray-200 dark:border-white/[0.08] z-50 pb-8">
      <div className="flex items-end justify-evenly h-16 px-4 pt-2">
        {/* Home */}
        <button
          onClick={() => {
            if (activeScreen !== 'dashboard') {
              hapticSelection()
              onNavigate('dashboard')
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
            activeScreen === 'dashboard' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium dark:opacity-60">Home</span>
        </button>

        {/* Library */}
        <button
          onClick={() => {
            if ((activeScreen as any) !== 'library') {
              hapticSelection()
              onNavigate('library')
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
            activeScreen === 'library' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] font-medium dark:opacity-60">Library</span>
        </button>

        {/* Center Record Button */}
        <div className="relative">
          <button
            onClick={async () => {
              hapticImpact('medium')
              if (!isRecording) {
                onRecordPress()
              } else {
                onStopRecording()
              }
            }}
            disabled={isStoppingRecording || isGeneratingNotes || isTranscribing}
            className={`relative rounded-full shadow-lg flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.95] active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-14 h-14 mb-[-8px] ${
              isRecording
                ? 'bg-red-500 shadow-red-500/25 animate-recording-pulse'
                : 'bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40 hover:shadow-xl'
            }`}
          >
            {isStoppingRecording || isGeneratingNotes || isTranscribing ? (
              <Loader size={24} className="animate-spin text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>
        </div>

        {/* Analytics */}
        <button
          onClick={() => {
            if (activeScreen !== 'analytics') {
              hapticSelection()
              onNavigate('analytics')
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
            activeScreen === 'analytics' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
          }`}
        >
          <BarChart2 size={20} />
          <span className="text-[10px] font-medium dark:opacity-60">Analytics</span>
        </button>

        {/* Classes */}
        <button
          onClick={() => {
            if (activeScreen !== 'feed') {
              hapticSelection()
              onNavigate('feed')
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
            activeScreen === 'feed' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] font-medium dark:opacity-60">Classes</span>
        </button>
      </div>
    </nav>
  )
}
