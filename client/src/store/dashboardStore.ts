import { create } from 'zustand'
import type { Database } from '@/lib/supabase'

type Lecture = Database['public']['Tables']['lectures']['Row']
type Course = Database['public']['Tables']['courses']['Row']

export type ActiveScreen = 'dashboard' | 'library' | 'analytics' | 'feed'

interface ModalStates {
  courseSelection: boolean
  newCourse: boolean
  deleteConfirm: boolean
  readyToRecord: boolean
  micPermission: boolean
  streak: boolean
  deleteContent: 'lecture' | 'course' | null
  learnModeConfig: boolean
  flashcardConfig: boolean
}

interface RecordingState {
  isActive: boolean
  isPaused: boolean
  duration: number
  selectedCourseId: string | null
  lectureTitle: string
  isSaving: boolean
  isStopping: boolean
}

interface LibraryState {
  searchQuery: string
  filter: 'all' | 'week'
  selectedLectureId: string | null
  isEditingNotes: boolean
  editedNotesContent: string
  notesWasEdited: boolean
}

interface StudyModeState {
  mode: 'notes' | 'flashcards' | 'learn'
  isFlashcardModeActive: boolean
  isLearnModeActive: boolean
  currentFlashcardIndex: number
  currentQuestionIndex: number
  selectedAnswer: string | null
  showExplanation: boolean
  writtenAnswer: string
}

interface DashboardStore {
  // Active screen
  activeScreen: ActiveScreen
  setActiveScreen: (screen: ActiveScreen) => void

  // Modals
  modals: ModalStates
  openModal: (modal: keyof ModalStates, content?: 'lecture' | 'course') => void
  closeModal: (modal: keyof ModalStates) => void
  closeAllModals: () => void

  // Recording state
  recording: RecordingState
  updateRecording: (state: Partial<RecordingState>) => void
  resetRecording: () => void

  // Library state
  library: LibraryState
  updateLibrary: (state: Partial<LibraryState>) => void
  resetLibrary: () => void

  // Study mode state
  studyMode: StudyModeState
  updateStudyMode: (state: Partial<StudyModeState>) => void
  resetStudyMode: () => void

  // Selected course in dashboard
  selectedCourseId: string | null
  setSelectedCourseId: (id: string | null) => void
}

const initialModalStates: ModalStates = {
  courseSelection: false,
  newCourse: false,
  deleteConfirm: false,
  readyToRecord: false,
  micPermission: false,
  streak: false,
  deleteContent: null,
  learnModeConfig: false,
  flashcardConfig: false,
}

const initialRecordingState: RecordingState = {
  isActive: false,
  isPaused: false,
  duration: 0,
  selectedCourseId: null,
  lectureTitle: '',
  isSaving: false,
  isStopping: false,
}

const initialLibraryState: LibraryState = {
  searchQuery: '',
  filter: 'all',
  selectedLectureId: null,
  isEditingNotes: false,
  editedNotesContent: '',
  notesWasEdited: false,
}

const initialStudyModeState: StudyModeState = {
  mode: 'notes',
  isFlashcardModeActive: false,
  isLearnModeActive: false,
  currentFlashcardIndex: 0,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  showExplanation: false,
  writtenAnswer: '',
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Active screen
  activeScreen: 'dashboard',
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  // Modals
  modals: initialModalStates,
  openModal: (modal, content) => set((state) => ({
    modals: {
      ...state.modals,
      [modal]: true,
      ...(modal === 'deleteConfirm' && content ? { deleteContent: content } : {}),
    },
  })),
  closeModal: (modal) => set((state) => ({
    modals: {
      ...state.modals,
      [modal]: false,
      ...(modal === 'deleteConfirm' ? { deleteContent: null } : {}),
    },
  })),
  closeAllModals: () => set({ modals: initialModalStates }),

  // Recording state
  recording: initialRecordingState,
  updateRecording: (newState) => set((state) => ({
    recording: { ...state.recording, ...newState },
  })),
  resetRecording: () => set({ recording: initialRecordingState }),

  // Library state
  library: initialLibraryState,
  updateLibrary: (newState) => set((state) => ({
    library: { ...state.library, ...newState },
  })),
  resetLibrary: () => set({ library: initialLibraryState }),

  // Study mode state
  studyMode: initialStudyModeState,
  updateStudyMode: (newState) => set((state) => ({
    studyMode: { ...state.studyMode, ...newState },
  })),
  resetStudyMode: () => set({ studyMode: initialStudyModeState }),

  // Selected course
  selectedCourseId: null,
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
}))