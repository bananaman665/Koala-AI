'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiMic, FiPause, FiSquare, FiClock, FiFileText, FiFolder, FiSearch, FiPlus, FiSettings, FiPlay, FiLoader, FiAlertCircle, FiHome, FiBook, FiBarChart2, FiCheckCircle, FiTrendingUp, FiUsers, FiX, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import { Lightbulb, Mic, Lock } from 'lucide-react'
import { Fire } from '@phosphor-icons/react'
import { useLectureRecordingV2 } from '@/hooks/useLectureRecordingV2'
import { formatDuration } from '@/hooks/useHybridRecording'
import { useScreenTransition } from '@/hooks/useScreenTransition'
import { ScreenTransition } from '@/components/ScreenTransition'
import { AudioPlayer } from '@/components/AudioPlayer'
import { StreakDisplay, useStreak } from '@/components/StreakDisplay'
import { OnboardingCarousel } from '@/components/OnboardingCarousel'
import { useAuth } from '@/contexts/AuthContext'
import { hapticButton, hapticSuccess, hapticError, hapticSelection, hapticImpact } from '@/lib/haptics'
import { supabase, uploadAudioFile } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { SkeletonLectureCard, SkeletonCourseCard, SkeletonStats } from '@/components/Skeleton'
import { AnimatedCounter, AnimatedTimeCounter } from '@/components/AnimatedCounter'
import { SwipeToDelete } from '@/components/SwipeToDelete'

