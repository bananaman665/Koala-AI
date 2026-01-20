'use client'

import { useMemo, useState } from 'react'
import { FiSearch, FiClock, FiLoader, FiChevronLeft, FiEdit2, FiFileText, FiBook, FiTrash2, FiShare2, FiPlay, FiChevronRight, FiStar } from 'react-icons/fi'
import { hapticSelection } from '@/lib/haptics'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { AudioPlayer } from '@/components/AudioPlayer'
import ReactMarkdown from 'react-markdown'
import { LearnMode } from './LearnMode'
import { FlashcardMode } from './FlashcardMode'
import { hapticButton } from '@/lib/haptics'
import type { Database } from '@/lib/supabase'


type Lecture = Database['public']['Tables']['lectures']['Row'] & {
  courses?: { name: string } | null
}

interface LibraryScreenProps {
  // Data
  lectures: Lecture[]
  selectedLecture: string | null
  selectedLectureData: Lecture | null
  selectedLectureNotes: string | null
  flashcards: Array<{ question: string; answer: string }>
  learnModeQuestions: any[]

  // Loading states
  isLoadingLectures: boolean
  isLoadingLectureNotes: boolean
  isGeneratingFlashcards: boolean
  isGeneratingLearnMode: boolean
  isSavingNotes: boolean

  // Filter/search states
  librarySearchQuery: string
  libraryFilter: 'all' | 'week'

  // Mode states
  isLearnModeActive: boolean
  isFlashcardModeActive: boolean
  isEditingNotes: boolean
  isExitingLecture: boolean

  // Edit states
  editedNotesContent: string
  notesWasEdited: boolean

  // Learn mode states
  currentQuestionIndex: number
  selectedAnswer: string | null
  showExplanation: boolean

  // Handlers
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
  onShowShareModal: (lectureId: string) => void
  isLectureShared: (lectureId: string) => boolean
  onSetIsFlashcardModeActive: (active: boolean) => void
  onSetCurrentFlashcardIndex: (index: number) => void

  // Learn mode handlers
  onAnswerSelect: (answer: string) => void
  onSubmitAnswer: () => void
  onNextQuestion: () => void
  onExitLearnMode: () => void
}

