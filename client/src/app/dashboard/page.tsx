'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiMic, FiPause, FiSquare, FiClock, FiFileText, FiFolder, FiSearch, FiPlus, FiSettings, FiPlay, FiLoader, FiAlertCircle, FiHome, FiBook, FiBarChart2, FiCheckCircle, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { Lightbulb, Mic } from 'lucide-react'
import { useLectureRecordingV2 } from '@/hooks/useLectureRecordingV2'
import { formatDuration } from '@/hooks/useHybridRecording'
import { useScreenTransition } from '@/hooks/useScreenTransition'
import { ScreenTransition } from '@/components/ScreenTransition'
import { AudioPlayer } from '@/components/AudioPlayer'
import { StreakDisplay, useStreak } from '@/components/StreakDisplay'
import { useAuth } from '@/contexts/AuthContext'
import { hapticButton, hapticSuccess, hapticError, hapticSelection, hapticImpact } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Lecture = Database['public']['Tables']['lectures']['Row']
type LectureWithCourse = Lecture & {
  courses?: {
    name: string
    code: string
    color: string
  } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
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
    startRecording,
    pauseRecording,
    resumeRecording,
    stopAndGenerateNotes,
    generateNotes,
    reset,
    recordingError,
    notesError,
    isSupported,
    isMobile: isRecordingMobile,
  } = useLectureRecordingV2()

  const [showTranscript, setShowTranscript] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [studyViewMode, setStudyViewMode] = useState<'notes' | 'flashcards' | 'learn'>('notes')
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([])
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

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
  const { animationType } = useScreenTransition(activeScreen as any)

  // Course selection modal state for floating record button
  const [showCourseSelectionModal, setShowCourseSelectionModal] = useState(false)
  const [selectedCourseForRecording, setSelectedCourseForRecording] = useState<string | null>(null)
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  const [showReadyToRecordModal, setShowReadyToRecordModal] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)

  // Library search state
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'week' | 'favorites'>('all')

  // Analytics filter state
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<'week' | 'month' | 'all'>('week')

  // Course management state
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showNewCourseModal, setShowNewCourseModal] = useState(false)

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

  // Handle screen query parameter for redirects
  useEffect(() => {
    const screen = searchParams.get('screen')
    if (screen && ['dashboard', 'library', 'analytics', 'feed'].includes(screen)) {
      setActiveScreen(screen as 'dashboard' | 'library' | 'analytics' | 'feed')
    } else {
      setActiveScreen('dashboard')
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
        console.error('Error fetching courses:', error)
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
        console.error('Error fetching lectures:', error)
      } else {
        setLectures(data || [])
      }
      setIsLoadingLectures(false)
    }

    fetchLectures()
  }, [user])

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
        console.error('Error fetching classes:', error)
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
            console.error('Error fetching notes:', notesError)
            setSelectedLectureNotes(null)
          } else {
            setSelectedLectureNotes(notesData?.content || null)
          }
        }
      } catch (error) {
        console.error('Error fetching lecture data:', error)
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
      console.error('Error creating course:', error)
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
      console.error('Error creating class:', error)
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
      console.error('Error joining class:', error)
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
          title: `Lecture ${new Date().toLocaleDateString()}`,
          duration: duration,
          transcription_status: 'completed',
          audio_url: '',
        })
        .select()
        .single()

      if (lectureError) {
        throw lectureError
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
          console.error('Error saving transcript:', transcriptError)
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

      // Show success message
      alert('✅ Lecture saved to library!')

      // Clear the current recording
      reset()
    } catch (error: any) {
      console.error('Error saving lecture:', error)
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
      console.error('Flashcard generation error:', err)
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
      console.error('Learn mode generation error:', err)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="text-blue-600 text-5xl mx-auto animate-spin mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (will be redirected)
  if (!user) {
    return null
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><FiLoader className="text-blue-600 text-5xl mx-auto animate-spin mb-4" /><p className="text-gray-600">Loading...</p></div></div>}>
      <div className="h-screen-safe bg-gray-50">
        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
                  className={`text-sm lg:text-base ${activeScreen === 'dashboard' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/library"
                  className={`text-sm lg:text-base ${activeScreen === 'library' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Library
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className={`text-sm lg:text-base ${activeScreen === 'analytics' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
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
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiSettings className="text-gray-600 text-lg sm:text-base" />
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
        <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white border-b border-gray-200 z-40 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + (showExplanation ? 1 : 0)) / learnModeQuestions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Question {currentQuestionIndex + 1} of {learnModeQuestions.length}</span>
              <span>{correctAnswers.size} correct</span>
            </div>
          </div>
        </div>
      )}

      {/* Main scrollable content area */}
      <div className={`flex-1 ${activeScreen === 'library' && selectedLecture && isLearnModeActive && learnModeQuestions.length > 0 ? 'overflow-hidden pt-40 sm:pt-44' : 'overflow-y-auto pt-32 sm:pt-36'}`}>
        <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-8 ${animationType ? (animationType.enter === 'slideRight' ? 'animate-slide-in-right' : animationType.enter === 'slideLeft' ? 'animate-slide-in-left' : 'animate-fade-in') : ''}`}>
        {/* Dashboard Screen */}
        {activeScreen === 'dashboard' && !selectedCourse && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Courses</h1>
                <p className="text-gray-600 text-sm mt-1">Organize your lectures by course</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg p-3 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Lectures</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiFileText className="text-blue-600 text-base sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Hours Recorded</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">48.5</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-purple-600 text-base sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">This Week</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">6</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiMic className="text-green-600 text-base sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Storage Used</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">2.4GB</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiFolder className="text-orange-600 text-base sm:text-xl" />
              </div>
            </div>
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
                  <p className="text-gray-500">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-200">
                  <FiBook className="text-gray-300 text-5xl mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No courses yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Create your first course to get started</p>
                  <button
                    onClick={() => setShowNewCourseModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-${course.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <FiBook className={`text-${course.color}-600 text-xl`} />
                      </div>
                      <span className="text-xs text-gray-500">{course.lectures} lectures</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {course.code && `${course.code} • `}
                      {course.professor || 'No professor set'}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Recent Lectures */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Lectures</h3>
                <button
                  onClick={() => setActiveScreen('library')}
                  className="text-blue-600 text-xs sm:text-sm font-medium hover:text-blue-700"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {isLoadingLectures ? (
                  <div className="text-center py-8 sm:py-12">
                    <FiLoader className="text-gray-400 text-3xl sm:text-4xl mx-auto animate-spin mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">Loading...</p>
                  </div>
                ) : lectures.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFileText className="text-gray-300 text-4xl mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No lectures recorded yet</p>
                  </div>
                ) : (
                  lectures.slice(0, 3).map((lecture) => {
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
                      <div key={lecture.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            lecture.transcription_status === 'completed' ? 'bg-green-100' :
                            lecture.transcription_status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                            <FiFileText className={`text-base sm:text-lg ${
                              lecture.transcription_status === 'completed' ? 'text-green-600' :
                              lecture.transcription_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{lecture.title}</div>
                            <div className="text-xs sm:text-sm text-gray-500">{dateDisplay} • {formattedDuration}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {lecture.transcription_status === 'completed' ? (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Ready
                            </span>
                          ) : lecture.transcription_status === 'failed' ? (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Failed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full hidden sm:inline">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowNewCourseModal(true)}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="text-white" />
                  <span className="font-medium text-white">New Course</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiSearch className="text-gray-600" />
                  <span className="font-medium text-gray-900">Search Notes</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiFolder className="text-gray-600" />
                  <span className="font-medium text-gray-900">Browse Library</span>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">2.4 GB used</span>
                  <span className="text-gray-600">of 10 GB</span>
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
          <div>
            {/* Course Header */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <span>←</span>
                <span>Back to Courses</span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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
                    <p className="text-gray-600">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setStudyViewMode('notes')}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base ${
                      studyViewMode === 'notes'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900'
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
                          : 'text-gray-600 hover:text-gray-900'
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
                          : 'text-gray-600 hover:text-gray-900'
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
                      <h3 className="text-xl font-bold text-gray-900 mb-4">AI Generated Notes</h3>
                      <div className="prose prose-sm max-w-none mb-4">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans">{notes}</pre>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={saveNotesToLibrary}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Save to Library
                        </button>
                        <button
                          onClick={generateFlashcards}
                          disabled={isGeneratingFlashcards}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                        </button>
                        <button
                          onClick={() => generateLearnMode()}
                          disabled={isGeneratingLearnMode}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
                              <div className="absolute w-full h-full backface-hidden bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 flex items-center justify-center text-center">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Question {index + 1}</p>
                                  <p className="text-black font-medium text-sm sm:text-base">{card.question}</p>
                                </div>
                              </div>
                              {/* Back of card */}
                              <div className="absolute w-full h-full backface-hidden bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 flex items-center justify-center text-center rotate-y-180">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Answer</p>
                                  <p className="text-black text-sm sm:text-base">{card.answer}</p>
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
                        <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Learn Mode</h3>
                              <p className="text-xs sm:text-sm text-gray-600">Round {round} • Question {currentQuestionIndex + 1} of {learnModeQuestions.length}</p>
                            </div>
                            <button
                              onClick={exitLearnMode}
                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs sm:text-sm whitespace-nowrap"
                            >
                              Exit Learn Mode
                            </button>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4 sm:mb-6">
                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + (showExplanation ? 1 : 0)) / learnModeQuestions.length) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600">
                              <span>{correctAnswers.size} correct</span>
                              <span>{answeredQuestions.size} / {learnModeQuestions.length} answered</span>
                            </div>
                          </div>

                          {/* Question Card */}
                          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md mb-4 sm:mb-6">
                            <div className="mb-3 sm:mb-2">
                              <span className="px-2.5 py-1 sm:px-3 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                {learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                              </span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                              {learnModeQuestions[currentQuestionIndex].question}
                            </h4>

                            {/* Answer Options */}
                            <div className="space-y-2 sm:space-y-3">
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
                                    className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
                                      showCorrect
                                        ? 'bg-green-50 border-green-500 text-green-900'
                                        : showIncorrect
                                        ? 'bg-red-50 border-red-500 text-red-900'
                                        : isSelected
                                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                                        : 'bg-white border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50'
                                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium break-words">{option}</span>
                                      {showCorrect && <span className="text-green-600 text-lg sm:text-xl flex-shrink-0">✓</span>}
                                      {showIncorrect && <span className="text-red-600 text-lg sm:text-xl flex-shrink-0">✗</span>}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>

                            {/* Explanation */}
                            {showExplanation && (
                              <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg ${
                                selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                  ? 'bg-green-50 border-2 border-green-200'
                                  : 'bg-red-50 border-2 border-red-200'
                              }`}>
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}>
                                    <span className="text-white text-base sm:text-lg">
                                      {selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer ? '✓' : '✗'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-semibold mb-1 text-sm sm:text-base ${
                                      selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                        ? 'text-green-900'
                                        : 'text-red-900'
                                    }`}>
                                      {selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer ? 'Correct!' : 'Incorrect'}
                                    </p>
                                    <p className={`text-xs sm:text-sm ${
                                      selectedAnswer === learnModeQuestions[currentQuestionIndex].correctAnswer
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                    }`}>
                                      {learnModeQuestions[currentQuestionIndex].explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-4 sm:mt-6 flex gap-3">
                              {!showExplanation ? (
                                <button
                                  onClick={handleSubmitAnswer}
                                  disabled={!selectedAnswer}
                                  className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                                >
                                  Submit Answer
                                </button>
                              ) : (
                                <button
                                  onClick={handleNextQuestion}
                                  className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
            {isSupported && isRecordingMobile && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-blue-800 text-sm font-medium mb-1">Mobile Recording Mode</p>
                    <p className="text-blue-700 text-sm">
                      On mobile, your audio will be transcribed after you stop recording. This may take a few moments.
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">All Lectures</h3>
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
                      <div key={lecture.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{lecture.title}</h4>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            lecture.transcription_status === 'completed' ? 'bg-green-100 text-green-700' :
                            lecture.transcription_status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
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

        {/* Library Screen */}
        {activeScreen === 'library' && !selectedLecture && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
              {librarySearchQuery && (
                <button
                  onClick={() => setLibrarySearchQuery('')}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
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
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Lectures
              </button>
              <button
                onClick={() => setLibraryFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  libraryFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setLibraryFilter('favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  libraryFilter === 'favorites'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Favorites
              </button>
            </div>

            {/* Lecture List */}
            <div className="space-y-3">
              {(() => {
                if (isLoadingLectures) {
                  return (
                    <div className="text-center py-12">
                      <FiLoader className="text-gray-400 text-4xl mx-auto animate-spin mb-4" />
                      <p className="text-gray-500">Loading lectures...</p>
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

                  // Filter by time/category
                  if (libraryFilter === 'week') {
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                    const lectureDate = new Date(lecture.created_at)
                    return matchesSearch && lectureDate >= oneWeekAgo
                  } else if (libraryFilter === 'favorites') {
                    // For now, favorites is not implemented, so return none
                    return false
                  }

                  return matchesSearch
                })

                if (filteredLectures.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <FiSearch className="text-gray-300 text-5xl mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No lectures found</h3>
                      <p className="text-sm text-gray-500">
                        {librarySearchQuery ? `No results for "${librarySearchQuery}"` : 'Your library is empty. Start recording your first lecture!'}
                      </p>
                    </div>
                  )
                }

                return filteredLectures.map((lecture) => {
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
                    <div
                      key={lecture.id}
                      onClick={() => setSelectedLecture(lecture.id)}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{lecture.title}</h3>
                          <p className="text-sm text-gray-500">{lecture.courses?.name || 'No course'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lecture.transcription_status === 'completed' ? 'bg-green-100 text-green-700' :
                          lecture.transcription_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {lecture.transcription_status === 'completed' ? 'Ready' :
                           lecture.transcription_status === 'failed' ? 'Failed' :
                           lecture.transcription_status === 'processing' ? 'Processing' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <FiClock className="mr-1" />
                          {formattedDuration}
                        </span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Library Lecture Detail View */}
        {activeScreen === 'library' && selectedLecture && !isLearnModeActive && (
          <div className="space-y-4 pb-20">
            {/* Back Button */}
            <button
              onClick={() => setSelectedLecture(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <span>←</span>
              <span>Back to Library</span>
            </button>

            {/* Lecture Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedLectureData?.title || 'Lecture'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Generated Notes</h3>
              {isLoadingLectureNotes ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="text-gray-400 text-4xl animate-spin" />
                </div>
              ) : selectedLectureNotes ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedLectureNotes}
                </div>
              ) : (
                <p className="text-gray-500">No notes available for this lecture.</p>
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
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingLearnMode ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiFileText />
                )}
                <span>{isGeneratingLearnMode ? 'Generating...' : 'Learn Mode'}</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium">
                <FiBook />
                <span>Study Flashcards</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <FiFileText className="text-blue-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-blue-900">145</p>
                <p className="text-xs text-blue-700">Notes</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <FiBook className="text-purple-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-purple-900">12</p>
                <p className="text-xs text-purple-700">Flashcards</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <FiCheckCircle className="text-green-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-green-900">95%</p>
                <p className="text-xs text-green-700">Accuracy</p>
              </div>
            </div>
          </div>
        )}

        {/* Library Learn Mode View */}
        {activeScreen === 'library' && selectedLecture && isLearnModeActive && learnModeQuestions.length > 0 && (
          <div className="space-y-4 pb-20">
            {/* Question Card */}
            <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
              <div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
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
                      className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                        showCorrect
                          ? 'bg-green-100 border-2 border-green-500 text-green-900'
                          : showIncorrect
                          ? 'bg-red-100 border-2 border-red-500 text-red-900'
                          : isSelected && !showExplanation
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                          : 'bg-gray-100 border-2 border-gray-300 text-gray-900 hover:bg-gray-200'
                      } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Explanation:</strong> {learnModeQuestions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!showExplanation && selectedAnswer ? (
                <button
                  onClick={handleSubmitAnswer}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Submit Answer
                </button>
              ) : showExplanation ? (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {currentQuestionIndex < learnModeQuestions.length - 1 ? 'Next Question' : 'Complete'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Analytics Screen */}
        {activeScreen === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

            {/* Time Period Selector */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setAnalyticsTimeFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setAnalyticsTimeFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setAnalyticsTimeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  analyticsTimeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <FiClock className="text-blue-600 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {(() => {
                          const totalSeconds = filteredAnalyticsLectures.reduce((sum, lec) => sum + lec.duration, 0)
                          const hours = Math.floor(totalSeconds / 3600)
                          const minutes = Math.floor((totalSeconds % 3600) / 60)
                          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                        })()}
                      </p>
                      <p className="text-xs text-blue-700">Study Time</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <FiFileText className="text-purple-600 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{filteredAnalyticsLectures.length}</p>
                      <p className="text-xs text-purple-700">Lectures</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <FiBook className="text-green-600 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">{courses.length}</p>
                      <p className="text-xs text-green-700">Courses</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <FiMic className="text-orange-600 text-xl" />
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {filteredAnalyticsLectures.length > 0
                          ? `${Math.round((filteredAnalyticsLectures.filter(l => l.transcription_status === 'completed').length / filteredAnalyticsLectures.length) * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-orange-700">Completed</p>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Study Streak */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Study Streak</h3>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="text-orange-600 text-2xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">7 Days</p>
                  <p className="text-sm text-gray-500">Keep it up!</p>
                </div>
              </div>
              <div className="flex space-x-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className={`w-full h-8 rounded ${i < 5 ? 'bg-green-500' : 'bg-gray-200'} mb-1`}></div>
                    <p className="text-xs text-gray-500">{day}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Courses */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Top Courses</h3>
              <div className="space-y-3">
                {courses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No courses yet</p>
                ) : (
                  courses.slice(0, 3).map((course) => {
                    const courseLectures = lectures.filter(l => l.course_id === course.id)
                    const totalHours = courseLectures.reduce((sum, l) => sum + l.duration, 0) / 3600
                    const maxHours = Math.max(...courses.map(c =>
                      lectures.filter(l => l.course_id === c.id).reduce((sum, l) => sum + l.duration, 0) / 3600
                    ), 1)

                    return (
                      <div key={course.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{course.name}</span>
                          <span className="text-sm text-gray-500">{totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${course.color}-500 h-2 rounded-full`}
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {lectures.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
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

                    return (
                      <div key={lecture.id} className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${statusColor}-100 rounded-full flex items-center justify-center`}>
                          <FiMic className={`text-${statusColor}-600 text-lg`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{statusText}</p>
                          <p className="text-xs text-gray-500">{lecture.title} • {timeDisplay}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Classes Screen - Join & Share Lectures */}
        {activeScreen === 'feed' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
                <p className="text-gray-600 text-sm mt-1">Manage your classes and share lectures with classmates</p>
              </div>
              <button
                onClick={() => {
                  setShowNewCourseModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center space-x-2 w-full sm:w-auto shrink-0"
              >
                <FiPlus className="w-4 h-4" />
                <span>New Class</span>
              </button>
            </div>

            {/* Your Classes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Classes</h3>
              {userClasses && userClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {userClasses.map((cls: any) => (
                    <div key={cls.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{cls.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{cls.professor} • {cls.code}</p>
                          {cls.description && (
                            <p className="text-sm text-gray-600 mt-2">{cls.description}</p>
                          )}
                        </div>
                        <div
                          className={`w-12 h-12 bg-${cls.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <FiUsers className={`text-${cls.color}-600`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FiUsers className="text-gray-600" />
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
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                  <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No classes yet</p>
                  <p className="text-gray-500 text-sm mt-1">Create a new class or join an existing one to get started</p>
                </div>
              )}
            </div>

            {/* Join a Class */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Join a Class</h3>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Code
                    </label>
                    <input
                      type="text"
                      value={joinClassCode}
                      onChange={(e) => setJoinClassCode(e.target.value)}
                      placeholder="e.g., CS101"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <button
                    onClick={handleJoinClass}
                    disabled={isJoiningClass || !joinClassCode.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoiningClass ? 'Joining...' : 'Join Class'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Course</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  value={newCourseData.name}
                  onChange={(e) => setNewCourseData({ ...newCourseData, name: e.target.value })}
                  placeholder="e.g., Data Structures and Algorithms"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  disabled={isCreatingCourse}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code
                </label>
                <input
                  type="text"
                  value={newCourseData.code}
                  onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value })}
                  placeholder="e.g., CS101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  disabled={isCreatingCourse}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professor
                </label>
                <input
                  type="text"
                  value={newCourseData.professor}
                  onChange={(e) => setNewCourseData({ ...newCourseData, professor: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  disabled={isCreatingCourse}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || 'john.doe@example.com'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
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
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{quality}</p>
                      <p className="text-sm text-gray-500">
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
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
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{level}</p>
                      <p className="text-sm text-gray-500">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ overflow: 'visible', paddingBottom: '10px' }}>
        <div className="flex items-center justify-between h-20 relative px-3" style={{ overflow: 'visible' }}>
          {/* Left Group - Home & Library */}
          <div className="flex items-center gap-10 ml-2">
            {/* Home */}
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center gap-0 transition-colors ${
                activeScreen === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <FiHome className="text-lg" />
              <span className="text-[10px] font-medium leading-tight">Home</span>
            </Link>

            {/* Library */}
            <Link
              href="/dashboard/library"
              className={`flex flex-col items-center justify-center gap-0 transition-colors ${
                activeScreen === 'library' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <FiBook className="text-lg" />
              <span className="text-[10px] font-medium leading-tight">Library</span>
            </Link>
          </div>

          {/* Center Record Button */}
          <button
            onClick={async () => {
              hapticImpact('medium')
              if (!isRecording) {
                setShowReadyToRecordModal(true)
              } else {
                setIsStoppingRecording(true)
                const result = await stopAndGenerateNotes()
                if (result && result.transcript && result.notes) {
                  hapticSuccess()
                  setShowCourseSelectionModal(true)
                } else {
                  hapticError()
                  alert('Error: Unable to generate notes. Please try again.')
                }
                setIsStoppingRecording(false)
              }
            }}
            disabled={isStoppingRecording || isGeneratingNotes || isTranscribing}
            className={`absolute rounded-full shadow-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            style={{ left: '50%', transform: 'translateX(-50%)', bottom: '10px', width: '56px', height: '56px' }}
          >
            {isStoppingRecording || isGeneratingNotes || isTranscribing ? (
              <FiLoader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Mic className="w-5 h-5 text-white" strokeWidth={1.5} />
            )}
          </button>

          {/* Right Group - Analytics & Settings */}
          <div className="flex items-center gap-10 mr-2">
            {/* Analytics */}
            <Link
              href="/dashboard/analytics"
              className={`flex flex-col items-center justify-center gap-0 transition-colors ${
                activeScreen === 'analytics' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <FiBarChart2 className="text-lg" />
              <span className="text-[10px] font-medium leading-tight">Analytics</span>
            </Link>

            {/* Classes */}
            <button
              onClick={() => { hapticSelection(); setActiveScreen('feed') }}
              className={`flex flex-col items-center justify-center gap-0 transition-colors ${
                activeScreen === 'feed' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <FiUsers className="text-lg" />
              <span className="text-[10px] font-medium leading-tight">Classes</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Ready to Record Confirmation Modal */}
      {showReadyToRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <Mic className="w-12 h-12 mx-auto text-blue-600" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900">Ready to Record?</h3>
              <p className="text-sm text-gray-600">Your lecture will be saved with transcript and AI notes</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  hapticButton()
                  setShowReadyToRecordModal(false)
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => {
                  hapticImpact('heavy')
                  startRecording()
                  setShowReadyToRecordModal(false)
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal for Recording */}
      {showCourseSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-6 pb-8 space-y-4 animate-slide-in-up">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Save Recording To Course</h3>
              <p className="text-sm text-gray-600">Select which course you want to save this lecture to</p>
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
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
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
                      <p className="font-semibold text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-500">{course.code}</p>
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
                  reset()
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
                        title: `Lecture ${new Date().toLocaleDateString()}`,
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

                    alert('✅ Lecture saved to ' + courses.find((c) => c.id === selectedCourseForRecording)?.name)
                    setShowCourseSelectionModal(false)
                    setSelectedCourseForRecording(null)
                    reset()
                  } catch (error) {
                    console.error('Error saving recording:', error)
                    alert('Failed to save recording. Please try again.')
                  } finally {
                    setIsSavingRecording(false)
                  }
                }}
                disabled={!selectedCourseForRecording || isSavingRecording}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-in-up"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {streak === 0 ? 'Start Your Streak!' : `${streak} Day Streak!`}
              </h2>
              <p className="text-gray-600">
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
                      <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
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
                          <span className="text-white text-lg">🔥</span>
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
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Milestones</h3>
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
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{streak >= days ? emoji : '🔒'}</span>
                    <p className={`text-xs mt-1 font-medium ${streak >= days ? 'text-orange-700' : 'text-gray-500'}`}>
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

      </div> {/* Close scrollable content wrapper */}
      </div>
    </Suspense>
  )
}