// Color classes for course icons (full class names for Tailwind to detect)
const courseColorClasses: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
}

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']
type LectureWithCourse = Lecture & {
  courses?: {
    name: string
    code: string
    color: string
  } | null
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const toast = useToast()
  const { streak, recordActivity, isActiveToday } = useStreak()
  const [isMounted, setIsMounted] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const {
    isRecording,
    isPaused,
    duration,
    transcript,
    interimTranscript,
    isTranscribing,
    isGeneratingNotes,
    notes,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopAndGenerateNotes,
    generateNotes,
    reset,
    clearAudioBlob,
    recordingError,
    notesError,
    isSupported,
    isMobile: isRecordingMobile,
  } = useLectureRecordingV2()

  // Ref to store captured audio blob for saving
  const capturedAudioBlobRef = useRef<Blob | null>(null)

  const [showTranscript, setShowTranscript] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [studyViewMode, setStudyViewMode] = useState<'notes' | 'flashcards' | 'learn'>('notes')
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([])
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [isFlashcardModeActive, setIsFlashcardModeActive] = useState(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  // Learn Mode State
  const [learnModeQuestions, setLearnModeQuestions] = useState<Array<{
    question: string;
    type: 'multiple_choice' | 'true_false';
    correctAnswer: string;
    options: string[];
    explanation: string;
  }>>([])
  const [isGeneratingLearnMode, setIsGeneratingLearnMode] = useState(false)
  const [learnModeError, setLearnModeError] = useState<string | null>(null)
  const [isLearnModeActive, setIsLearnModeActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set())
  const [incorrectQuestions, setIncorrectQuestions] = useState<number[]>([])
  const [round, setRound] = useState(1)

  // Mobile bottom nav state
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'library' | 'analytics' | 'feed'>('dashboard')
  const { animationType, animationKey, isTransitioning, previousScreen } = useScreenTransition(activeScreen as any)

  // Course selection modal state for floating record button
  const [showCourseSelectionModal, setShowCourseSelectionModal] = useState(false)
  const [selectedCourseForRecording, setSelectedCourseForRecording] = useState<string | null>(null)
  const [lectureTitle, setLectureTitle] = useState('')
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  const [showReadyToRecordModal, setShowReadyToRecordModal] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showDeleteLectureModal, setShowDeleteLectureModal] = useState(false)
  const [isDeletingLecture, setIsDeletingLecture] = useState(false)
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false)

  // Library search state
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'week'>('all')

  // Analytics filter state
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<'week' | 'month' | 'all'>('week')

  // Course management state
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showNewCourseModal, setShowNewCourseModal] = useState(false)
  const [isExitingCourse, setIsExitingCourse] = useState(false)

  // Classes state
  const [userClasses, setUserClasses] = useState<any[]>([])
  const [joinClassCode, setJoinClassCode] = useState('')
  const [isJoiningClass, setIsJoiningClass] = useState(false)
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [newCourseData, setNewCourseData] = useState({
    name: '',
    code: '',
    professor: '',
    color: 'blue',
    category: 'Computer Science'
  })
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)

  // Lecture detail state (for library view)
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null)
  const [selectedLectureData, setSelectedLectureData] = useState<LectureWithCourse | null>(null)
  const [selectedLectureNotes, setSelectedLectureNotes] = useState<string | null>(null)
  const [isLoadingLectureNotes, setIsLoadingLectureNotes] = useState(false)
  const [isExitingLecture, setIsExitingLecture] = useState(false)

  // Settings state
  const [autoGenerateNotes, setAutoGenerateNotes] = useState(true)
  const [autoSaveTranscripts, setAutoSaveTranscripts] = useState(true)
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [notesDetailLevel, setNotesDetailLevel] = useState<'brief' | 'detailed' | 'comprehensive'>('detailed')
  const [showAudioQualityModal, setShowAudioQualityModal] = useState(false)
  const [showNotesDetailModal, setShowNotesDetailModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  // Real data from Supabase
  const [courses, setCourses] = useState<Course[]>([])
  const [lectures, setLectures] = useState<LectureWithCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingLectures, setIsLoadingLectures] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug: Log audioBlob changes from hook
  useEffect(() => {
    console.log('[Dashboard] audioBlob from hook changed:', audioBlob ? `${audioBlob.size} bytes, type: ${audioBlob.type}` : 'null')
  }, [audioBlob])

  // Watch for microphone permission errors
  useEffect(() => {
    if (recordingError && recordingError.toLowerCase().includes('permission')) {
      setShowMicPermissionModal(true)
    }
  }, [recordingError])

  // Check if user has completed onboarding
  useEffect(() => {
    if (user && !isCheckingAuth) {
      const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true'
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [user, isCheckingAuth])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setShowOnboarding(false)
  }

  // Handle screen query parameter for redirects
  useEffect(() => {
    const screen = searchParams.get('screen')
    if (screen && ['dashboard', 'library', 'analytics', 'feed'].includes(screen)) {
      setActiveScreen(prev => prev !== screen ? screen as 'dashboard' | 'library' | 'analytics' | 'feed' : prev)
    }
  }, [searchParams])

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    // Give the auth context time to initialize
    const timer = setTimeout(() => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setIsCheckingAuth(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, router])

  // Fetch courses
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingCourses(false)
      setCourses([])
      return
    }

    async function fetchCourses() {
      setIsLoadingCourses(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
      } else {
        setCourses(data || [])
      }
      setIsLoadingCourses(false)
    }

    fetchCourses()
  }, [user])

  // Fetch lectures
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingLectures(false)
      setLectures([])
      return
    }

    async function fetchLectures() {
      setIsLoadingLectures(true)
      const { data, error } = await supabase
        .from('lectures')
        .select('*, courses(name, code, color)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
      } else {
        setLectures(data || [])
      }
      setIsLoadingLectures(false)
    }

    fetchLectures()
  }, [user])

  // Delete lecture function
  const deleteLecture = async (lectureId: string) => {
    if (!user?.id) return

    setIsDeletingLecture(true)
    try {
      // First delete associated notes
      await supabase
        .from('notes')
        .delete()
        .eq('lecture_id', lectureId)

      // Then delete the lecture
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lectureId)
        .eq('user_id', user.id)

      if (error) {
        hapticError()
        toast.error('Failed to delete lecture')
      } else {
        hapticSuccess()
        toast.success('Lecture deleted')
        // Remove from local state
        setLectures(prev => prev.filter(l => l.id !== lectureId))
        // Close the lecture detail view
        setSelectedLecture(null)
        setSelectedLectureData(null)
        setSelectedLectureNotes(null)
      }
    } catch (error) {
      hapticError()
      toast.error('Failed to delete lecture')
    } finally {
      setIsDeletingLecture(false)
      setShowDeleteLectureModal(false)
    }
  }

  // Fetch user classes
  useEffect(() => {
    if (!user?.id) {
      setUserClasses([])
      return
    }

    async function fetchUserClasses() {
      setIsLoadingClasses(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/classes`, {
          headers: {
            'x-user-id': user!.id,
          },
        })
        const result = await response.json()
        if (result.success) {
          setUserClasses(result.data || [])
        }
      } catch (error) {
      }
      setIsLoadingClasses(false)
    }

    fetchUserClasses()
  }, [user])

  // Fetch selected lecture data and notes
  useEffect(() => {
    if (!selectedLecture || !lectures.length) {
      setSelectedLectureData(null)
      setSelectedLectureNotes(null)
      return
    }

    async function fetchLectureData() {
      setIsLoadingLectureNotes(true)
      try {
        // Find the lecture in the current list
        const lecture = lectures.find(l => l.id === selectedLecture)
        if (lecture) {
          setSelectedLectureData(lecture)

          // Fetch notes from the notes table
          const { data: notesData, error: notesError } = await (supabase as any)
            .from('notes')
            .select('content')
            .eq('lecture_id', selectedLecture)
            .single()

          if (notesError) {
            setSelectedLectureNotes(null)
          } else {
            setSelectedLectureNotes(notesData?.content || null)
          }
        }
      } catch (error) {
        setSelectedLectureData(null)
        setSelectedLectureNotes(null)
      } finally {
        setIsLoadingLectureNotes(false)
      }
    }

    fetchLectureData()
  }, [selectedLecture, lectures])

  const handleCreateCourse = async () => {
    // Validation
    if (!newCourseData.name.trim()) {
      alert('Please enter a course name')
      return
    }
    if (!newCourseData.code.trim()) {
      alert('Please enter a course code')
      return
    }
    if (!newCourseData.professor.trim()) {
      alert('Please enter a professor name')
      return
    }
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

    setIsCreatingCourse(true)

    try {
      // @ts-ignore - Supabase typing issue with Database generic
      const { data, error } = await (supabase as any)
        .from('courses')
        .insert([{
          user_id: user.id,
          name: newCourseData.name.trim(),
          code: newCourseData.code.trim(),
          professor: newCourseData.professor.trim(),
          category: newCourseData.category,
          color: newCourseData.color,
          lectures: 0,
          total_hours: 0,
          last_updated: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Add the new course to the list
      if (data) {
        setCourses(prev => [data, ...prev])
      }

      // Reset form and close modal
      setNewCourseData({
        name: '',
        code: '',
        professor: '',
        color: 'blue',
        category: 'Computer Science'
      })
      setShowNewCourseModal(false)
    } catch (error: any) {
      alert(`Failed to create course: ${error.message}`)
    } finally {
      setIsCreatingCourse(false)
    }
  }

  // Create a new class
  const handleCreateClass = async () => {
    if (!newCourseData.name.trim()) {
      alert('Please enter a class name')
      return
    }
    if (!newCourseData.code.trim()) {
      alert('Please enter a class code')
      return
    }
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

    setIsCreatingCourse(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: newCourseData.name.trim(),
          code: newCourseData.code.trim(),
          professor: newCourseData.professor.trim(),
          description: '',
          color: newCourseData.color,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setUserClasses(prev => [result.data, ...prev])
        setNewCourseData({
          name: '',
          code: '',
          professor: '',
          color: 'blue',
          category: 'Computer Science'
        })
        setShowNewCourseModal(false)
      } else {
        alert(`Failed to create class: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Failed to create class: ${error.message}`)
    } finally {
      setIsCreatingCourse(false)
    }
  }

  // Join an existing class by code
  const handleJoinClass = async () => {
    if (!joinClassCode.trim()) {
      alert('Please enter a class code')
      return
    }
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

    setIsJoiningClass(true)
    try {
      // First, find the class by code
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/classes/search?code=${encodeURIComponent(joinClassCode.trim())}`, {
        headers: {
          'x-user-id': user.id,
        },
      })

      // If search endpoint doesn't exist, try to join directly using the code as class ID
      // For now, we'll show an error since we need the class ID to join
      const searchResult = await searchResponse.json()

      if (!searchResult.success || !searchResult.data) {
        alert('Class not found. Please check the code and try again.')
        setIsJoiningClass(false)
        return
      }

      const classId = searchResult.data.id

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/classes/${classId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      })

      const result = await response.json()
      if (result.success) {
        // Refresh the classes list
        const classesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/classes`, {
          headers: {
            'x-user-id': user.id,
          },
        })
        const classesResult = await classesResponse.json()
        if (classesResult.success) {
          setUserClasses(classesResult.data || [])
        }
        setJoinClassCode('')
        alert('Successfully joined the class!')
      } else if (result.error?.code === 'ALREADY_MEMBER') {
        alert('You are already a member of this class')
      } else {
        alert(`Failed to join class: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Failed to join class: ${error.message}`)
    } finally {
      setIsJoiningClass(false)
    }
  }

  const saveNotesToLibrary = async () => {
    if (!notes || !user) {
      alert('Please generate notes first')
      return
    }

    if (!selectedCourse) {
      alert('Please select a course to save the lecture to')
      return
    }

    try {
      // Create a lecture record
      // @ts-ignore - Supabase typing issue with Database generic
      const { data: lecture, error: lectureError } = await (supabase as any)
        .from('lectures')
        .insert({
          user_id: user.id,
          course_id: selectedCourse,
          title: lectureTitle.trim() || `Lecture ${new Date().toLocaleDateString()}`,
          duration: duration,
          transcription_status: 'completed',
          audio_url: '',
        })
        .select()
        .single()

      if (lectureError) {
        throw lectureError
      }

      // Upload audio if available (use ref which has the captured blob)
      const audioBlobToUpload = capturedAudioBlobRef.current
      console.log('[SaveLecture] audioBlob from ref:', audioBlobToUpload ? `Blob size: ${audioBlobToUpload.size}, type: ${audioBlobToUpload.type}` : 'null')
      if (audioBlobToUpload) {
        try {
          console.log('[SaveLecture] Uploading audio to storage...')
          const audioUrl = await uploadAudioFile(user.id, lecture.id, audioBlobToUpload)
          console.log('[SaveLecture] Audio uploaded, URL:', audioUrl)
          // Update lecture with audio URL
          // @ts-ignore - Supabase typing issue with Database generic
          const { error: updateError } = await (supabase as any)
            .from('lectures')
            .update({ audio_url: audioUrl })
            .eq('id', lecture.id)
          if (updateError) {
            console.error('[SaveLecture] Failed to update lecture with audio URL:', updateError)
          } else {
            console.log('[SaveLecture] Lecture updated with audio URL successfully')
          }
        } catch (audioError) {
          console.error('[SaveLecture] Failed to upload audio:', audioError)
          // Continue saving even if audio upload fails
        }
      } else {
        console.log('[SaveLecture] No audioBlob available to upload')
      }

      // Save transcript if available
      if (transcript) {
        // @ts-ignore - Supabase typing issue with Database generic
        const { error: transcriptError } = await (supabase as any)
          .from('transcripts')
          .insert({
            lecture_id: lecture.id,
            user_id: user.id,
            content: transcript,
          })

        if (transcriptError) {
        }
      }

      // Save notes
      // @ts-ignore - Supabase typing issue with Database generic
      const { error: notesError } = await (supabase as any)
        .from('notes')
        .insert({
          lecture_id: lecture.id,
          user_id: user.id,
          content: notes,
        })

      if (notesError) {
        throw notesError
      }

      // Refresh lectures list by refetching
      const { data: updatedLectures } = await supabase
        .from('lectures')
        .select('*, courses(name, code, color)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (updatedLectures) {
        setLectures(updatedLectures)
      }

      // Record study activity for streak
      recordActivity()

      // Haptic feedback for success
      hapticSuccess()

      // Clear the current recording and audio blob
      setLectureTitle('')
      capturedAudioBlobRef.current = null
      reset()
    } catch (error: any) {
      alert(`Failed to save lecture: ${error.message}`)
    }
  }

  const generateFlashcards = async () => {
    if (!notes) {
      setFlashcardsError('No notes available to generate flashcards from')
      return
    }

    try {
      setIsGeneratingFlashcards(true)
      setFlashcardsError(null)

      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: notes, numberOfCards: 10 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      setFlashcards(data.flashcards)
    } catch (err: any) {
      setFlashcardsError(err.message || 'Failed to generate flashcards')
    } finally {
      setIsGeneratingFlashcards(false)
    }
  }

  const toggleCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const generateLearnMode = async (contentToUse?: string) => {
    const notesContent = contentToUse || selectedLectureNotes || notes

    if (!notesContent) {
      setLearnModeError('No notes available to generate learn mode from')
      return
    }

    try {
      setIsGeneratingLearnMode(true)
      setLearnModeError(null)

      const response = await fetch('/api/ai/generate-learn-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: notesContent, numberOfQuestions: 10 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate learn mode questions')
      }

      setLearnModeQuestions(data.questions)
      setIsLearnModeActive(true)
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnsweredQuestions(new Set())
      setCorrectAnswers(new Set())
      setIncorrectQuestions([])
      setRound(1)
    } catch (err: any) {
      setLearnModeError(err.message || 'Failed to generate learn mode questions')
    } finally {
      setIsGeneratingLearnMode(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return // Prevent changing answer after submission
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || showExplanation) return

    const currentQuestion = learnModeQuestions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))

    if (isCorrect) {
      setCorrectAnswers(prev => new Set(prev).add(currentQuestionIndex))
    } else {
      setIncorrectQuestions(prev => [...prev, currentQuestionIndex])
    }

    setShowExplanation(true)
  }

  const handleNextQuestion = () => {
    setShowExplanation(false)
    setSelectedAnswer(null)

    // Check if we've answered all questions in current round
    if (currentQuestionIndex < learnModeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Round complete - check if we need another round
      if (incorrectQuestions.length > 0) {
        // Start new round with incorrect questions
        const incorrectQuestionsData = incorrectQuestions.map(idx => learnModeQuestions[idx])
        setLearnModeQuestions(incorrectQuestionsData)
        setCurrentQuestionIndex(0)
        setIncorrectQuestions([])
        setAnsweredQuestions(new Set())
        setCorrectAnswers(new Set())
        setRound(prev => prev + 1)
      } else {
        // All questions answered correctly - complete!
        setIsLearnModeActive(false)
      }
    }
  }

  const exitLearnMode = () => {
    setIsLearnModeActive(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setAnsweredQuestions(new Set())
    setCorrectAnswers(new Set())
    setIncorrectQuestions([])
    setRound(1)
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="text-blue-600 text-5xl mx-auto animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (will be redirected)
  if (!user) {
    return null
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="text-center"><FiLoader className="text-blue-600 text-5xl mx-auto animate-spin mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading...</p></div></div>}>
      <div className="h-screen-safe bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Onboarding Carousel for first-time users */}
        {showOnboarding && (
          <OnboardingCarousel
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingComplete}
          />
        )}
        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-8">
              <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FiBook className="text-white text-sm sm:text-base" />
                </div>
                <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Koala.ai
                </span>
              </Link>
              <div className="hidden md:flex space-x-4 lg:space-x-6">
                <Link
                  href="/dashboard"
                  className={`text-sm lg:text-base ${activeScreen === 'dashboard' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900 dark:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/library"
                  className={`text-sm lg:text-base ${activeScreen === 'library' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900 dark:text-white'}`}
                >
                  Library
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className={`text-sm lg:text-base ${activeScreen === 'analytics' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900 dark:text-white'}`}
                >
                  Analytics
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={() => { hapticButton(); setShowStreakModal(true) }}>
                <StreakDisplay streak={streak} size="sm" />
              </button>
              <Link
                href="/settings"
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FiSettings className="text-gray-600 dark:text-white text-lg sm:text-base" />
              </Link>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Learn Mode Progress Bar - Attached to Top */}
      {activeScreen === 'library' && selectedLecture && isLearnModeActive && learnModeQuestions.length > 0 && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + (showExplanation ? 1 : 0)) / learnModeQuestions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Question {currentQuestionIndex + 1} of {learnModeQuestions.length}</span>
              <span>{correctAnswers.size} correct</span>
            </div>
          </div>
        </div>
      )}

      {/* Flashcard Mode Progress Bar - Attached to Top */}
      {activeScreen === 'library' && selectedLecture && isFlashcardModeActive && flashcards.length > 0 && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentFlashcardIndex + 1) / flashcards.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Card {currentFlashcardIndex + 1} of {flashcards.length}</span>
              <button
                onClick={() => {
                  setIsFlashcardModeActive(false)
                  setCurrentFlashcardIndex(0)
                  setIsCardFlipped(false)
                }}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main scrollable content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Dashboard Screen */}
        {(activeScreen === 'dashboard' || (isTransitioning && previousScreen === 'dashboard')) && (
          <ScreenTransition
            animationType={activeScreen === 'dashboard' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'dashboard'}
          >
            <div className="overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full">
              <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8 pt-32 sm:pt-36`}>
        {!selectedCourse && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize your lectures by course</p>
              </div>
              <button
                onClick={() => setShowNewCourseModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center space-x-2"
              >
                <FiPlus />
                <span className="hidden sm:inline">New Course</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <FiFileText className="text-blue-600 dark:text-gray-400 text-xl" />
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-white">{lectures.length}</p>
                <p className="text-xs text-blue-700 dark:text-gray-400">Total Lectures</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-purple-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <FiClock className="text-purple-600 dark:text-gray-400 text-xl" />
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-white">
                  {(() => {
                    const totalSeconds = lectures.reduce((sum, l) => sum + (l.duration || 0), 0)
                    const hours = Math.floor(totalSeconds / 3600)
                    const minutes = Math.floor((totalSeconds % 3600) / 60)
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                  })()}
                </p>
                <p className="text-xs text-purple-700 dark:text-gray-400">Hours Recorded</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-green-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <FiMic className="text-green-600 dark:text-gray-400 text-xl" />
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-white">
                  {lectures.filter(l => {
                    const lectureDate = new Date(l.created_at)
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return lectureDate >= weekAgo
                  }).length}
                </p>
                <p className="text-xs text-green-700 dark:text-gray-400">This Week</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-orange-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <FiTrendingUp className="text-orange-600 dark:text-gray-400 text-xl" />
                </div>
                <p className="text-2xl font-bold text-orange-900 dark:text-white">{streak}</p>
                <p className="text-xs text-orange-700 dark:text-gray-400">Study Streak</p>
              </div>
            </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Courses Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoadingCourses ? (
                <div className="col-span-2 text-center py-12">
                  <FiLoader className="text-gray-400 text-4xl mx-auto animate-spin mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50]">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBook className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 max-w-xs mx-auto">Create your first course to get started</p>
                  <button
                    onClick={() => setShowNewCourseModal(true)}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-xl btn-press hover:bg-blue-700"
                  >
                    <FiPlus />
                    <span>Create Course</span>
                  </button>
                </div>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-6 active:shadow-lg transition-all cursor-pointer group touch-manipulation"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${courseColorClasses[course.color]?.bg || courseColorClasses.blue.bg} rounded-xl flex items-center justify-center group-active:scale-110 transition-transform`}>
                        <FiBook className={`${courseColorClasses[course.color]?.text || courseColorClasses.blue.text} text-xl -ml-0.5`} />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{course.lectures} lectures</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-active:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {course.code && `${course.code} • `}
                      {course.professor || 'No professor set'}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Recent Lectures */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Lectures</h3>
                <button
                  onClick={() => setActiveScreen('library')}
                  className="text-blue-600 text-xs sm:text-sm font-medium hover:text-blue-700"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {isLoadingLectures ? (
                  <div className="space-y-3">
                    <SkeletonLectureCard />
                    <SkeletonLectureCard />
                    <SkeletonLectureCard />
                  </div>
                ) : lectures.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFileText className="text-gray-300 text-4xl mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No lectures recorded yet</p>
                  </div>
                ) : (
                  lectures.slice(0, 3).map((lecture, index) => {
                    const durationMinutes = Math.floor(lecture.duration / 60)
                    const formattedDuration = durationMinutes >= 60
                      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                      : `${durationMinutes}m`
                    const createdDate = new Date(lecture.created_at)
                    const now = new Date()
                    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
                    const dateDisplay = diffHours < 24
                      ? 'Today'
                      : diffHours < 48
                      ? 'Yesterday'
                      : `${Math.floor(diffHours / 24)} days ago`

                    return (
                      <div key={lecture.id} className={`flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer card-press animate-list-item stagger-${index + 1}`}>
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            lecture.transcription_status === 'completed' ? 'bg-teal-100 dark:bg-teal-900/30' :
                            lecture.transcription_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                          }`}>
                            <FiFileText className={`text-base sm:text-lg ${
                              lecture.transcription_status === 'completed' ? 'text-teal-600 dark:text-teal-400' :
                              lecture.transcription_status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{lecture.title}</div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{dateDisplay} • {formattedDuration}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {lecture.transcription_status === 'completed' ? (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium rounded-full">
                              Ready
                            </span>
                          ) : lecture.transcription_status === 'failed' ? (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                              Failed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full hidden sm:inline">
                              Processing
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowNewCourseModal(true)}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="text-white" />
                  <span className="font-medium text-white">New Course</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <FiSearch className="text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-900 dark:text-white">Search Notes</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <FiFolder className="text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-900 dark:text-white">Browse Library</span>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Pro Tip
              </h3>
              <p className="text-sm text-gray-700">
                Click on a course to see all lectures and record new ones. Organize your notes by subject for better study sessions.
              </p>
            </div>

            {/* Storage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-300">2.4 GB used</span>
                  <span className="text-gray-600 dark:text-gray-300">of 10 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                Upgrade Storage →
              </button>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Course Detail View with Recording */}
        {activeScreen === 'dashboard' && selectedCourse && (() => {
          const course = courses.find(c => c.id === selectedCourse)
          const courseLectures = lectures.filter(l => l.course_id === selectedCourse)
          const lectureCount = courseLectures.length

          if (!course) return null

          return (
          <div key={course.id} className={isExitingCourse ? 'animate-zoom-out' : 'animate-zoom-in'}>
            {/* Course Header */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setIsExitingCourse(true)
                  setTimeout(() => {
                    setSelectedCourse(null)
                    setIsExitingCourse(false)
                  }, 200)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors mb-4"
              >
                <FiHome className="text-lg" />
                <span>Back to Home</span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {course.code ? `${course.code} - ${course.name}` : course.name}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
                    {course.professor && ` • ${course.professor}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Recording Interface (when recording) */}
            {isRecording && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="text-center">
                  <div className="mb-6">
                    <div className={`w-32 h-32 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4 ${!isPaused && 'recording-indicator'}`}>
                      <FiMic className="text-white text-5xl" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
                      {formatDuration(duration)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Recording Lecture
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
                    </p>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto">
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="flex-1 bg-yellow-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                    >
                      {isPaused ? <><FiPlay className="inline mr-2" />Resume</> : <><FiPause className="inline mr-2" />Pause</>}
                    </button>
                    <button
                      onClick={() => stopAndGenerateNotes()}
                      disabled={isGeneratingNotes}
                      className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <FiSquare className="inline mr-2" />
                      {isGeneratingNotes ? 'Generating...' : 'Stop & Generate'}
                    </button>
                  </div>

                  {(transcript || interimTranscript) && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-medium text-gray-700">Live Transcription</p>
                      </div>
                      <div className="max-h-32 overflow-y-auto text-left">
                        <p className="text-gray-900 text-sm">
                          {transcript}
                          {interimTranscript && <span className="text-gray-500 italic"> {interimTranscript}</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Study Mode Tabs */}
            {notes && !isRecording && (flashcards.length > 0 || learnModeQuestions.length > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setStudyViewMode('notes')}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base ${
                      studyViewMode === 'notes'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 dark:text-white'
                    }`}
                  >
                    📝 Notes
                  </button>
                  {flashcards.length > 0 && (
                    <button
                      onClick={() => setStudyViewMode('flashcards')}
                      className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base border-l border-gray-200 ${
                        studyViewMode === 'flashcards'
                          ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                          : 'text-gray-600 hover:text-gray-900 dark:text-white'
                      }`}
                    >
                      🎴 Flashcards
                    </button>
                  )}
                  {learnModeQuestions.length > 0 && (
                    <button
                      onClick={() => setStudyViewMode('learn')}
                      className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base border-l border-gray-200 ${
                        studyViewMode === 'learn'
                          ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                          : 'text-gray-600 hover:text-gray-900 dark:text-white'
                      }`}
                    >
                      ✓ Learn
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Notes Tab */}
                  {studyViewMode === 'notes' && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Generated Notes</h3>
                      <div className="prose prose-sm max-w-none mb-4">
                        <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">{notes}</pre>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={saveNotesToLibrary}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700">
                          Save to Library
                        </button>
                        <button
                          onClick={generateFlashcards}
                          disabled={isGeneratingFlashcards}
                          className="px-4 py-2 bg-purple-600 text-white btn-press rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                        </button>
                        <button
                          onClick={() => generateLearnMode()}
                          disabled={isGeneratingLearnMode}
                          className="px-4 py-2 bg-green-600 text-white btn-press rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isGeneratingLearnMode ? 'Generating...' : 'Generate Learn Mode'}
                        </button>
                        <button onClick={reset} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                          New Recording
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flashcards Tab */}
                  {studyViewMode === 'flashcards' && flashcards.length > 0 && (
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Study Flashcards ({flashcards.length})</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {flashcards.map((card, index) => (
                          <div
                            key={index}
                            onClick={() => toggleCard(index)}
                            className="relative h-40 sm:h-48 cursor-pointer perspective-1000"
                          >
                            <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${
                              flippedCards.has(index) ? 'rotate-y-180' : ''
                            }`}>
                              {/* Front of card */}
                              <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 flex items-center justify-center text-center">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Question {index + 1}</p>
                                  <p className="text-black dark:text-white font-medium text-sm sm:text-base">{card.question}</p>
                                </div>
                              </div>
                              {/* Back of card */}
                              <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 flex items-center justify-center text-center rotate-y-180">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Answer</p>
                                  <p className="text-black dark:text-white text-sm sm:text-base">{card.answer}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-4 text-center">Click on any card to flip it</p>
                    </div>
                  )}

                  {/* Learn Mode Tab */}
                  {studyViewMode === 'learn' && learnModeQuestions.length > 0 && (
                        <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-[#0B1220] dark:to-[#0F172A] border-2 border-green-200 dark:border-[#1E293B] rounded-xl shadow-lg dark:shadow-2xl">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F1F5F9]">Learn Mode</h3>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#94A3B8]">Round {round} • Question {currentQuestionIndex + 1} of {learnModeQuestions.length}</p>
                            </div>
                            <button
                              onClick={exitLearnMode}
                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 dark:bg-[#334155] text-white rounded-lg hover:bg-gray-700 dark:hover:bg-[#475569] text-xs sm:text-sm whitespace-nowrap transition-colors"
                            >
                              Exit Learn Mode
                            </button>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4 sm:mb-6">
                            <div className="w-full bg-gray-200 dark:bg-[#1E293B] rounded-full h-2 sm:h-3">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + (showExplanation ? 1 : 0)) / learnModeQuestions.length) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-[#94A3B8]">
                              <span>{correctAnswers.size} correct</span>
                              <span>{answeredQuestions.size} / {learnModeQuestions.length} answered</span>
                            </div>
                          </div>

                          {/* Question Card */}
                          <div className="bg-white dark:bg-[#151E2F] rounded-xl p-4 sm:p-6 shadow-md dark:shadow-xl dark:border dark:border-[#1E293B] mb-4 sm:mb-6">
                            <div className="mb-3 sm:mb-4">
                              <span className="px-2.5 py-1 sm:px-3 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full border border-transparent dark:border-purple-500/30">
                                {learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                              </span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-[#F1F5F9] mb-4 sm:mb-6 leading-relaxed">
                              {learnModeQuestions[currentQuestionIndex].question}
                            </h4>

                            {/* Answer Options */}
                            <div className="space-y-3 sm:space-y-4">
                              {learnModeQuestions[currentQuestionIndex].options.map((option, idx) => {
                                const isSelected = selectedAnswer === option
                                const isCorrect = option === learnModeQuestions[currentQuestionIndex].correctAnswer
                                const showCorrect = showExplanation && isCorrect
                                const showIncorrect = showExplanation && isSelected && !isCorrect

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={showExplanation}
                                    className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all text-sm sm:text-base ${
                                      showCorrect
                                        ? 'bg-green-50 dark:bg-green-500/15 border-green-500 dark:border-green-400 text-green-900 dark:text-green-200'
                                        : showIncorrect
                                        ? 'bg-red-50 dark:bg-red-500/15 border-red-500 dark:border-red-400 text-red-900 dark:text-red-200'
                                        : isSelected
                                        ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200 shadow-md dark:shadow-blue-500/10'
                                        : 'bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] text-gray-900 dark:text-[#F1F5F9] hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-[0.98]'
                                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium break-words">{option}</span>
                                      {showCorrect && <span className="text-green-500 dark:text-green-400 text-lg sm:text-xl flex-shrink-0">✓</span>}
                                      {showIncorrect && <span className="text-red-500 dark:text-red-400 text-lg sm:text-xl flex-shrink-0">✗</span>}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>

                            {/* Explanation */}
                            {showExplanation && (
                              <div className={`mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl ${
                                selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                  ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/40'
                                  : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/40'
                              }`}>
                                <div className="flex items-start gap-3 sm:gap-4">
                                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}>
                                    <span className="text-white text-lg sm:text-xl font-bold">
                                      {selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer ? '✓' : '✗'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-semibold mb-1 text-sm sm:text-base ${
                                      selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                        ? 'text-green-900 dark:text-green-200'
                                        : 'text-red-900 dark:text-red-200'
                                    }`}>
                                      {selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer ? 'Correct!' : 'Incorrect'}
                                    </p>
                                    <p className={`text-sm sm:text-base leading-relaxed ${
                                      selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                        ? 'text-green-800 dark:text-green-300'
                                        : 'text-red-800 dark:text-red-300'
                                    }`}>
                                      {learnModeQuestions[currentQuestionIndex].explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-5 sm:mt-6 flex gap-3">
                              {!showExplanation ? (
                                <button
                                  onClick={handleSubmitAnswer}
                                  disabled={!selectedAnswer}
                                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white btn-press rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm sm:text-base shadow-lg dark:shadow-purple-500/20"
                                >
                                  Submit Answer
                                </button>
                              ) : (
                                <button
                                  onClick={handleNextQuestion}
                                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl btn-press font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all text-sm sm:text-base shadow-lg dark:shadow-blue-500/20"
                                >
                                  {currentQuestionIndex < learnModeQuestions.length - 1 ? 'Next Question' : incorrectQuestions.length > 0 ? 'Start Next Round' : 'Complete!'}
                                </button>
                              )}
                            </div>
                          </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Errors */}
            {flashcardsError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-red-600" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Flashcard Generation Error:</p>
                    <p className="text-red-700 text-sm">{flashcardsError}</p>
                  </div>
                </div>
              </div>
            )}
            {learnModeError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-red-600" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Learn Mode Generation Error:</p>
                    <p className="text-red-700 text-sm">{learnModeError}</p>
                  </div>
                </div>
              </div>
            )}
            {recordingError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium mb-1">Recording Error:</p>
                    <p className="text-red-700 text-sm">{recordingError}</p>
                  </div>
                </div>
              </div>
            )}
            {notesError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium mb-1">Notes Generation Error:</p>
                    <p className="text-red-700 text-sm">{notesError}</p>
                  </div>
                </div>
              </div>
            )}
            {!isSupported && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium mb-1">Recording Not Available</p>
                    <p className="text-red-700 text-sm">
                      Your device does not support audio recording. Please try a different browser or device.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isTranscribing && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiLoader className="text-purple-600 flex-shrink-0 mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="text-purple-800 text-sm font-medium mb-1">Transcribing Audio...</p>
                    <p className="text-purple-700 text-sm">
                      Please wait while we convert your recording to text. This may take a minute.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lectures in this Course */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Lectures</h3>
              <div className="space-y-3">
                {(() => {
                  const courseLectures = lectures.filter(l => l.course_id === selectedCourse)

                  if (courseLectures.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <FiFileText className="text-gray-300 text-4xl mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No lectures in this course yet</p>
                      </div>
                    )
                  }

                  return courseLectures.map((lecture) => {
                    const durationMinutes = Math.floor(lecture.duration / 60)
                    const formattedDuration = durationMinutes >= 60
                      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                      : `${durationMinutes}m`
                    const createdDate = new Date(lecture.created_at)
                    const now = new Date()
                    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
                    const dateDisplay = diffHours < 24
                      ? 'Today'
                      : diffHours < 48
                      ? 'Yesterday'
                      : `${Math.floor(diffHours / 24)} days ago`

                    return (
                      <div key={lecture.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{lecture.title}</h4>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            lecture.transcription_status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            lecture.transcription_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {lecture.transcription_status === 'completed' ? 'Completed' :
                             lecture.transcription_status === 'failed' ? 'Failed' :
                             lecture.transcription_status === 'processing' ? 'Processing' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {formattedDuration}
                          </span>
                          <span>{dateDisplay}</span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
          )
        })()}
              </div>
            </div>
          </ScreenTransition>
        )}

        {/* Library Screen */}
        {(activeScreen === 'library' || (isTransitioning && previousScreen === 'library')) && (
          <ScreenTransition
            animationType={activeScreen === 'library' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'library'}
          >
            <div className="overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full">
              <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8 ${(selectedLecture && isLearnModeActive && learnModeQuestions.length > 0) || (selectedLecture && isFlashcardModeActive && flashcards.length > 0) ? 'pt-40 sm:pt-44' : 'pt-32 sm:pt-36'}`}>
        {!selectedLecture && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h2>
              {librarySearchQuery && (
                <button
                  onClick={() => setLibrarySearchQuery('')}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search lectures..."
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setLibraryFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  libraryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Lectures
              </button>
              <button
                onClick={() => setLibraryFilter('week')}
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
            <div className="space-y-3">
              {(() => {
                if (isLoadingLectures) {
                  return (
                    <div className="text-center py-12">
                      <FiLoader className="text-gray-400 text-4xl mx-auto animate-spin mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Loading lectures...</p>
                    </div>
                  )
                }

                const filteredLectures = lectures.filter((lecture) => {
                  // Filter by search query
                  const query = librarySearchQuery.toLowerCase()
                  const matchesSearch = (
                    lecture.title.toLowerCase().includes(query) ||
                    lecture.courses?.name?.toLowerCase().includes(query)
                  )

                  // Filter by time
                  if (libraryFilter === 'week') {
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                    const lectureDate = new Date(lecture.created_at)
                    return matchesSearch && lectureDate >= oneWeekAgo
                  }

                  return matchesSearch
                })

                if (filteredLectures.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <FiSearch className="text-gray-300 text-5xl mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No lectures found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {librarySearchQuery ? `No results for "${librarySearchQuery}"` : 'Your library is empty. Start recording your first lecture!'}
                      </p>
                    </div>
                  )
                }

                return filteredLectures.map((lecture, index) => {
                  const durationMinutes = Math.floor(lecture.duration / 60)
                  const formattedDuration = durationMinutes >= 60
                    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                    : `${durationMinutes}m`
                  const createdDate = new Date(lecture.created_at)
                  const formattedDate = createdDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })

                  return (
                    <SwipeToDelete
                      key={lecture.id}
                      onDelete={() => deleteLecture(lecture.id)}
                      className={`animate-list-item stagger-${Math.min(index + 1, 10)}`}
                    >
                      <div
                        onClick={() => setSelectedLecture(lecture.id)}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer card-press"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{lecture.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lecture.courses?.name || 'No course'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lecture.transcription_status === 'completed' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' :
                            lecture.transcription_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {lecture.transcription_status === 'completed' ? 'Ready' :
                             lecture.transcription_status === 'failed' ? 'Failed' :
                             lecture.transcription_status === 'processing' ? 'Processing' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {formattedDuration}
                          </span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </SwipeToDelete>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Library Lecture Detail View */}
        {activeScreen === 'library' && selectedLecture && !isLearnModeActive && !isFlashcardModeActive && (
          <div className={`space-y-4 pb-20 ${isExitingLecture ? 'animate-zoom-out' : 'animate-zoom-in'}`}>
            {/* Back Button */}
            <button
              onClick={() => {
                setIsExitingLecture(true)
                setTimeout(() => {
                  setSelectedLecture(null)
                  setIsExitingLecture(false)
                }, 200)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              <FiHome className="text-lg" />
              <span>Back to Home</span>
            </button>

            {/* Lecture Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Completed
                </span>
              </div>
            </div>

            {/* Audio Player */}
            <AudioPlayer
              audioUrl={selectedLectureData?.audio_url || null}
              duration={selectedLectureData?.duration || 0}
            />

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Generated Notes</h3>
              {isLoadingLectureNotes ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="text-gray-400 text-4xl animate-spin" />
                </div>
              ) : selectedLectureNotes ? (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedLectureNotes}
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
                    generateLearnMode()
                  } else {
                    alert('No notes available for this lecture')
                  }
                }}
                disabled={isGeneratingLearnMode}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-4 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingLearnMode ? (
                  <FiLoader className="animate-spin text-lg" />
                ) : (
                  <FiFileText className="text-lg" />
                )}
                <span>{isGeneratingLearnMode ? 'Generating...' : 'Learn Mode'}</span>
              </button>
              <button
                onClick={async () => {
                  if (flashcards.length > 0) {
                    setCurrentFlashcardIndex(0)
                    setIsCardFlipped(false)
                    setIsFlashcardModeActive(true)
                  } else {
                    // Generate flashcards first
                    setIsGeneratingFlashcards(true)
                    setFlashcardsError(null)
                    try {
                      const response = await fetch('/api/ai/generate-flashcards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: selectedLectureNotes || notes, numberOfCards: 10 }),
                      })
                      const data = await response.json()
                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to generate flashcards')
                      }
                      setFlashcards(data.flashcards)
                      setCurrentFlashcardIndex(0)
                      setIsCardFlipped(false)
                      setIsFlashcardModeActive(true)
                    } catch (err: any) {
                      setFlashcardsError(err.message || 'Failed to generate flashcards')
                    }
                    setIsGeneratingFlashcards(false)
                  }
                }}
                disabled={isGeneratingFlashcards}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white btn-press px-4 py-4 rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {isGeneratingFlashcards ? (
                  <FiLoader className="text-lg animate-spin" />
                ) : (
                  <FiBook className="text-lg" />
                )}
                <span>{isGeneratingFlashcards ? 'Generating...' : 'Flashcards'}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <FiFileText className="text-blue-600 dark:text-blue-400 text-xl mb-2" />
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedLectureNotes ? selectedLectureNotes.split(/\s+/).length : 0}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Words</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <FiBook className="text-purple-600 dark:text-purple-400 text-xl mb-2" />
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{flashcards.length}</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">Flashcards</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <FiCheckCircle className="text-green-600 dark:text-green-400 text-xl mb-2" />
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{learnModeQuestions.length}</p>
                <p className="text-xs text-green-700 dark:text-green-300">Quiz Questions</p>
              </div>
            </div>

            {/* Delete Lecture Button */}
            <button
              onClick={() => {
                hapticButton()
                setShowDeleteLectureModal(true)
              }}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-4 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 font-medium transition-colors"
            >
              <FiTrash2 className="text-lg" />
              <span>Delete Lecture</span>
            </button>
          </div>
        )}

        {/* Library Learn Mode View */}
        {activeScreen === 'library' && selectedLecture && isLearnModeActive && learnModeQuestions.length > 0 && (
          <div className="space-y-4 pb-20 animate-zoom-in">
            {/* Question Card */}
            <div className="bg-white dark:bg-[#151E2F] rounded-xl p-5 sm:p-6 shadow-md dark:shadow-none border border-gray-200 dark:border-[#1E293B] space-y-4">
              <div>
                <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                  {learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-[#F1F5F9]">
                {learnModeQuestions[currentQuestionIndex].question}
              </h4>

              {/* Answer Options */}
              <div className="space-y-3">
                {learnModeQuestions[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswer === option
                  const isCorrect = option === learnModeQuestions[currentQuestionIndex].correctAnswer
                  const showCorrect = showExplanation && isCorrect
                  const showIncorrect = showExplanation && isSelected && !isCorrect

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showExplanation}
                      className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                        showCorrect
                          ? 'bg-green-100 dark:bg-green-500/15 border-2 border-green-500 dark:border-green-400 text-green-900 dark:text-green-200'
                          : showIncorrect
                          ? 'bg-red-100 dark:bg-red-500/15 border-2 border-red-500 dark:border-red-400 text-red-900 dark:text-red-200'
                          : isSelected && !showExplanation
                          ? 'bg-blue-100 dark:bg-blue-500/15 border-2 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-[#1E293B] border-2 border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F1F5F9] hover:bg-gray-200 dark:hover:bg-[#263549] hover:border-gray-400 dark:hover:border-[#475569]'
                      } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className={`mt-4 p-4 sm:p-5 rounded-xl ${
                  selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                    ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/40'
                    : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/40'
                }`}>
                  <p className={`text-sm ${
                    selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    <strong>Explanation:</strong> {learnModeQuestions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!showExplanation && selectedAnswer ? (
                <button
                  onClick={handleSubmitAnswer}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg dark:shadow-purple-500/20"
                >
                  Submit Answer
                </button>
              ) : showExplanation ? (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg dark:shadow-blue-500/20"
                >
                  {currentQuestionIndex < learnModeQuestions.length - 1 ? 'Next Question' : 'Complete'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Library Flashcard Mode View */}
        {activeScreen === 'library' && selectedLecture && isFlashcardModeActive && flashcards.length > 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20 animate-zoom-in">
            {/* Flashcard */}
            <div
              className="w-full max-w-md perspective-1000 cursor-pointer"
              onClick={() => setIsCardFlipped(!isCardFlipped)}
            >
              <div
                className={`relative w-full h-64 transition-transform duration-500 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front - Question */}
                <div
                  className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">Question</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                    {flashcards[currentFlashcardIndex].question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">Tap to flip</p>
                </div>

                {/* Back - Answer */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-6 flex flex-col items-center justify-center backface-hidden rotate-y-180"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-4">Answer</span>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100 text-center">
                    {flashcards[currentFlashcardIndex].answer}
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-6">Tap to flip back</p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center space-x-6 mt-8">
              <button
                onClick={() => {
                  if (currentFlashcardIndex > 0) {
                    setCurrentFlashcardIndex(currentFlashcardIndex - 1)
                    setIsCardFlipped(false)
                  }
                }}
                disabled={currentFlashcardIndex === 0}
                className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FiChevronLeft className="text-xl text-gray-700 dark:text-gray-300" />
              </button>

              <div className="text-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {currentFlashcardIndex + 1} / {flashcards.length}
                </span>
              </div>

              <button
                onClick={() => {
                  if (currentFlashcardIndex < flashcards.length - 1) {
                    setCurrentFlashcardIndex(currentFlashcardIndex + 1)
                    setIsCardFlipped(false)
                  }
                }}
                disabled={currentFlashcardIndex === flashcards.length - 1}
                className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FiChevronRight className="text-xl text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Keyboard Hint */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Use arrow keys or swipe to navigate
            </p>
          </div>
        )}
              </div>
            </div>
          </ScreenTransition>
        )}

        {/* Analytics Screen */}
        {(activeScreen === 'analytics' || (isTransitioning && previousScreen === 'analytics')) && (
          <ScreenTransition
            animationType={activeScreen === 'analytics' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'analytics'}
          >
            <div className="overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full">
              <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8 pt-32 sm:pt-36`}>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>

            {/* Time Period Selector */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setAnalyticsTimeFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setAnalyticsTimeFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setAnalyticsTimeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                // Filter lectures based on time period
                const filteredAnalyticsLectures = lectures.filter((lecture) => {
                  const lectureDate = new Date(lecture.created_at)
                  const now = new Date()

                  if (analyticsTimeFilter === 'week') {
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(now.getDate() - 7)
                    return lectureDate >= oneWeekAgo
                  } else if (analyticsTimeFilter === 'month') {
                    const oneMonthAgo = new Date()
                    oneMonthAgo.setMonth(now.getMonth() - 1)
                    return lectureDate >= oneMonthAgo
                  }

                  return true // 'all' - show everything
                })

                return (
                  <>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <FiClock className="text-blue-600 dark:text-gray-400 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-white">
                        {(() => {
                          const totalSeconds = filteredAnalyticsLectures.reduce((sum, lec) => sum + lec.duration, 0)
                          const hours = Math.floor(totalSeconds / 3600)
                          const minutes = Math.floor((totalSeconds % 3600) / 60)
                          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                        })()}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-gray-400">Study Time</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-purple-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <FiFileText className="text-purple-600 dark:text-gray-400 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-white">{filteredAnalyticsLectures.length}</p>
                      <p className="text-xs text-purple-700 dark:text-gray-400">Lectures</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-green-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <FiBook className="text-green-600 dark:text-gray-400 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-white">{courses.length}</p>
                      <p className="text-xs text-green-700 dark:text-gray-400">Courses</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-orange-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <FiMic className="text-orange-600 dark:text-gray-400 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-white">
                        {filteredAnalyticsLectures.length > 0
                          ? `${Math.round((filteredAnalyticsLectures.filter(l => l.transcription_status === 'completed').length / filteredAnalyticsLectures.length) * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-gray-400">Completed</p>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Study Streak */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Study Streak</h3>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="text-orange-600 dark:text-orange-400 text-2xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{streak === 0 ? 'Start your streak!' : streak >= 7 ? 'Amazing progress!' : 'Keep it up!'}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  // Calculate which days should be active based on streak
                  const today = new Date().getDay()
                  const adjustedToday = today === 0 ? 6 : today - 1 // Convert Sunday=0 to index 6, Monday=1 to index 0
                  const isActive = isActiveToday()
                    ? i <= adjustedToday && (adjustedToday - i) < streak
                    : i < adjustedToday && (adjustedToday - 1 - i) < streak
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className={`w-full h-8 rounded ${isActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} mb-1`}></div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{day}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Top Courses</h3>
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No courses yet</p>
                ) : (
                  courses.slice(0, 3).map((course) => {
                    const courseLectures = lectures.filter(l => l.course_id === course.id)
                    const totalHours = courseLectures.reduce((sum, l) => sum + l.duration, 0) / 3600
                    const maxHours = Math.max(...courses.map(c =>
                      lectures.filter(l => l.course_id === c.id).reduce((sum, l) => sum + l.duration, 0) / 3600
                    ), 1)

                    return (
                      <div key={course.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-white">{course.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="progress-bar-gradient h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(totalHours / maxHours) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pt-2">Recent Activity</h3>
              <div className="space-y-3">
                {lectures.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No activity yet</p>
                ) : (
                  lectures.slice(0, 5).map((lecture) => {
                    const createdDate = new Date(lecture.created_at)
                    const now = new Date()
                    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
                    const timeDisplay = diffHours < 1
                      ? 'Just now'
                      : diffHours < 24
                      ? `${diffHours}h ago`
                      : diffHours < 48
                      ? 'Yesterday'
                      : `${Math.floor(diffHours / 24)}d ago`

                    const statusColor = lecture.transcription_status === 'completed' ? 'green' :
                                       lecture.transcription_status === 'failed' ? 'red' : 'blue'
                    const statusText = lecture.transcription_status === 'completed' ? 'Completed lecture' :
                                      lecture.transcription_status === 'failed' ? 'Lecture failed' :
                                      lecture.transcription_status === 'processing' ? 'Processing lecture' : 'Recorded lecture'

                    // Proper Tailwind classes for dark mode
                    const iconBgClass = lecture.transcription_status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                       lecture.transcription_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    const iconTextClass = lecture.transcription_status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                         lecture.transcription_status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'

                    return (
                      <div key={lecture.id} className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgClass}`}>
                          <FiMic className={`text-lg ${iconTextClass}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{statusText}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{lecture.title} • {timeDisplay}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
              </div>
            </div>
          </ScreenTransition>
        )}

        {/* Classes Screen - Join & Share Lectures */}
        {(activeScreen === 'feed' || (isTransitioning && previousScreen === 'feed')) && (
          <ScreenTransition
            animationType={activeScreen === 'feed' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'feed'}
          >
            <div className="overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full">
              <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 md:pb-8 pt-32 sm:pt-36`}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-6">Classes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your classes and share lectures with classmates</p>
              </div>
              <button
                onClick={() => {
                  setShowNewCourseModal(true);
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl btn-press hover:bg-blue-700 font-medium text-sm flex items-center justify-center space-x-2 w-full sm:w-auto shrink-0"
              >
                <FiPlus className="w-4 h-4" />
                <span>New Class</span>
              </button>
            </div>

            {/* Your Classes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Classes</h3>
              {userClasses && userClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {userClasses.map((cls: any) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{cls.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{cls.professor} • {cls.code}</p>
                          {cls.description && (
                            <p className="text-sm text-gray-600 mt-2">{cls.description}</p>
                          )}
                        </div>
                        <div
                          className={`w-12 h-12 ${courseColorClasses[cls.color]?.bg || courseColorClasses.blue.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <FiUsers className={`${courseColorClasses[cls.color]?.text || courseColorClasses.blue.text}`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FiUsers className="text-gray-600 dark:text-gray-300" />
                            <span>{cls.class_memberships?.length || 0} members</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveScreen('library')}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                        >
                          View Lectures
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBook className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-700 dark:text-white font-semibold text-lg">No classes yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">Create a new class or join an existing one to get started</p>
                </div>
              )}
            </div>

            {/* Join a Class */}
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join a Class</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-[#2C3E50] p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      Class Code
                    </label>
                    <input
                      type="text"
                      value={joinClassCode}
                      onChange={(e) => setJoinClassCode(e.target.value)}
                      placeholder="e.g., CS101"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    />
                  </div>
                  <button
                    onClick={handleJoinClass}
                    disabled={isJoiningClass || !joinClassCode.trim()}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl btn-press hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoiningClass ? 'Joining...' : 'Join Class'}
                  </button>
                </div>
              </div>
            </div>
          </div>
              </div>
            </div>
          </ScreenTransition>
        )}
      </div> {/* Close flex-1 container */}

      {/* New Course Modal */}
      {showNewCourseModal && (
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
                  onChange={(e) => setNewCourseData({ ...newCourseData, name: e.target.value })}
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
                  onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value })}
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
                  onChange={(e) => setNewCourseData({ ...newCourseData, professor: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  disabled={isCreatingCourse}
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
                      onClick={() => setNewCourseData({ ...newCourseData, color })}
                      disabled={isCreatingCourse}
                      className={`w-10 h-10 rounded-full bg-${color}-500 hover:scale-110 transition-transform ${
                        newCourseData.color === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                      } ${isCreatingCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewCourseModal(false)
                    setNewCourseData({
                      name: '',
                      code: '',
                      professor: '',
                      color: 'blue',
                      category: 'Computer Science'
                    })
                  }}
                  disabled={isCreatingCourse}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={isCreatingCourse}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || 'john.doe@example.com'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle profile update
                    setShowEditProfileModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle password change
                    setShowChangePasswordModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700 font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio Quality Modal */}
      {showAudioQualityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Audio Quality</h2>
            <div className="space-y-3">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => {
                    setAudioQuality(quality)
                    setShowAudioQualityModal(false)
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    audioQuality === quality
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{quality}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {quality === 'low' && '48 kbps - Saves space'}
                        {quality === 'medium' && '128 kbps - Balanced'}
                        {quality === 'high' && '320 kbps - Best quality'}
                      </p>
                    </div>
                    {audioQuality === quality && (
                      <FiCheckCircle className="text-blue-600 text-xl" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAudioQualityModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notes Detail Level Modal */}
      {showNotesDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notes Detail Level</h2>
            <div className="space-y-3">
              {(['brief', 'detailed', 'comprehensive'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setNotesDetailLevel(level)
                    setShowNotesDetailModal(false)
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    notesDetailLevel === level
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{level}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {level === 'brief' && 'Key points and summaries'}
                        {level === 'detailed' && 'Comprehensive with examples'}
                        {level === 'comprehensive' && 'In-depth with all details'}
                      </p>
                    </div>
                    {notesDetailLevel === level && (
                      <FiCheckCircle className="text-blue-600 text-xl" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNotesDetailModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes recording {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
          }
        }
        .recording-indicator {
          animation: recording 2s ease-in-out infinite;
        }
      `}</style>

      {/* Mobile Bottom Navigation with Center Record Button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 pb-8">
        <div className="flex items-end justify-evenly h-16 px-4 pt-2">
          {/* Home */}
          <button
            onClick={() => { hapticSelection(); setActiveScreen('dashboard') }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[48px] ${
              activeScreen === 'dashboard' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <FiHome className="text-xl" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Library */}
          <button
            onClick={() => { hapticSelection(); setActiveScreen('library') }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[48px] ${
              activeScreen === 'library' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <FiBook className="text-xl" />
            <span className="text-[10px] font-medium">Library</span>
          </button>

          {/* Center Record Button */}
          <div className="relative">
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            )}
            <button
              onClick={async () => {
                hapticImpact('medium')
                if (!isRecording) {
                  setShowReadyToRecordModal(true)
                } else {
                  setIsStoppingRecording(true)
                  try {
                    const result = await stopAndGenerateNotes()
                    console.log('[Dashboard] stopAndGenerateNotes result:', result ? { transcript: result.transcript?.length, notes: result.notes?.length, audioBlob: result.audioBlob?.size } : 'null')

                    // Always capture audioBlob if available
                    if (result?.audioBlob) {
                      capturedAudioBlobRef.current = result.audioBlob
                      console.log('[Dashboard] Captured audioBlob in ref:', result.audioBlob.size, 'bytes')
                    }

                    if (result && result.transcript) {
                      hapticSuccess()
                      setShowCourseSelectionModal(true)
                    } else {
                      hapticError()
                      // Show modal anyway if we have any transcript from the recording state
                      if (transcript && transcript.trim().length > 0) {
                        setShowCourseSelectionModal(true)
                      } else {
                        alert('No audio was recorded. Please ensure microphone permissions are granted and try again.')
                      }
                    }
                  } catch (error) {
                    console.error('Recording error:', error)
                  hapticError()
                  // Still show modal if we have transcript
                  if (transcript && transcript.trim().length > 0) {
                    setShowCourseSelectionModal(true)
                  } else {
                    alert('Recording failed. Please try again.')
                  }
                }
                setIsStoppingRecording(false)
              }
            }}
            disabled={isStoppingRecording || isGeneratingNotes || isTranscribing}
            className={`rounded-full shadow-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-14 h-14 mb-[-8px] ${
              isRecording ? 'bg-red-600 hover:bg-red-700 animate-recording-pulse' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isStoppingRecording || isGeneratingNotes || isTranscribing ? (
              <FiLoader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Mic className="w-5 h-5 text-white" strokeWidth={1.5} />
            )}
            </button>
          </div>

          {/* Analytics */}
          <button
            onClick={() => { hapticSelection(); setActiveScreen('analytics') }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[48px] ${
              activeScreen === 'analytics' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <FiBarChart2 className="text-xl" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>

          {/* Classes */}
          <button
            onClick={() => { hapticSelection(); setActiveScreen('feed') }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[48px] ${
              activeScreen === 'feed' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <FiUsers className="text-xl" />
            <span className="text-[10px] font-medium">Classes</span>
          </button>
        </div>
      </nav>

      
      {/* Floating Recording Panel with Live Transcript */}
      {isRecording && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-in-up overflow-hidden">
            {/* Handle bar for mobile */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-8 pt-6 pb-6">
              {/* Recording Icon with gradient background */}
              <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white mb-6 ${!isPaused && 'recording-indicator'}`}>
                <FiMic className="w-14 h-14" />
              </div>

              {/* Timer and Status */}
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-mono mb-2">
                  {formatDuration(duration)}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
                </p>
              </div>

              {/* Live Transcript */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${!isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Live Transcript</span>
                </div>
                {transcript || interimTranscript ? (
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-500 dark:text-gray-400 italic"> {interimTranscript}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Start speaking... your words will appear here
                  </p>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex gap-3">
                <button
                  onClick={() => { hapticSelection(); isPaused ? resumeRecording() : pauseRecording() }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                >
                  {isPaused ? <><FiPlay className="w-5 h-5" /> Resume</> : <><FiPause className="w-5 h-5" /> Pause</>}
                </button>
                <button
                  onClick={async () => {
                    hapticImpact('medium')
                    setIsStoppingRecording(true)
                    try {
                      const result = await stopAndGenerateNotes()
                      if (result && result.transcript) {
                        hapticSuccess()
                        setShowCourseSelectionModal(true)
                      } else {
                        // Show modal anyway if we have any transcript
                        if (transcript && transcript.trim().length > 0) {
                          setShowCourseSelectionModal(true)
                        } else {
                          hapticError()
                          alert('No audio was recorded. Please try again.')
                        }
                      }
                    } catch (error) {
                      console.error('Recording error:', error)
                      if (transcript && transcript.trim().length > 0) {
                        setShowCourseSelectionModal(true)
                      } else {
                        hapticError()
                        alert('Recording failed. Please try again.')
                      }
                    }
                    setIsStoppingRecording(false)
                  }}
                  disabled={isStoppingRecording || isGeneratingNotes}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                >
                  <FiSquare className="w-5 h-5" />
                  {isStoppingRecording || isGeneratingNotes ? 'Processing...' : 'Stop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready to Record Confirmation Modal */}
      {showReadyToRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <Mic className="w-12 h-12 mx-auto text-blue-600" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Record?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your lecture will be saved with transcript and AI notes</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  hapticButton()
                  setShowReadyToRecordModal(false)
                }}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => {
                  console.log('[Dashboard] Yes button clicked, calling startRecording...')
                  hapticImpact('heavy')
                  startRecording()
                  console.log('[Dashboard] startRecording() called, closing modal')
                  setShowReadyToRecordModal(false)
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Permission Modal */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <FiMic className="w-8 h-8 text-orange-600 dark:text-orange-400" />
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

            {/* Action Button */}
            <button
              onClick={() => {
                hapticButton()
                setShowMicPermissionModal(false)
                reset()
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Delete Lecture Confirmation Modal */}
      {showDeleteLectureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <FiTrash2 className="w-12 h-12 mx-auto text-red-600" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Lecture?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone. All notes and data will be permanently removed.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  hapticButton()
                  setShowDeleteLectureModal(false)
                }}
                disabled={isDeletingLecture}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  hapticImpact('heavy')
                  if (selectedLecture) {
                    deleteLecture(selectedLecture)
                  }
                }}
                disabled={isDeletingLecture}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg btn-press font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeletingLecture ? (
                  <FiLoader className="animate-spin text-lg" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal for Recording */}
      {showCourseSelectionModal && (
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
                onChange={(e) => setLectureTitle(e.target.value)}
                placeholder={`Lecture ${new Date().toLocaleDateString()}`}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Course List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseForRecording(course.id)
                  }}
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
                onClick={() => {
                  setShowCourseSelectionModal(false)
                  setSelectedCourseForRecording(null)
                  setLectureTitle('')
                  reset()
                }}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedCourseForRecording) {
                    alert('Please select a course')
                    return
                  }
                  setIsSavingRecording(true)
                  try {
                    const { data: lecture, error: lectureError } = await (supabase as any)
                      .from('lectures')
                      .insert({
                        user_id: user!.id,
                        course_id: selectedCourseForRecording,
                        title: lectureTitle.trim() || `Lecture ${new Date().toLocaleDateString()}`,
                        duration: duration,
                        transcription_status: 'completed',
                        audio_url: '',
                      })
                      .select()
                      .single()

                    if (lectureError) {
                      throw lectureError
                    }

                    // Save transcript
                    if (transcript) {
                      await (supabase as any).from('transcripts').insert({
                        lecture_id: lecture.id,
                        user_id: user!.id,
                        content: transcript,
                      })
                    }

                    // Save notes
                    if (notes) {
                      await (supabase as any).from('notes').insert({
                        lecture_id: lecture.id,
                        user_id: user!.id,
                        content: notes,
                      })
                    }

                    // Refresh lectures list
                    const { data: updatedLectures } = await supabase
                      .from('lectures')
                      .select('*, courses(name, code, color)')
                      .eq('user_id', user!.id)
                      .order('created_at', { ascending: false })

                    if (updatedLectures) {
                      setLectures(updatedLectures)
                    }

                    // Record study activity for streak
                    recordActivity()
                    hapticSuccess()

                    setShowCourseSelectionModal(false)
                    setSelectedCourseForRecording(null)
                    setLectureTitle('')
                    reset()
                  } catch (error) {
                    alert('Failed to save recording. Please try again.')
                  } finally {
                    setIsSavingRecording(false)
                  }
                }}
                disabled={!selectedCourseForRecording || isSavingRecording}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg btn-press font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSavingRecording ? 'Saving...' : 'Save Lecture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Detail Modal */}
      {showStreakModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowStreakModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 animate-slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

            {/* Large streak display */}
            <div className="text-center mb-6">
              <StreakDisplay streak={streak} size="lg" />
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {streak === 0 ? 'Start Your Streak!' : `${streak} Day Streak!`}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {streak === 0
                  ? 'Record your first lecture today to begin your study streak.'
                  : streak < 7
                  ? 'Keep going! Record a lecture every day to build your streak.'
                  : streak < 30
                  ? "You're on fire! Keep up the great work."
                  : "Amazing dedication! You're a study champion!"}
              </p>
            </div>

            {/* Weekly calendar */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week</h3>
              <div className="flex justify-between">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const today = new Date().getDay()
                  const adjustedToday = today === 0 ? 6 : today - 1 // Convert to Mon=0 format
                  const isToday = i === adjustedToday
                  const isPast = i < adjustedToday
                  const isActive = (isPast && streak > 0) || (isToday && isActiveToday())

                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {day}
                      </span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-gradient-to-br from-orange-400 to-red-500'
                          : isToday
                          ? 'bg-blue-100 border-2 border-blue-400'
                          : 'bg-gray-200'
                      }`}>
                        {isActive ? (
                          <Fire size={20} weight="fill" className="text-white" />
                        ) : (
                          <span className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {isToday ? '?' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Milestones */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Milestones</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { days: 3, label: '3 days', emoji: '🌱' },
                  { days: 7, label: '1 week', emoji: '⭐' },
                  { days: 14, label: '2 weeks', emoji: '🌟' },
                  { days: 30, label: '1 month', emoji: '🏆' },
                  { days: 60, label: '2 months', emoji: '💎' },
                  { days: 100, label: '100 days', emoji: '👑' },
                ].map(({ days, label, emoji }) => (
                  <div
                    key={days}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl text-center ${
                      streak >= days
                        ? 'bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200'
                        : 'bg-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {streak >= days ? (
                      <span className="text-2xl">{emoji}</span>
                    ) : (
                      <Lock className="w-6 h-6 mx-auto text-gray-400" />
                    )}
                    <p className={`text-xs mt-1 font-medium ${streak >= days ? 'text-orange-700' : 'text-gray-500 dark:text-gray-400'}`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => { hapticButton(); setShowStreakModal(false) }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Keep Studying!
            </button>
          </div>
        </div>
      )}

      </div> {/* Close h-screen-safe */}
    </Suspense>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><FiLoader className="animate-spin h-8 w-8" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}