export function LibraryScreen({
  lectures,
  selectedLecture,
  selectedLectureData,
  selectedLectureNotes,
  flashcards,
  learnModeQuestions,
  isLoadingLectures,
  isLoadingLectureNotes,
  isGeneratingFlashcards,
  isGeneratingLearnMode,
  isSavingNotes,
  librarySearchQuery,
  libraryFilter,
  isLearnModeActive,
  isFlashcardModeActive,
  isEditingNotes,
  isExitingLecture,
  editedNotesContent,
  notesWasEdited,
  currentQuestionIndex,
  selectedAnswer,
  showExplanation,
  onLibrarySearchQueryChange,
  onLibraryFilterChange,
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
  onShowShareModal,
  isLectureShared,
  onSetIsFlashcardModeActive,
  onSetCurrentFlashcardIndex,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  onExitLearnMode,
}: LibraryScreenProps) {
  const [favoritedLectures, setFavoritedLectures] = useState<Set<string>>(new Set())

  // Get filtered lectures for both list and detail view
  const getFilteredLectures = useMemo(() => {
    return lectures.filter((lecture) => {
      const query = librarySearchQuery.toLowerCase()
      const matchesSearch = (
        lecture.title.toLowerCase().includes(query) ||
        lecture.courses?.name?.toLowerCase().includes(query)
      )

      if (libraryFilter === 'week') {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const lectureDate = new Date(lecture.created_at)
        return matchesSearch && lectureDate >= oneWeekAgo
      }

      return matchesSearch
    })
  }, [lectures, librarySearchQuery, libraryFilter])

  // Library list view - Two column layout on desktop
  if (!selectedLecture) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-row">
        {/* Mobile: Full width on mobile, Desktop: Left panel (320px) */}
        <div className="lg:w-[320px] lg:h-full lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:overflow-y-auto lg:flex lg:flex-col">
          <div className="px-3 sm:px-6 lg:px-2 py-4 sm:py-8 lg:py-4 pt-32 sm:pt-36 lg:pt-8 pb-32">
            <div className="space-y-4">
              <div className="flex items-center justify-between lg:flex-col lg:items-start lg:gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h2>
                {librarySearchQuery && (
                  <button
                    onClick={() => onLibrarySearchQueryChange('')}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative hidden lg:block">
                <input
                  type="text"
                  placeholder="Search..."
                  value={librarySearchQuery}
                  onChange={(e) => onLibrarySearchQueryChange(e.target.value)}
                  className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                />
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>

              {/* Mobile Search Bar */}
              <div className="relative lg:hidden">
                <input
                  type="text"
                  placeholder="Search lectures..."
                  value={librarySearchQuery}
                  onChange={(e) => onLibrarySearchQueryChange(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => onLibraryFilterChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    libraryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => onLibraryFilterChange('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    libraryFilter === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  This Week
                </button>
              </div>

              {/* Lecture List - Mobile Grid or Desktop Vertical List */}
              <div key={libraryFilter} className="lg:space-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 animate-fade-in">
                {(() => {
                  if (isLoadingLectures) {
                    return (
                      <div className="text-center py-12 col-span-full lg:col-span-1">
                        <FiLoader className="text-gray-400 text-4xl mx-auto animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      </div>
                    )
                  }

                  if (getFilteredLectures.length === 0) {
                    return (
                      <div className="text-center py-12 col-span-full lg:col-span-1">
                        <FiSearch className="text-gray-300 text-5xl mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1 dark:text-white">No lectures found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {librarySearchQuery ? `No results for "${librarySearchQuery}"` : 'Your library is empty'}
                        </p>
                      </div>
                    )
                  }

                  return getFilteredLectures.map((lecture, index) => {
                    const durationMinutes = Math.floor(lecture.duration / 60)
                    const hours = Math.floor(durationMinutes / 60)
                    const mins = durationMinutes % 60
                    const createdDate = new Date(lecture.created_at)
                    const formattedDate = createdDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                    const isFavorited = favoritedLectures.has(lecture.id)

                    return (
                      <SwipeToDelete
                        key={lecture.id}
                        onDelete={() => onDeleteLecture(lecture.id)}
                        itemName={`"${lecture.title}"`}
                        className={`animate-list-item stagger-${Math.min(index + 1, 10)}`}
                      >
                        <div
                          onClick={() => onSelectLecture(lecture.id)}
                          className="bg-white dark:bg-[#1E293B] rounded-2xl lg:rounded-xl border border-gray-100 dark:border-white/[0.06] p-5 lg:p-4 shadow-lg shadow-black/5 dark:shadow-black/25 hover:shadow-2xl hover:shadow-black/15 dark:hover:shadow-black/40 hover:scale-[1.01] hover:border-gray-200 dark:hover:border-white/[0.1] transition-all cursor-pointer group touch-manipulation active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3">
                            {/* Green Play Icon */}
                            <div className="w-11 h-11 lg:w-10 lg:h-10 bg-green-100 dark:bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FiPlay className="text-green-600 dark:text-green-400 text-lg lg:text-base" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                                Lecture
                              </p>
                              <h3 className="text-base lg:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {lecture.title}
                              </h3>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {hours > 0 ? `${hours}h ${mins}m` : `${durationMinutes}m`} • {formattedDate}
                              </p>
                            </div>

                            {/* Star Favorite Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                hapticSelection()
                                setFavoritedLectures((prev) => {
                                  const newSet = new Set(prev)
                                  if (newSet.has(lecture.id)) {
                                    newSet.delete(lecture.id)
                                  } else {
                                    newSet.add(lecture.id)
                                  }
                                  return newSet
                                })
                              }}
                              className="p-1 flex-shrink-0 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all duration-200 ml-1"
                            >
                              <FiStar
                                className={`w-5 h-5 transition-all duration-200 ${
                                  isFavorited
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-white/30 group-hover:text-yellow-400'
                                }`}
                              />
                            </button>

                            {/* Chevron */}
                            <FiChevronRight className="text-gray-300 dark:text-white/30 flex-shrink-0 group-hover:text-gray-400 dark:group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </div>
                      </SwipeToDelete>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Right panel with empty state */}
        <div className="hidden lg:flex flex-1 items-center justify-center pb-8 bg-white dark:bg-gray-800/30">
          <div className="text-center">
            <FiBook className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a lecture</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose from the list to view notes and details</p>
          </div>
        </div>
      </div>
    )
  }

  // Learn Mode view
  if (isLearnModeActive && learnModeQuestions.length > 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className={`max-w-7xl lg:max-w-none mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 pb-32 lg:pb-8 pt-16 sm:pt-20 lg:pt-8`}>
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
        </div>
      </div>
    )
  }

  // Flashcard Mode view
  if (isFlashcardModeActive && flashcards.length > 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className={`max-w-7xl lg:max-w-none mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 pb-32 lg:pb-8 pt-16 sm:pt-20 lg:pt-8`}>
          <FlashcardMode
            flashcards={flashcards}
            onExit={() => {
              onSetIsFlashcardModeActive(false)
              onSetCurrentFlashcardIndex(0)
            }}
          />
        </div>
      </div>
    )
  }

  // Lecture Detail view - Two column layout on desktop
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-row">
      {/* Mobile: Full width on mobile, Desktop: Left panel with lecture list */}
      <div className="flex-1 lg:w-[320px] lg:h-full lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:overflow-y-auto hidden lg:flex lg:flex-col">
        <div className="px-2 py-4 space-y-4 pb-32">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h2>
            </div>

            {/* Desktop Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={librarySearchQuery}
                onChange={(e) => onLibrarySearchQueryChange(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              />
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => onLibraryFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  libraryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onLibraryFilterChange('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  libraryFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                This Week
              </button>
            </div>

            {/* Lecture List */}
            <div className="space-y-2 overflow-y-auto flex-1">
              {getFilteredLectures.map((lecture) => {
                const durationMinutes = Math.floor(lecture.duration / 60)
                const hours = Math.floor(durationMinutes / 60)
                const mins = durationMinutes % 60
                const isCurrentLecture = lecture.id === selectedLecture
                const isFavorited = favoritedLectures.has(lecture.id)

                return (
                  <div
                    key={lecture.id}
                    onClick={() => onSelectLecture(lecture.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                      isCurrentLecture
                        ? 'bg-green-50 dark:bg-green-500/15 border-green-300 dark:border-green-500/30'
                        : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/[0.06] hover:border-green-300 dark:hover:border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Green Play Icon */}
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiPlay className="text-green-600 dark:text-green-400 text-sm" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {lecture.title}
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {hours > 0 ? `${hours}h ${mins}m` : `${durationMinutes}m`}
                        </p>
                      </div>

                      {/* Star Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          hapticSelection()
                          setFavoritedLectures((prev) => {
                            const newSet = new Set(prev)
                            if (newSet.has(lecture.id)) {
                              newSet.delete(lecture.id)
                            } else {
                              newSet.add(lecture.id)
                            }
                            return newSet
                          })
                        }}
                        className="p-1 flex-shrink-0 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-all duration-200"
                      >
                        <FiStar
                          className={`w-4 h-4 transition-all duration-200 ${
                            isFavorited
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-white/30 group-hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Right panel with expanded detail view, Mobile: Full screen */}
      <div className="flex-1 min-h-full lg:overflow-y-auto">
        <div className="px-3 sm:px-6 lg:px-6 py-4 sm:py-8 pb-40 lg:pb-24 pt-32 sm:pt-36 lg:pt-8">
          <div className={`space-y-4 pb-32 lg:pb-20 ${isExitingLecture ? 'animate-zoom-out' : 'animate-zoom-in'}`}>
            {/* Back Button - Mobile only */}
            <button
              onClick={onExitLecture}
              className="lg:hidden flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors shadow-sm"
            >
              <FiChevronLeft className="text-lg" />
              <span>Back to Library</span>
            </button>

            {/* Lecture Header */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedLectureData?.title || 'Lecture'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <FiClock className="mr-1" />
                  {selectedLectureData ? (() => {
                    const minutes = Math.floor(selectedLectureData.duration / 60)
                    const hours = Math.floor(minutes / 60)
                    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
                  })() : '0m'}
                </span>
                <span>
                  {selectedLectureData ? new Date(selectedLectureData.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Audio Player */}
            <div className="bg-gray-100 dark:bg-[#1E293B] rounded-xl p-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                  Recording
                </h4>
                <AudioPlayer
                  audioUrl={selectedLectureData?.audio_url || null}
                  duration={selectedLectureData?.duration || 0}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEditingNotes ? 'Edit Notes' : 'AI Generated Notes'}
                  </h3>
                  {notesWasEdited && !isEditingNotes && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                      Edited
                    </span>
                  )}
                </div>
                {selectedLectureNotes && !isEditingNotes && (
                  <button
                    onClick={() => {
                      hapticButton()
                      onStartEditNotes()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="text-sm" />
                    Edit
                  </button>
                )}
              </div>
              {isLoadingLectureNotes ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="text-gray-400 text-4xl animate-spin" />
                </div>
              ) : isEditingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={editedNotesContent}
                    onChange={(e) => onEditNotesChange(e.target.value)}
                    className="w-full h-80 p-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono text-sm"
                    placeholder="Edit your notes here..."
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        hapticButton()
                        onCancelEditNotes()
                      }}
                      disabled={isSavingNotes}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSaveNotes}
                      disabled={isSavingNotes || editedNotesContent === selectedLectureNotes}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingNotes ? (
                        <>
                          <FiLoader className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              ) : selectedLectureNotes ? (
                <div className="text-white">
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-h1:text-2xl prose-h1:text-center prose-h1:font-bold prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h2:text-xl prose-h2:font-extrabold prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:mb-3 prose-h2:mt-6 prose-h3:text-lg prose-h3:font-bold prose-h3:text-gray-900 dark:prose-h3:text-white prose-h3:mb-2 prose-h3:mt-5 prose-p:text-gray-700 dark:prose-p:text-white prose-p:leading-relaxed prose-p:mb-3 prose-p:ml-6 prose-ul:my-3 prose-ul:ml-12 prose-li:my-1.5 prose-li:text-gray-700 dark:prose-li:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold">
                    <ReactMarkdown>{selectedLectureNotes}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No notes available for this lecture.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (selectedLectureNotes) {
                    onShowLearnModeConfig()
                  } else {
                    alert('No notes available for this lecture')
                  }
                }}
                disabled={isGeneratingLearnMode}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGeneratingLearnMode ? (
                  <FiLoader className="animate-spin text-lg" />
                ) : (
                  <FiFileText className="text-lg" />
                )}
                <span>{isGeneratingLearnMode ? 'Generating...' : 'Learn Mode'}</span>
              </button>
              <button
                onClick={() => {
                  if (flashcards.length > 0) {
                    onSetCurrentFlashcardIndex(0)
                    onSetIsFlashcardModeActive(true)
                  } else {
                    onShowFlashcardConfig()
                  }
                }}
                disabled={isGeneratingFlashcards}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white btn-press px-4 py-4 rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 shadow-lg shadow-purple-200 dark:shadow-purple-900/20"
              >
                {isGeneratingFlashcards ? (
                  <FiLoader className="text-lg animate-spin" />
                ) : (
                  <FiBook className="text-lg" />
                )}
                <span>{isGeneratingFlashcards ? 'Generating...' : 'Flashcards'}</span>
              </button>
            </div>

            {/* Share to Class Button */}
            <button
              onClick={() => {
                hapticButton()
                onShowShareModal(selectedLecture)
              }}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-4 rounded-xl hover:bg-blue-700 font-medium transition-colors"
            >
              <FiShare2 className="text-lg" />
              <span>{isLectureShared(selectedLecture) ? 'Manage Class Sharing' : 'Share to Class'}</span>
            </button>

            {/* Delete Lecture Button */}
            <button
              onClick={() => {
                hapticButton()
                onShowDeleteModal()
              }}
              className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-4 rounded-xl hover:bg-red-600 font-medium transition-colors"
            >
              <FiTrash2 className="text-lg" />
              <span>Delete Lecture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
