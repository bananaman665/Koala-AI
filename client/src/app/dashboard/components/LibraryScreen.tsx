'use client'

import { useMemo, useState, useEffect } from 'react'
import { hapticSelection, hapticButton } from '@/lib/haptics'
import { Loader, Star } from 'lucide-react'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { AudioPlayer } from '@/components/AudioPlayer'
import { LearnMode } from './LearnMode'
import { FlashcardMode } from './FlashcardMode'
import { getSubjectIcon, getSubjectColor } from '@/lib/subject-utils'
import type { Database } from '@/lib/supabase'

type Lecture = Database['public']['Tables']['lectures']['Row'] & {
  courses?: { name: string; subject?: string } | null
}

interface LibraryScreenProps {
  lectures: Lecture[]
  selectedLecture: string | null
  selectedLectureData: Lecture | null
  selectedLectureNotes: string | null
  flashcards: Array<{ question: string; answer: string }>
  learnModeQuestions: any[]
  isLoadingLectures: boolean
  isLoadingLectureNotes: boolean
  isGeneratingFlashcards: boolean
  isGeneratingLearnMode: boolean
  isSavingNotes: boolean
  librarySearchQuery: string
  libraryFilter: 'all' | 'week'
  isLearnModeActive: boolean
  isFlashcardModeActive: boolean
  isEditingNotes: boolean
  isExitingLecture: boolean
  editedNotesContent: string
  notesWasEdited: boolean
  currentQuestionIndex: number
  selectedAnswer: string | null
  showExplanation: boolean
  onLibrarySearchQueryChange: (query: string) => void
  onLibraryFilterChange: (filter: 'all' | 'week') => void
  onSelectLecture: (id: string) => void
  onDeleteLecture: (id: string) => void
  onExitLecture: () => void
  onEditNotesChange: (content: string) => void
  onSaveNotes: () => Promise<void>
  onCancelEditNotes: () => void
  onStartEditNotes: () => void
  onShowLearnModeConfig: () => void
  onShowFlashcardConfig: () => void
  onShowDeleteModal: () => void
  onSetIsFlashcardModeActive: (active: boolean) => void
  onSetCurrentFlashcardIndex: (index: number) => void
  onSetIsLearnModeActive: (active: boolean) => void
  onAnswerSelect: (answer: string) => void
  onSubmitAnswer: () => void
  onNextQuestion: () => void
  onExitLearnMode: () => void
  onShowViewNotesModal: () => void
}

export function LibraryScreen({
  lectures,
  selectedLecture,
  selectedLectureData,
  selectedLectureNotes,
  flashcards,
  learnModeQuestions,
  isLoadingLectures,
  isSavingNotes,
  librarySearchQuery,
  isLearnModeActive,
  isFlashcardModeActive,
  isEditingNotes,
  isExitingLecture,
  editedNotesContent,
  currentQuestionIndex,
  selectedAnswer,
  showExplanation,
  onLibrarySearchQueryChange,
  onSelectLecture,
  onDeleteLecture,
  onExitLecture,
  onEditNotesChange,
  onSaveNotes,
  onCancelEditNotes,
  onStartEditNotes,
  onShowLearnModeConfig,
  onShowFlashcardConfig,
  onShowDeleteModal,
  onSetIsFlashcardModeActive,
  onSetCurrentFlashcardIndex,
  onSetIsLearnModeActive,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  onExitLearnMode,
  onShowViewNotesModal,
}: LibraryScreenProps) {
  const [favoritedLectures, setFavoritedLectures] = useState<Set<string>>(new Set())
  const [hasGeneratedQuiz, setHasGeneratedQuiz] = useState(false)
  const [hasGeneratedFlashcards, setHasGeneratedFlashcards] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'favorites' | 'recent'>('all')

  useEffect(() => {
    setHasGeneratedQuiz(learnModeQuestions.length > 0)
    setHasGeneratedFlashcards(flashcards.length > 0)
  }, [selectedLecture, learnModeQuestions.length, flashcards.length])

  // Group lectures by course
  const groupedLectures = useMemo(() => {
    const groups: Record<string, { courseName: string; subject?: string; lectures: Lecture[] }> = {}

    lectures.forEach((lecture) => {
      const courseId = lecture.course_id || 'uncategorized'
      const courseName = lecture.courses?.name || 'Uncategorized'
      const subject = lecture.courses?.subject

      if (!groups[courseId]) {
        groups[courseId] = { courseName, subject, lectures: [] }
      }
      groups[courseId].lectures.push(lecture)
    })

    return groups
  }, [lectures])

  // Get filtered lectures
  const getFilteredLectures = useMemo(() => {
    let filtered = lectures.filter((lecture) => {
      const query = librarySearchQuery.toLowerCase()
      return (
        lecture.title.toLowerCase().includes(query) ||
        lecture.courses?.name?.toLowerCase().includes(query)
      )
    })

    if (statusFilter === 'favorites') {
      filtered = filtered.filter(l => favoritedLectures.has(l.id))
    } else if (statusFilter === 'recent') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filtered = filtered.filter(l => new Date(l.created_at) >= oneWeekAgo)
    }

    return filtered
  }, [lectures, librarySearchQuery, statusFilter, favoritedLectures])

  // Recent lectures (last 3 played)
  const recentLectures = useMemo(() => {
    return [...lectures]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  }, [lectures])

  const toggleFavorite = (lectureId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    hapticSelection()
    setFavoritedLectures((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(lectureId)) {
        newSet.delete(lectureId)
      } else {
        newSet.add(lectureId)
      }
      return newSet
    })
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${minutes}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Learn Mode view
  if (isLearnModeActive && learnModeQuestions.length > 0) {
    return (
      <LearnMode
        questions={learnModeQuestions}
        currentIndex={currentQuestionIndex}
        onAnswerSelect={onAnswerSelect}
        onSubmitAnswer={onSubmitAnswer}
        onNextQuestion={onNextQuestion}
        onExit={onExitLearnMode}
        selectedAnswer={selectedAnswer}
        showExplanation={showExplanation}
      />
    )
  }

  // Flashcard Mode view
  if (isFlashcardModeActive && flashcards.length > 0) {
    return (
      <FlashcardMode
        flashcards={flashcards}
        onExit={() => {
          onSetIsFlashcardModeActive(false)
          onSetCurrentFlashcardIndex(0)
        }}
      />
    )
  }

  // Lecture Detail View
  if (selectedLecture && selectedLectureData) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className={`px-4 sm:px-6 py-6 pt-36 sm:pt-40 lg:pt-6 pb-32 lg:pb-8 ${isExitingLecture ? 'animate-zoom-out' : 'animate-zoom-in'}`}>
          {/* Inline Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onExitLecture}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 active:scale-95 transition-all font-medium flex-shrink-0"
            >
              <ChevronLeft size={18} />
              <span>Back</span>
            </button>
          </div>

          {/* Audio Player Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/[0.06] mb-6">
            <AudioPlayer
              audioUrl={selectedLectureData.audio_url || null}
              duration={selectedLectureData.duration || 0}
            />
          </div>

          {/* Study Tools */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Study Tools</h2>
          <div className="space-y-3 mb-6">
            {/* Notes Row */}
            <button
              onClick={() => {
                hapticButton()
                if (selectedLectureNotes) {
                  onShowViewNotesModal?.()
                } else {
                  onStartEditNotes()
                }
              }}
              className="w-full bg-white dark:bg-[#1E293B] rounded-2xl p-4 text-left hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-[0.98] transition-all border border-gray-100 dark:border-white/[0.06] group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Notebook size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedLectureNotes ? 'View Notes' : 'Add Notes'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedLectureNotes ? 'Read your study notes' : 'Write your own notes'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            </button>

            {/* Quiz Row */}
            <button
              onClick={() => {
                hapticButton()
                if (hasGeneratedQuiz) {
                  onSetIsLearnModeActive(true)
                } else if (selectedLectureNotes) {
                  onShowLearnModeConfig()
                }
              }}
              disabled={!selectedLectureNotes && !hasGeneratedQuiz}
              className="w-full bg-white dark:bg-[#1E293B] rounded-2xl p-4 text-left hover:border-purple-300 dark:hover:border-purple-500/50 active:scale-[0.98] transition-all border border-gray-100 dark:border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Brain size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {hasGeneratedQuiz ? `Quiz (${learnModeQuestions.length})` : 'Create Quiz'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hasGeneratedQuiz ? 'Test your knowledge' : 'Generate from notes'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            </button>

            {/* Flashcards Row */}
            <button
              onClick={() => {
                hapticButton()
                if (hasGeneratedFlashcards) {
                  onSetCurrentFlashcardIndex(0)
                  onSetIsFlashcardModeActive(true)
                } else if (selectedLectureNotes) {
                  onShowFlashcardConfig()
                }
              }}
              disabled={!selectedLectureNotes && !hasGeneratedFlashcards}
              className="w-full bg-white dark:bg-[#1E293B] rounded-2xl p-4 text-left hover:border-emerald-300 dark:hover:border-emerald-500/50 active:scale-[0.98] transition-all border border-gray-100 dark:border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Cards size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {hasGeneratedFlashcards ? `Cards (${flashcards.length})` : 'Create Cards'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hasGeneratedFlashcards ? 'Spaced repetition' : 'Generate from notes'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Edit Notes Section (shown when editing) */}
          {isEditingNotes && (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/[0.06]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Edit Notes
              </h3>
              <textarea
                value={editedNotesContent}
                onChange={(e) => onEditNotesChange(e.target.value)}
                className="w-full h-64 p-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm mb-4"
                placeholder="Write your notes here..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    hapticButton()
                    onCancelEditNotes()
                  }}
                  disabled={isSavingNotes}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveNotes}
                  disabled={isSavingNotes || editedNotesContent === selectedLectureNotes}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Danger Zone</h3>
            <button
              onClick={() => {
                hapticButton()
                onShowDeleteModal()
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 active:scale-[0.98] transition-all"
            >
              <Trash size={18} />
              Delete Lecture
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Library List View
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 py-6 pt-36 sm:pt-40 lg:pt-6 pb-32 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {lectures.length} lectures
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search lectures..."
            value={librarySearchQuery}
            onChange={(e) => onLibrarySearchQueryChange(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.06] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          {librarySearchQuery && (
            <button
              onClick={() => onLibrarySearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs - Spotify/Audible inspired */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All', icon: Headphones },
            { id: 'favorites', label: 'Favorites', icon: Star },
            { id: 'recent', label: 'This Week', icon: Clock },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                hapticSelection()
                setStatusFilter(filter.id as 'all' | 'favorites' | 'recent')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.06]'
              }`}
            >
              <filter.icon size={16} weight={statusFilter === filter.id ? 'fill' : 'regular'} />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoadingLectures && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="text-blue-500 animate-spin mb-4" size={40} />
            <p className="text-gray-500 dark:text-gray-400">Loading your library...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingLectures && getFilteredLectures.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {statusFilter === 'favorites' ? (
              <>
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Star size={32} className="text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Star your favorite lectures for quick access
                </p>
              </>
            ) : librarySearchQuery ? (
              <>
                <div className="w-16 h-16 bg-white dark:bg-[#1E293B] rounded-2xl flex items-center justify-center mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  No lectures match "{librarySearchQuery}"
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Books size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your library is empty</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Record your first lecture to start building your library
                </p>
              </>
            )}
          </div>
        )}

        {/* Content - Grouped by Course (Notion/Apple Podcasts inspired) */}
        {!isLoadingLectures && getFilteredLectures.length > 0 && (
          <div className="space-y-6">
            {/* Recent Lectures Section - YouTube/Spotify inspired */}
            {statusFilter === 'all' && recentLectures.length > 0 && !librarySearchQuery && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Play size={20} className="text-blue-500" />
                    Continue Listening
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentLectures.map((lecture) => {
                    const SubjectIcon = getSubjectIcon((lecture.courses as any)?.subject)
                    const colors = getSubjectColor((lecture.courses as any)?.subject)
                    const isFavorited = favoritedLectures.has(lecture.id)

                    return (
                      <div
                        key={lecture.id}
                        onClick={() => onSelectLecture(lecture.id)}
                        className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <SubjectIcon className={`${colors.text} text-xl`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                              {lecture.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {lecture.courses?.name || 'Uncategorized'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(lecture.id, e)}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors"
                          >
                            <Star
                              size={18}
                              weight={isFavorited ? 'fill' : 'regular'}
                              className={isFavorited ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-400'}
                            />
                          </button>
                        </div>
                        {/* Progress bar placeholder */}
                        <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Grouped Lectures by Course */}
            {Object.entries(groupedLectures)
              .filter(([_, group]) => {
                // Filter groups based on search/filters
                return group.lectures.some(l => getFilteredLectures.includes(l))
              })
              .map(([courseId, group]) => {
                const filteredGroupLectures = group.lectures.filter(l => getFilteredLectures.includes(l))
                if (filteredGroupLectures.length === 0) return null

                const SubjectIcon = getSubjectIcon(group.subject)
                const colors = getSubjectColor(group.subject)

                return (
                  <section key={courseId}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                        <SubjectIcon className={`${colors.text} text-sm`} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {group.courseName}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredGroupLectures.length} lectures
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredGroupLectures.map((lecture) => {
                        const isFavorited = favoritedLectures.has(lecture.id)
                        const SubjectIcon = getSubjectIcon((lecture.courses as any)?.subject)
                        const colors = getSubjectColor((lecture.courses as any)?.subject)

                        return (
                          <SwipeToDelete
                            key={lecture.id}
                            onDelete={() => onDeleteLecture(lecture.id)}
                            itemName={`"${lecture.title}"`}
                          >
                            <div
                              onClick={() => onSelectLecture(lecture.id)}
                              className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer transition-all active:scale-[0.98] group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                  <SubjectIcon className={`${colors.text} text-lg`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {lecture.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDuration(lecture.duration)} • {formatDate(lecture.created_at)}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => toggleFavorite(lecture.id, e)}
                                  className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors"
                                >
                                  <Star
                                    size={20}
                                    weight={isFavorited ? 'fill' : 'regular'}
                                    className={isFavorited ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-400'}
                                  />
                                </button>
                                <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
                              </div>
                            </div>
                          </SwipeToDelete>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
          </div>
        )}

        {/* Continue/Start Study Tools Section */}
        {selectedLecture && selectedLectureData && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {/* Flashcards */}
            <button
              onClick={() => {
                hapticButton()
                if (hasGeneratedFlashcards) {
                  onSetCurrentFlashcardIndex(0)
                  onSetIsFlashcardModeActive(true)
                } else if (selectedLectureNotes) {
                  onShowFlashcardConfig()
                }
              }}
              disabled={!selectedLectureNotes && !hasGeneratedFlashcards}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-4 text-center font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-2xl mb-1">🎴</div>
              {hasGeneratedFlashcards ? 'Continue Flashcards?' : 'Start Flashcards?'}
            </button>

            {/* Quiz */}
            <button
              onClick={() => {
                hapticButton()
                if (hasGeneratedQuiz) {
                  onSetIsLearnModeActive(true)
                } else if (selectedLectureNotes) {
                  onShowLearnModeConfig()
                }
              }}
              disabled={!selectedLectureNotes && !hasGeneratedQuiz}
              className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-4 text-center font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-2xl mb-1">🧠</div>
              {hasGeneratedQuiz ? 'Continue Quiz?' : 'Start Quiz?'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
