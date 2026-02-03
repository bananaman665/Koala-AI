'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLectureRecordingV2 } from '@/hooks/useLectureRecordingV2'
import { formatDuration } from '@/hooks/useHybridRecording'
import { useScreenTransition } from '@/hooks/useScreenTransition'
import { ScreenTransition } from '@/components/ScreenTransition'
import { AudioPlayer } from '@/components/AudioPlayer'
import { StreakDisplay, useStreak } from '@/components/StreakDisplay'
import { OnboardingCarousel } from '@/components/OnboardingCarousel'
import { useAuth } from '@/contexts/AuthContext'
import { hapticButton, hapticSuccess, hapticError, hapticSelection, hapticImpact } from '@/lib/haptics'
import { soundSuccess } from '@/lib/sounds'
import { supabase, uploadAudioFile, reorganizeAudioFile } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { SkeletonLectureCard, SkeletonCourseCard, SkeletonStats } from '@/components/Skeleton'
import ReactMarkdown from 'react-markdown'
import { AnimatedCounter, AnimatedTimeCounter } from '@/components/AnimatedCounter'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { useLevel, XP_REWARDS } from '@/hooks/useLevel'
import { useAchievements, UserStats } from '@/hooks/useAchievements'
import { LevelBadge, LevelProgressModal, LevelUpModal } from '@/components/LevelBadge'
import { AchievementsModal, AchievementUnlockedModal } from '@/components/AchievementBadge'
import { LearnModeConfigModal, LearnModeConfig } from '@/components/LearnModeConfigModal'
import { FlashcardConfigModal, FlashcardConfig } from '@/components/FlashcardConfigModal'
import type { QuestionType } from '@/lib/claude'
import { AnalyticsScreen } from './components/AnalyticsScreen'
import { FeedScreen } from './components/FeedScreen'
import { FlashcardMode } from './components/FlashcardMode'
import { LearnMode } from './components/LearnMode'
import { DashboardHomeScreen } from './components/DashboardHomeScreen'
import { LibraryScreen } from './components/LibraryScreen'
import { ShareLectureToClassModal } from './components/ShareLectureToClassModal'
import { DailyGreeting } from '@/components/DailyGreeting'
import { Sidebar } from '@/components/Sidebar'
import { TopNavigationBar } from '@/components/TopNavigationBar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { GeneratingScreen } from '@/components/GeneratingScreen'

// Color classes for course icons (full class names for Tailwind to detect)
const courseColorClasses: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
}

// Color classes for lecture icons
const lectureColorClasses: Record<string, { bg: string; text: string; bgOpacity: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', bgOpacity: 'dark:bg-blue-500/15' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', bgOpacity: 'dark:bg-purple-500/15' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', bgOpacity: 'dark:bg-orange-500/15' },
}

const lectureColorKeys = Object.keys(lectureColorClasses)

// Storage limits for free tier
const MAX_LECTURES = 10
const MAX_COURSES = 5
const LECTURE_WARNING_THRESHOLD = 8 // Show warning at 80%

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
  const { totalXP, levelInfo, addXP, showLevelUp, newLevel, dismissLevelUp, xpHistory } = useLevel()
  const { 
    unlockedCount, 
    totalCount, 
    checkAchievements, 
    getAllAchievements, 
    newAchievement, 
    showAchievementModal, 
    dismissAchievement 
  } = useAchievements()
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [showAchievementsModal, setShowAchievementsModal] = useState(false)
  const [showDailyGreeting, setShowDailyGreeting] = useState(false)
  const [monthlyGoalRewarded, setMonthlyGoalRewarded] = useState(false)
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

  // Audio visualization state
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Function to get lecture color - using consistent blue for all lectures
  const getLectureColor = (_lectureId: string): string => {
    return 'blue'
  }

  // Audio visualization effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start audio visualization
      const startAudioVisualization = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          mediaStreamRef.current = stream
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          audioContextRef.current = audioContext
          
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 32
          analyserRef.current = analyser
          
          const source = audioContext.createMediaStreamSource(stream)
          source.connect(analyser)
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          
          const updateLevels = () => {
            if (!analyserRef.current) return
            
            analyserRef.current.getByteFrequencyData(dataArray)
            
            // Get 9 evenly spaced frequency bands and normalize to 0-32 range for height
            const levels: number[] = []
            const bandCount = 9
            const step = Math.floor(dataArray.length / bandCount)
            
            for (let i = 0; i < bandCount; i++) {
              const value = dataArray[i * step] || 0
              // Normalize: input 0-255, output 8-32 pixels
              const normalized = Math.max(8, (value / 255) * 32)
              levels.push(normalized)
            }
            
            setAudioLevels(levels)
            animationFrameRef.current = requestAnimationFrame(updateLevels)
          }
          
          updateLevels()
        } catch (err) {
          console.error('Failed to start audio visualization:', err)
        }
      }
      
      startAudioVisualization()
    } else {
      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      analyserRef.current = null
      setAudioLevels([0, 0, 0, 0, 0, 0, 0, 0, 0])
    }
    
    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording, isPaused])

  const [showTranscript, setShowTranscript] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [studyViewMode, setStudyViewMode] = useState<'notes' | 'flashcards' | 'learn'>('notes')
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([])
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [isFlashcardModeActive, setIsFlashcardModeActive] = useState(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)

  // Learn Mode State
  const [learnModeQuestions, setLearnModeQuestions] = useState<Array<{
    question: string;
    type: QuestionType;
    correctAnswer: string;
    options: string[];
    explanation: string;
    keywords?: string[];
    acceptableAnswers?: string[];
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
  const [showLearnModeConfigModal, setShowLearnModeConfigModal] = useState(false)
  const [showFlashcardConfigModal, setShowFlashcardConfigModal] = useState(false)
  const [writtenAnswer, setWrittenAnswer] = useState('')
  const [writtenAnswerFeedback, setWrittenAnswerFeedback] = useState<{ isCorrect: boolean; matchedKeywords: string[] } | null>(null)

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
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false)
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false)
  const [showFullScreenNotes, setShowFullScreenNotes] = useState(false)

  // Library search state
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'week'>('all')

  // Home page course filter state
  const [courseFilter, setCourseFilter] = useState<'active' | 'all' | 'favorites'>('all')

  // Course management state
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showNewCourseModal, setShowNewCourseModal] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [isExitingCourse, setIsExitingCourse] = useState(false)

  // Classes state
  const [userClasses, setUserClasses] = useState<any[]>([])
  const [joinClassCode, setJoinClassCode] = useState('')
  const [isJoiningClass, setIsJoiningClass] = useState(false)
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [showCreateClassScreen, setShowCreateClassScreen] = useState(false)
  const [newClassData, setNewClassData] = useState({
    name: '',
    code: '',
    professor: '',
    color: 'blue'
  })
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedClassData, setSelectedClassData] = useState<any>(null)
  const [classLectures, setClassLectures] = useState<any[]>([])
  const [isLoadingClassLectures, setIsLoadingClassLectures] = useState(false)
  const [isExitingClass, setIsExitingClass] = useState(false)
  const [showShareCourseModal, setShowShareCourseModal] = useState(false)
  const [selectedCourseToShare, setSelectedCourseToShare] = useState<string | null>(null)
  const [isSharingCourse, setIsSharingCourse] = useState(false)
  const [showShareLectureModal, setShowShareLectureModal] = useState(false)
  const [lectureToShare, setLectureToShare] = useState<string | null>(null)
  const [selectedClassForLecture, setSelectedClassForLecture] = useState<string | null>(null)
  const [isSharingLecture, setIsSharingLecture] = useState(false)
  const [newCourseData, setNewCourseData] = useState({
    name: '',
    code: '',
    professor: '',
    subject: '',
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

  // Edit notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotesContent, setEditedNotesContent] = useState<string>('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesWasEdited, setNotesWasEdited] = useState(false)

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

  // Check if user should see daily greeting
  useEffect(() => {
    if (user && !isCheckingAuth) {
      const today = new Date().toDateString()
      const lastGreetingDate = localStorage.getItem('daily_greeting_date')

      // Show greeting if they haven't seen it today
      if (lastGreetingDate !== today) {
        setShowDailyGreeting(true)
        localStorage.setItem('daily_greeting_date', today)
      }
    }
  }, [user, isCheckingAuth])

  // Load course filter preference from localStorage
  useEffect(() => {
    if (user) {
      const savedFilter = localStorage.getItem('koala_course_filter_preference')
      if (savedFilter === 'active' || savedFilter === 'all' || savedFilter === 'favorites') {
        setCourseFilter(savedFilter as 'active' | 'all' | 'favorites')
      }
    }
  }, [user])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setShowOnboarding(false)
  }

  const handleCourseFilterChange = (filter: 'active' | 'all' | 'favorites') => {
    setCourseFilter(filter)
    localStorage.setItem('koala_course_filter_preference', filter)
    hapticSelection?.()
  }

  // Filter courses based on activity (courses with lectures in last 7 days)
  const getFilteredCourses = () => {
    if (courseFilter === 'all') {
      return courses
    }

    if (courseFilter === 'favorites') {
      // Favorites: courses marked as favorites
      return courses.filter(course => (course as any).is_favorite === true)
    }

    // Active: courses with lectures in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeCourseIds = new Set(
      lectures
        .filter(lecture => new Date(lecture.created_at) >= sevenDaysAgo)
        .map(lecture => lecture.course_id)
        .filter(Boolean)
    )

    return courses.filter(course => activeCourseIds.has(course.id))
  }

  // Check and award XP for monthly goal completion
  useEffect(() => {
    if (!user || lectures.length === 0) return

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`
    const rewardedKey = `koala_monthly_goal_rewarded_${monthKey}`
    const wasRewarded = localStorage.getItem(rewardedKey) === 'true'

    if (wasRewarded) {
      setMonthlyGoalRewarded(true)
      return
    }

    // Calculate current month's goal progress
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthIndex = now.getMonth()

    const goalTargets = [
      { id: 'lectures', target: 10, getCurrent: () => lectures.filter(l => new Date(l.created_at) >= startOfMonth).length },
      { id: 'study_hours', target: 8, getCurrent: () => Math.floor(lectures.filter(l => new Date(l.created_at) >= startOfMonth).reduce((sum, l) => sum + (l.duration || 0), 0) / 3600) },
      { id: 'courses', target: 3, getCurrent: () => courses.filter(c => new Date(c.created_at) >= startOfMonth).length },
      { id: 'streak', target: 15, getCurrent: () => streak },
    ]

    const currentGoal = goalTargets[monthIndex % goalTargets.length]
    const isCompleted = currentGoal.getCurrent() >= currentGoal.target

    if (isCompleted && !monthlyGoalRewarded) {
      addXP(XP_REWARDS.MONTHLY_GOAL, 'Monthly Goal Completed')
      localStorage.setItem(rewardedKey, 'true')
      setMonthlyGoalRewarded(true)
    }
  }, [user, lectures, courses, streak, monthlyGoalRewarded, addXP])

  // Handle screen query parameter for redirects
  useEffect(() => {
    const screen = searchParams.get('screen')
    if (screen && ['dashboard', 'library', 'analytics', 'feed'].includes(screen)) {
      setActiveScreen(prev => {
        const newScreen = screen as 'dashboard' | 'library' | 'analytics' | 'feed'
        return prev !== newScreen ? newScreen : prev
      })
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
      } else if (!data || data.length === 0) {
        // Create a default course for new users
        // @ts-ignore - Supabase typing issue
        const { data: newCourse, error: createError } = await (supabase as any)
          .from('courses')
          .insert([{
            user_id: user!.id,
            name: 'My Course',
            code: '100',
            professor: 'Prof. Smith',
            category: 'General',
            color: 'blue',
            lectures: 0,
            total_hours: 0,
            last_updated: new Date().toISOString()
          }])
          .select()
          .single()

        if (!createError && newCourse) {
          setCourses([newCourse])
        } else {
          setCourses([])
        }
      } else {
        setCourses(data)
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
        .select('*, courses(name, code, color, subject)')
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

  // Fetch user classes
  useEffect(() => {
    if (!user?.id) {
      setUserClasses([])
      return
    }

    async function fetchClasses() {
      try {
        const response = await fetch('/api/classes', {
          headers: {
            'x-user-id': user?.id || '',
          },
        })
        const result = await response.json()
        if (result.success) {
          setUserClasses(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error)
      }
    }

    fetchClasses()
  }, [user])

  // Delete class function
  const deleteClass = async (classId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      })
      const result = await response.json()
      if (result.success) {
        setUserClasses(prev => prev.filter(c => c.id !== classId))
      } else {
        console.error('Failed to delete class:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete class:', error)
    }
  }

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

  // Delete course function
  const deleteCourse = async (courseId: string) => {
    if (!user?.id) return

    try {
      // First delete all lectures in this course
      await supabase
        .from('lectures')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', user.id)

      // Then delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', user.id)

      if (error) {
        hapticError()
        toast.error('Failed to delete course')
      } else {
        hapticSuccess()
        toast.success('Course deleted')
        setCourses(prev => prev.filter(c => c.id !== courseId))
        // Also remove lectures from this course from state
        setLectures(prev => prev.filter(l => l.course_id !== courseId))
      }
    } catch (error) {
      hapticError()
      toast.error('Failed to delete course')
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

  // Fetch selected lecture data, notes, quiz, and flashcards
  useEffect(() => {
    if (!selectedLecture || !lectures.length) {
      setSelectedLectureData(null)
      setSelectedLectureNotes(null)
      setLearnModeQuestions([])
      setFlashcards([])
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

            // Save last viewed lecture for "Continue Studying" on home page
            if (notesData?.content) {
              const notesPreview = notesData.content
                .replace(/^#+\s*/gm, '') // Remove markdown headers
                .replace(/\*\*/g, '') // Remove bold markers
                .replace(/^-\s*/gm, '• ') // Convert dashes to bullets
                .split('\n')
                .filter((line: string) => line.trim())
                .slice(0, 3)
                .join(' ')
                .slice(0, 150)

              localStorage.setItem('koala_last_viewed_lecture', JSON.stringify({
                lectureId: selectedLecture,
                notesPreview: notesPreview || 'Continue where you left off...',
                timestamp: Date.now()
              }))
            }
          }

          // Fetch saved quiz if exists
          const { data: quizData } = await (supabase as any)
            .from('quizzes')
            .select('questions')
            .eq('lecture_id', selectedLecture)
            .single()

          if (quizData?.questions) {
            setLearnModeQuestions(quizData.questions)
          } else {
            setLearnModeQuestions([])
          }

          // Fetch saved flashcards if exists
          const { data: flashcardData } = await (supabase as any)
            .from('flashcard_decks')
            .select('cards')
            .eq('lecture_id', selectedLecture)
            .single()

          if (flashcardData?.cards) {
            setFlashcards(flashcardData.cards)
          } else {
            setFlashcards([])
          }
        }
      } catch (error) {
        setSelectedLectureData(null)
        setSelectedLectureNotes(null)
        setLearnModeQuestions([])
        setFlashcards([])
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
      // Check course limit before inserting
      const { count: courseCount } = await (supabase as any)
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (courseCount !== null && courseCount >= MAX_COURSES) {
        hapticError()
        toast.error(`Course limit reached! You can only create ${MAX_COURSES} courses on the free plan. Please delete some courses to continue.`)
        setIsCreatingCourse(false)
        return
      }

      // @ts-ignore - Supabase typing issue with Database generic
      const { data, error } = await (supabase as any)
        .from('courses')
        .insert([{
          user_id: user.id,
          name: newCourseData.name.trim(),
          code: newCourseData.code.trim(),
          professor: newCourseData.professor.trim(),
          subject: newCourseData.subject,
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
        subject: 'computer_science',
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
          subject: 'computer_science',
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
      toast.error('Please enter a class code')
      return
    }
    if (joinClassCode.trim().length < 6) {
      toast.error('Class code must be at least 6 characters long')
      return
    }
    if (!user?.id) {
      toast.error('You must be logged in to join a class')
      return
    }

    setIsJoiningClass(true)
    try {
      // First, find the class by code
      const searchResponse = await fetch(`/api/classes/search?code=${encodeURIComponent(joinClassCode.trim())}`, {
        headers: {
          'x-user-id': user.id,
        },
      })

      // If search endpoint doesn't exist, try to join directly using the code as class ID
      // For now, we'll show an error since we need the class ID to join
      const searchResult = await searchResponse.json()

      if (!searchResult.success || !searchResult.data) {
        hapticError()
        toast.error('Class not found. Please check the code and try again.')
        setIsJoiningClass(false)
        return
      }

      const classId = searchResult.data.id

      const response = await fetch(`/api/classes/${classId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      })

      const result = await response.json()
      if (result.success) {
        hapticSuccess()
        toast.success(`Successfully joined ${searchResult.data.name}!`)
        // Refresh the classes list
        const classesResponse = await fetch(`/api/classes`, {
          headers: {
            'x-user-id': user.id,
          },
        })
        const classesResult = await classesResponse.json()
        if (classesResult.success) {
          setUserClasses(classesResult.data || [])
        }
        setJoinClassCode('')
      } else if (result.error?.code === 'ALREADY_MEMBER') {
        hapticError()
        toast.error('You are already a member of this class')
      } else {
        hapticError()
        toast.error(result.error?.message || 'Failed to join class')
      }
    } catch (error: any) {
      hapticError()
      toast.error(`Failed to join class: ${error.message}`)
    } finally {
      setIsJoiningClass(false)
    }
  }

  // Create a new class
  const handleCreateNewClass = async () => {
    // Validation
    if (!newClassData.name.trim()) {
      toast.error('Please enter a class name')
      return
    }
    if (!newClassData.code.trim()) {
      toast.error('Please enter a class code')
      return
    }
    if (newClassData.code.trim().length < 6) {
      toast.error('Class code must be at least 6 characters long')
      return
    }
    if (!newClassData.professor.trim()) {
      toast.error('Please enter a professor name')
      return
    }
    if (!user?.id) {
      toast.error('You must be logged in to create a class')
      return
    }

    setIsCreatingClass(true)
    try {
      const response = await fetch(`/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: newClassData.name.trim(),
          code: newClassData.code.trim(),
          professor: newClassData.professor.trim(),
          color: newClassData.color,
        }),
      })

      const result = await response.json()
      if (result.success) {
        hapticSuccess()
        toast.success('Class created successfully!')
        setUserClasses(prev => [result.data, ...prev])

        // Reset form
        setNewClassData({
          name: '',
          code: '',
          professor: '',
          color: 'blue'
        })
        setShowCreateClassScreen(false)
      } else {
        hapticError()
        toast.error(result.error?.message || 'Failed to create class')
      }
    } catch (error: any) {
      hapticError()
      toast.error(`Failed to create class: ${error.message}`)
    } finally {
      setIsCreatingClass(false)
    }
  }

  // View class details and lectures
  const handleViewClass = async (classId: string) => {
    setSelectedClass(classId)
    setIsLoadingClassLectures(true)
    try {
      // Fetch class details
      const classResponse = await fetch(`/api/classes/${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      const classResult = await classResponse.json()
      if (classResult.success) {
        setSelectedClassData(classResult.data)
      }

      // Fetch lectures in this class
      const lecturesResponse = await fetch(`/api/classes/${classId}/lectures`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      const lecturesResult = await lecturesResponse.json()
      if (lecturesResult.success) {
        setClassLectures(lecturesResult.data || [])
      }
    } catch (error: any) {
      toast.error(`Failed to load class details: ${error.message}`)
    } finally {
      setIsLoadingClassLectures(false)
    }
  }

  // Leave a class
  const handleLeaveClass = async () => {
    if (!selectedClass) return

    setIsExitingClass(true)
    try {
      const response = await fetch(`/api/classes/${selectedClass}/leave`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      const result = await response.json()
      if (result.success) {
        hapticSuccess()
        toast.success('You have left the class')
        // Refresh classes list
        const classesResponse = await fetch(`/api/classes`, {
          headers: {
            'x-user-id': user?.id || '',
          },
        })
        const classesResult = await classesResponse.json()
        if (classesResult.success) {
          setUserClasses(classesResult.data || [])
        }
        setSelectedClass(null)
        setSelectedClassData(null)
      } else {
        hapticError()
        toast.error(result.error?.message || 'Failed to leave class')
      }
    } catch (error: any) {
      hapticError()
      toast.error(`Failed to leave class: ${error.message}`)
    } finally {
      setIsExitingClass(false)
    }
  }

  // Share a course's lectures to a class
  const handleShareCourse = async () => {
    if (!selectedClass || !selectedCourseToShare) {
      toast.error('Please select a course to share')
      return
    }

    setIsSharingCourse(true)
    try {
      // Get all lectures in the selected course
      const courseId = selectedCourseToShare
      const lecturesInCourse = lectures.filter(l => l.course_id === courseId)

      if (lecturesInCourse.length === 0) {
        toast.error('This course has no lectures to share')
        setIsSharingCourse(false)
        return
      }

      // Update each lecture to add the class_id
      const courseData = courses.find(c => c.id === courseId)
      const updatePromises = lecturesInCourse.map(lecture => {
        return (supabase as any)
          .from('lectures')
          .update({ class_id: selectedClass })
          .eq('id', lecture.id)
      })

      await Promise.all(updatePromises)

      hapticSuccess()
      toast.success(`Shared "${courseData?.name}" (${lecturesInCourse.length} lectures) to the class!`)

      // Refresh class lectures
      const lecturesResponse = await fetch(`/api/classes/${selectedClass}/lectures`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      const lecturesResult = await lecturesResponse.json()
      if (lecturesResult.success) {
        setClassLectures(lecturesResult.data || [])
      }

      setShowShareCourseModal(false)
      setSelectedCourseToShare(null)
    } catch (error: any) {
      hapticError()
      toast.error(`Failed to share course: ${error.message}`)
    } finally {
      setIsSharingCourse(false)
    }
  }

  // Check if a lecture is shared to any class
  const isLectureShared = (lectureId: string): boolean => {
    const lecture = lectures.find(l => l.id === lectureId)
    return lecture?.class_id !== null && lecture?.class_id !== undefined
  }

  // Get current class ID for a lecture
  const getLectureClassId = (lectureId: string): string | null => {
    const lecture = lectures.find(l => l.id === lectureId)
    return lecture?.class_id || null
  }

  // Show share lecture modal
  const handleShowShareLectureModal = (lectureId: string) => {
    setLectureToShare(lectureId)
    const currentClassId = getLectureClassId(lectureId)
    setSelectedClassForLecture(currentClassId)
    setShowShareLectureModal(true)
  }

  // Share a lecture to a class
  const handleShareLecture = async () => {
    if (!lectureToShare) {
      toast.error('No lecture selected')
      return
    }

    // If selectedClassForLecture is null, we're unsharing
    const isUnsharing = selectedClassForLecture === null
    const currentClassId = getLectureClassId(lectureToShare)

    // Confirmation if overwriting an existing share
    if (!isUnsharing && currentClassId && currentClassId !== selectedClassForLecture) {
      const shouldContinue = confirm(
        'This lecture is already shared to another class. Do you want to move it to the selected class?'
      )
      if (!shouldContinue) return
    }

    setIsSharingLecture(true)
    try {
      const response = await fetch(`/api/lectures/${lectureToShare}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ classId: selectedClassForLecture }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to share lecture')
      }

      hapticSuccess()
      toast.success(result.message || (isUnsharing ? 'Lecture unshared from class' : 'Lecture shared to class'))

      // Update local state
      setLectures(prevLectures =>
        prevLectures.map(lecture =>
          lecture.id === lectureToShare
            ? { ...lecture, class_id: selectedClassForLecture }
            : lecture
        )
      )

      // If we're viewing a class and this lecture was/is in it, refresh class lectures
      if (selectedClass && (selectedClass === currentClassId || selectedClass === selectedClassForLecture)) {
        const lecturesResponse = await fetch(`/api/classes/${selectedClass}/lectures`, {
          headers: {
            'x-user-id': user?.id || '',
          },
        })
        const lecturesResult = await lecturesResponse.json()
        if (lecturesResult.success) {
          setClassLectures(lecturesResult.data || [])
        }
      }

      // Close modal and reset state
      setShowShareLectureModal(false)
      setLectureToShare(null)
      setSelectedClassForLecture(null)
    } catch (error: any) {
      hapticError()
      toast.error(`Failed to share lecture: ${error.message}`)
    } finally {
      setIsSharingLecture(false)
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
      // Get audio URL first (if audio is available) before creating lecture
      let audioUrl: string | null = null
      let uploadedExtension: string | null = null
      let tempUploadId: string | null = null
      const audioBlobToUpload = capturedAudioBlobRef.current
      console.log('[SaveLecture] audioBlob from ref:', audioBlobToUpload ? `Blob size: ${audioBlobToUpload.size}, type: ${audioBlobToUpload.type}` : 'null')

      if (audioBlobToUpload) {
        try {
          console.log('[SaveLecture] Uploading audio to storage with temp ID...')
          // Use a temporary ID for initial upload
          tempUploadId = `temp-${Date.now()}`
          const uploadResult = await uploadAudioFile(user.id, tempUploadId, audioBlobToUpload)
          audioUrl = uploadResult.url
          uploadedExtension = uploadResult.extension
          console.log('[SaveLecture] Audio uploaded, URL:', audioUrl)
        } catch (audioError) {
          console.error('[SaveLecture] Failed to upload audio:', audioError)
          toast.error(`Warning: Audio file could not be uploaded. ${(audioError as Error).message}`)
          // Continue saving even if audio upload fails
        }
      } else {
        console.log('[SaveLecture] No audioBlob available to upload')
      }

      // Count existing lectures for sequential naming
      let defaultTitle = `Lecture ${new Date().toLocaleDateString()}`
      try {
        const { count: existingLectureCount } = await (supabase as any)
          .from('lectures')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        if (existingLectureCount !== null) {
          defaultTitle = `Lecture ${existingLectureCount + 1}`
        }
      } catch (countError) {
        console.error('[SaveLecture] Failed to count lectures:', countError)
      }

      // Create a lecture record with the audio URL (now with actual URL or null)
      // @ts-ignore - Supabase typing issue with Database generic
      const { data: lecture, error: lectureError } = await (supabase as any)
        .from('lectures')
        .insert({
          user_id: user.id,
          course_id: selectedCourse,
          title: lectureTitle.trim() || defaultTitle,
          duration: duration,
          transcription_status: 'completed',
          audio_url: audioUrl,
        })
        .select()
        .single()

      if (lectureError) {
        throw lectureError
      }

      // If we uploaded audio with a temp ID, reorganize the file to use the actual lecture ID
      if (audioUrl && tempUploadId && uploadedExtension) {
        try {
          console.log('[SaveLecture] Reorganizing audio file with lecture ID...')
          const newAudioUrl = await reorganizeAudioFile(
            user.id,
            tempUploadId,
            lecture.id,
            uploadedExtension
          )

          console.log('[SaveLecture] New audio URL:', newAudioUrl)

          // Update lecture with the correct audio URL
          const { error: updateError } = await (supabase as any)
            .from('lectures')
            .update({ audio_url: newAudioUrl })
            .eq('id', lecture.id)

          if (updateError) {
            console.error('[SaveLecture] Failed to update lecture with new audio URL:', updateError)
          } else {
            console.log('[SaveLecture] Lecture updated with reorganized audio URL successfully')
          }
        } catch (reorganizeError) {
          console.error('[SaveLecture] Failed to reorganize audio file:', reorganizeError)
          // File is still accessible at the temp URL, so this is non-critical
        }
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
        .select('*, courses(name, code, color, subject)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (updatedLectures) {
        setLectures(updatedLectures)
      }

      // Record study activity for streak
      recordActivity()

      // Award XP for recording lecture (based on duration)
      console.log('[SaveLecture] Awarding XP...')
      const durationMinutes = Math.floor(duration / 60)
      const lectureXP = XP_REWARDS.RECORD_LECTURE_BASE + (durationMinutes * XP_REWARDS.RECORD_LECTURE_PER_MINUTE)
      console.log('[SaveLecture] Lecture XP:', lectureXP, `(${durationMinutes} minutes)`)
      addXP(lectureXP, `Recorded ${durationMinutes}min lecture`)

      // First lecture bonus
      const isFirstLecture = lectures.length === 0
      if (isFirstLecture) {
        console.log('[SaveLecture] First lecture bonus! +', XP_REWARDS.FIRST_LECTURE_BONUS)
        addXP(XP_REWARDS.FIRST_LECTURE_BONUS, 'First lecture bonus!')
      }

      console.log('[SaveLecture] Notes bonus +', XP_REWARDS.GENERATE_NOTES)
      addXP(XP_REWARDS.GENERATE_NOTES, 'Generated notes')

      // Check achievements
      const totalRecordingTime = lectures.reduce((sum, l) => sum + l.duration, 0) + duration
      const hour = new Date().getHours()
      checkAchievements({
        totalLectures: lectures.length + 1,
        totalCourses: courses.length,
        totalRecordingTime,
        notesGenerated: 1,
        quizzesCompleted: 0,
        perfectQuizzes: 0,
        currentStreak: streak,
        level: levelInfo.level,
        earlyBirdLectures: hour < 8 ? 1 : 0,
        nightOwlLectures: hour >= 22 ? 1 : 0,
      }, addXP)

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

  const generateFlashcards = async (contentToUse?: string, config?: FlashcardConfig) => {
    const notesContent = contentToUse || selectedLectureNotes || notes

    if (!notesContent) {
      setFlashcardsError('No notes available to generate flashcards from')
      return
    }

    try {
      setIsGeneratingFlashcards(true)
      setFlashcardsError(null)
      setShowFlashcardConfigModal(false)

      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: notesContent,
          numberOfCards: config?.numberOfCards || 10,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      setFlashcards(data.flashcards)

      // Save flashcards to database if we have a selected lecture
      if (selectedLecture && user?.id) {
        const flashcardConfig = {
          numberOfCards: config?.numberOfCards || 10,
        }

        // Upsert - update if exists, insert if not
        await (supabase as any)
          .from('flashcard_decks')
          .upsert({
            lecture_id: selectedLecture,
            user_id: user.id,
            cards: data.flashcards,
            config: flashcardConfig,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'lecture_id,user_id',
          })
      }

      // If in library view, activate flashcard mode
      if (activeScreen === 'library' && selectedLecture) {
        setCurrentFlashcardIndex(0)
        setIsFlashcardModeActive(true)
      }
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

  const generateLearnMode = async (contentToUse?: string, config?: LearnModeConfig) => {
    const notesContent = contentToUse || selectedLectureNotes || notes

    if (!notesContent) {
      setLearnModeError('No notes available to generate learn mode from')
      return
    }

    try {
      setIsGeneratingLearnMode(true)
      setLearnModeError(null)
      setShowLearnModeConfigModal(false)

      const response = await fetch('/api/ai/generate-learn-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: notesContent,
          numberOfQuestions: config?.numberOfQuestions || 10,
          questionTypes: config?.questionTypes || ['multiple_choice', 'true_false'],
          difficulty: config?.difficulty || 'medium',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate learn mode questions')
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid questions response:', data)
        throw new Error('API returned invalid questions format')
      }

      if (data.questions.length === 0) {
        throw new Error('API generated zero questions')
      }

      setLearnModeQuestions(data.questions)

      // Save quiz to database if we have a selected lecture
      if (selectedLecture && user?.id) {
        const quizConfig = {
          numberOfQuestions: config?.numberOfQuestions || 10,
          questionTypes: config?.questionTypes || ['multiple_choice', 'true_false'],
          difficulty: config?.difficulty || 'medium',
        }

        // Upsert - update if exists, insert if not
        await (supabase as any)
          .from('quizzes')
          .upsert({
            lecture_id: selectedLecture,
            user_id: user.id,
            questions: data.questions,
            config: quizConfig,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'lecture_id,user_id',
          })
      }

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
    const currentQuestion = learnModeQuestions[currentQuestionIndex]
    const questionType = currentQuestion.type

    // For multiple choice and true/false
    if (questionType === 'multiple_choice' || questionType === 'true_false') {
      if (!selectedAnswer || showExplanation) return
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer

      setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))

      if (isCorrect) {
        setCorrectAnswers(prev => new Set(prev).add(currentQuestionIndex))
      } else {
        setIncorrectQuestions(prev => [...prev, currentQuestionIndex])
      }

      setShowExplanation(true)
      return
    }

    // For written answers
    if (questionType === 'written') {
      if (!writtenAnswer.trim() || showExplanation) return

      // Check for keyword matches
      const keywords = currentQuestion.keywords || []
      const lowerAnswer = writtenAnswer.toLowerCase()
      const matchedKeywords = keywords.filter(kw =>
        lowerAnswer.includes(kw.toLowerCase())
      )

      // Consider correct if at least 50% of keywords are present
      const isCorrect = keywords.length === 0 || matchedKeywords.length >= Math.ceil(keywords.length * 0.5)

      setWrittenAnswerFeedback({ isCorrect, matchedKeywords })
      setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))

      if (isCorrect) {
        setCorrectAnswers(prev => new Set(prev).add(currentQuestionIndex))
      } else {
        setIncorrectQuestions(prev => [...prev, currentQuestionIndex])
      }

      setShowExplanation(true)
      return
    }

    // For fill in the blank
    if (questionType === 'fill_in_blank') {
      if (!writtenAnswer.trim() || showExplanation) return

      const correctAnswer = currentQuestion.correctAnswer.toLowerCase().trim()
      const acceptableAnswers = currentQuestion.acceptableAnswers?.map(a => a.toLowerCase().trim()) || []
      const userAnswer = writtenAnswer.toLowerCase().trim()

      const isCorrect = userAnswer === correctAnswer || acceptableAnswers.includes(userAnswer)

      setWrittenAnswerFeedback({ isCorrect, matchedKeywords: [] })
      setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))

      if (isCorrect) {
        setCorrectAnswers(prev => new Set(prev).add(currentQuestionIndex))
      } else {
        setIncorrectQuestions(prev => [...prev, currentQuestionIndex])
      }

      setShowExplanation(true)
    }
  }

  const handleNextQuestion = () => {
    setShowExplanation(false)
    setSelectedAnswer(null)
    setWrittenAnswer('')
    setWrittenAnswerFeedback(null)

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
        
        // Award XP for completing quiz
        addXP(XP_REWARDS.COMPLETE_QUIZ, 'Completed Learn Mode quiz')
        
        // Check if perfect score (all correct on first round)
        const isPerfect = round === 1
        
        // Check achievements
        checkAchievements({
          totalLectures: lectures.length,
          totalCourses: courses.length,
          totalRecordingTime: lectures.reduce((sum, l) => sum + l.duration, 0),
          notesGenerated: 0,
          quizzesCompleted: 1,
          perfectQuizzes: isPerfect ? 1 : 0,
          currentStreak: streak,
          level: levelInfo.level,
          earlyBirdLectures: 0,
          nightOwlLectures: 0,
        }, addXP)
        
        hapticSuccess()
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
    setWrittenAnswer('')
    setWrittenAnswerFeedback(null)
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg">⏳</span>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="text-center"><span className="text-lg">⏳</span><p className="text-gray-600 dark:text-gray-400">Loading...</p></div></div>}>
      <div className="h-screen-safe bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Onboarding Carousel for first-time users */}
        {showOnboarding && (
          <OnboardingCarousel
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingComplete}
          />
        )}

        {/* Daily Greeting - Shows once per day */}
        {showDailyGreeting && (
          <DailyGreeting
            streak={streak}
            totalXP={totalXP}
            lecturesCompletedToday={lectures.filter(l => {
              const lectureDate = new Date(l.created_at).toDateString()
              const today = new Date().toDateString()
              return lectureDate === today
            }).length}
            onDismiss={() => setShowDailyGreeting(false)}
          />
        )}

        {/* Top Navigation - Mobile Only - Hidden in flashcard/quiz mode */}
        {!isFlashcardModeActive && !isLearnModeActive && (
        <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1a2235] border-b border-gray-200 dark:border-white/[0.08] z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Left side - Combined Level & Streak */}
            <div className="flex items-center gap-0">
              {/* Level button */}
              <button
                onClick={() => { hapticButton(); setShowLevelModal(true) }}
                className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-1 rounded-full transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{levelInfo.level}</span>
                </div>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{levelInfo.name}</span>
              </button>

              <span className="text-gray-300 dark:text-gray-600">·</span>

              {/* Streak button */}
              <button
                onClick={() => { hapticButton(); setShowStreakModal(true) }}
                className="flex items-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-1 rounded-full transition-colors"
              >
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streak} day{streak !== 1 ? 's' : ''}</span>
              </button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
              {/* Settings */}
              <Link
                href="/settings"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <span className="text-lg">⚙️</span>
              </Link>

              {/* Avatar */}
              <Link
                href="/profile"
                className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
              >
                {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
              </Link>
            </div>
          </div>
        </div>
      </nav>
        )}

      {/* Desktop Top Navigation Bar - Hidden in flashcard/quiz mode */}
      {!isFlashcardModeActive && !isLearnModeActive && (
        <TopNavigationBar
          onStartRecording={() => setShowReadyToRecordModal(true)}
          levelInfo={levelInfo}
          streak={streak}
          userEmail={user?.email}
          isRecording={isRecording}
          isStoppingRecording={isStoppingRecording}
          isGeneratingNotes={isGeneratingNotes}
          isTranscribing={isTranscribing}
          onShowLevelModal={() => { hapticButton(); setShowLevelModal(true) }}
          onShowStreakModal={() => { hapticButton(); setShowStreakModal(true) }}
        />
      )}

      {/* Desktop Left Sidebar - Hidden in flashcard/quiz mode */}
      {!isFlashcardModeActive && !isLearnModeActive && (() => {
        const recentLectures = [...lectures]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        return (
          <LeftSidebar
            activeScreen={activeScreen}
            onNavigate={(screen) => {
              hapticSelection()
              setActiveScreen(screen)
            }}
            courseFilter={courseFilter}
            onCourseFilterChange={handleCourseFilterChange}
            recentLectures={recentLectures}
            onSelectLecture={(lectureId) => {
              hapticSelection()
              setSelectedLecture(lectureId)
              setActiveScreen('library')
            }}
            onToggleFavorite={(lectureId) => {
              const lectureToUpdate = lectures.find(l => l.id === lectureId)
              if (lectureToUpdate) {
                // Optimistic UI update
                const updatedLectures = lectures.map(l =>
                  l.id === lectureId ? { ...l, is_favorite: !l.is_favorite } : l
                )
                setLectures(updatedLectures)

                // Update database
                ;(supabase.from('lectures') as any)
                  .update({ is_favorite: !lectureToUpdate.is_favorite })
                  .eq('id', lectureId)
                  .then(({ error }: any) => {
                    if (error) {
                      // Revert on error
                      setLectures(lectures)
                      toast.error('Failed to update favorite')
                    }
                  })
              }
            }}
          />
        )
      })()}

      {/* Desktop Floating Action Button - Record - Hidden in flashcard/quiz mode */}
      {!isFlashcardModeActive && !isLearnModeActive && (
        <button
          onClick={() => setShowReadyToRecordModal(true)}
          disabled={isRecording || isStoppingRecording || isGeneratingNotes || isTranscribing}
          className="hidden lg:flex fixed bottom-8 right-8 w-16 h-16 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full items-center justify-center shadow-2xl shadow-purple-500/30 z-50 transition-all hover:scale-110"
          style={{
            animation: isRecording ? 'none' : 'pulse-slow 2s ease-in-out infinite'
          }}
        >
          <Mic className="w-7 h-7" strokeWidth={2} />
        </button>
      )}

      {/* Main scrollable content area */}
      <div className="flex-1 min-h-0 relative overflow-y-auto lg:overflow-hidden lg:pt-16 lg:ml-64 hide-scrollbar-mobile">
        {/* Dashboard Screen */}
        {(activeScreen === 'dashboard' || (isTransitioning && previousScreen === 'dashboard')) && (
          <ScreenTransition
            animationType={activeScreen === 'dashboard' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'dashboard'}
          >
            {!selectedCourse && (
              <DashboardHomeScreen
                user={user}
                lectures={lectures}
                courses={getFilteredCourses()}
                selectedCourse={selectedCourse}
                streak={streak}
                isLoadingCourses={isLoadingCourses}
                courseFilter={courseFilter}
                onCourseFilterChange={handleCourseFilterChange}
                onStartRecording={() => setShowReadyToRecordModal(true)}
                onCreateCourse={() => setShowNewCourseModal(true)}
                onSelectCourse={(courseId) => setSelectedCourse(courseId)}
                onDeleteCourse={deleteCourse}
                onSelectLecture={setSelectedLecture}
                onNavigateToLibrary={() => {
                  setActiveScreen('library')
                }}
                onToggleFavorite={(lectureId) => {
                  const lectureToUpdate = lectures.find(l => l.id === lectureId)
                  if (lectureToUpdate) {
                    // Optimistic UI update
                    const updatedLectures = lectures.map(l =>
                      l.id === lectureId ? { ...l, is_favorite: !l.is_favorite } : l
                    )
                    setLectures(updatedLectures)

                    // Update database
                    ;(supabase.from('lectures') as any)
                      .update({ is_favorite: !lectureToUpdate.is_favorite })
                      .eq('id', lectureId)
                      .then(({ error }: any) => {
                        if (error) {
                          // Revert on error
                          setLectures(lectures)
                          toast.error('Failed to update favorite')
                        }
                      })
                  }
                }}
              />
            )}

            {/* Course Detail View with Recording */}
            {selectedCourse && (
            <div className="overflow-y-auto bg-gray-50 dark:bg-[#111827] h-full relative">
              <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8 pt-24 sm:pt-28 larger-phone:pt-28 larger-phone:sm:pt-32`}>
        {activeScreen === 'dashboard' && (() => {
          const course = courses.find(c => c.id === selectedCourse)
          const courseLectures = lectures.filter(l => l.course_id === selectedCourse)
          const lectureCount = courseLectures.length

          if (!course) return null

          return (
          <div key={course.id} className={`${isExitingCourse ? 'animate-zoom-out' : 'animate-zoom-in'}`}>
            {/* Back Button */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setIsExitingCourse(true)
                  setTimeout(() => {
                    setSelectedCourse(null)
                    setIsExitingCourse(false)
                  }, 200)
                }}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 active:scale-95 transition-all font-medium"
              >
                <span className="text-lg">◀</span>
                <span>Back</span>
              </button>
            </div>

            {/* Course Info Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/[0.06] mb-6">
              <div className="flex items-center gap-4">
                {/* Subject Icon */}
                {(() => {
                  const subjectIcons: Record<string, any> = {
                    math: "🧮",
                    science: "🧪",
                    chemistry: "🧬",
                    biology: "🔬",
                    physics: "⚛️",
                    genetics: "🧬",
                    engineering: "⚡",
                    literature: "📚",
                    other: "📚",
                  }
                  const subjectColors: Record<string, { bg: string; text: string }> = {
                    math: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
                    science: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
                    chemistry: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
                    biology: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
                    physics: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400' },
                    genetics: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
                    engineering: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' },
                    literature: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
                    other: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
                  }
                  const subject = (course as any).subject?.toLowerCase() || 'other'
                  const SubjectIcon = subjectIcons[subject] || BookOpen
                  const colors = subjectColors[subject] || subjectColors.other
                  return (
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <SubjectIcon className={`w-7 h-7 ${colors.text}`} />
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {course.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}</span>
                    {course.professor && (
                      <>
                        <span>•</span>
                        <span>{course.professor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recording Interface (when recording) */}
            {isRecording && (
              <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-200 dark:border-white/[0.06] p-6 mb-6">
                <div className="text-center">
                  <div className="mb-6">
                    <div className={`w-32 h-32 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4 ${!isPaused && 'recording-indicator'}`}>
                      <span className="text-lg">🎤</span>
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
                      {isPaused ? <><span className="text-lg">▶️</span>Resume</> : <><span className="text-lg">⏸</span>Pause</>}
                    </button>
                    <button
                      onClick={() => stopAndGenerateNotes()}
                      disabled={isGeneratingNotes}
                      className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Square className="inline mr-2" />
                      {isGeneratingNotes ? 'Generating...' : 'Stop & Generate'}
                    </button>
                  </div>

                  {(transcript || interimTranscript) && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-200 dark:border-white/[0.06] mb-6 overflow-hidden">
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
                <div className="p-4 font-['Inter',sans-serif]">
                  {/* Notes Tab */}
                  {studyViewMode === 'notes' && (
                    <div>
                      <div className="prose prose-sm max-w-none dark:prose-invert 
                        prose-h2:text-base prose-h2:font-semibold prose-h2:text-gray-800 dark:prose-h2:text-gray-100 prose-h2:mb-2.5 prose-h2:mt-5 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-gray-200/60 dark:prose-h2:border-gray-700/60 prose-h2:tracking-wide prose-h2:uppercase prose-h2:text-[13px]
                        prose-h3:text-sm prose-h3:font-medium prose-h3:text-gray-700 dark:prose-h3:text-gray-200 prose-h3:mb-2 prose-h3:mt-4
                        prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-2 prose-p:text-[13px]
                        prose-ul:my-1.5 prose-ul:ml-0 prose-ul:pl-4
                        prose-li:my-0.5 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:text-[13px] prose-li:leading-snug prose-li:marker:text-gray-400 dark:prose-li:marker:text-gray-500
                        prose-strong:text-gray-800 dark:prose-strong:text-white prose-strong:font-medium
                        [&>*:first-child]:mt-0
                        [&_ul]:list-disc [&_ul]:space-y-0.5
                        mb-4
                      ">
                        <ReactMarkdown>{notes || ''}</ReactMarkdown>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={saveNotesToLibrary}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700">
                          Save to Library
                        </button>
                        <button
                          onClick={() => setShowFlashcardConfigModal(true)}
                          disabled={isGeneratingFlashcards}
                          className="px-4 py-2 bg-purple-600 text-white btn-press rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isGeneratingFlashcards ? 'Generating...' : 'Flashcards'}
                        </button>
                        <button
                          onClick={() => setShowLearnModeConfigModal(true)}
                          disabled={isGeneratingLearnMode}
                          className="px-4 py-2 bg-indigo-600 text-white btn-press rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isGeneratingLearnMode ? 'Generating...' : 'Learn Mode'}
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
                        <div className="mt-4 p-4 sm:p-6 bg-green-50 dark:bg-[#0B1220] border-2 border-green-200 dark:border-[#1E293B] rounded-xl shadow-lg dark:shadow-2xl">
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
                                className="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300"
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
                              <span className={`px-2.5 py-1 sm:px-3 text-xs font-semibold rounded-full border border-transparent ${
                                learnModeQuestions[currentQuestionIndex].type === 'multiple_choice'
                                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 dark:border-purple-500/30'
                                  : learnModeQuestions[currentQuestionIndex].type === 'true_false'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 dark:border-blue-500/30'
                                  : learnModeQuestions[currentQuestionIndex].type === 'written'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 dark:border-amber-500/30'
                                  : 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 dark:border-teal-500/30'
                              }`}>
                                {learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ? 'Multiple Choice'
                                  : learnModeQuestions[currentQuestionIndex].type === 'true_false' ? 'True / False'
                                  : learnModeQuestions[currentQuestionIndex].type === 'written' ? 'Written Answer'
                                  : 'Fill in the Blank'}
                              </span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-[#F1F5F9] mb-4 sm:mb-6 leading-relaxed">
                              {learnModeQuestions[currentQuestionIndex].question}
                            </h4>

                            {/* Multiple Choice / True-False Options */}
                            {(learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ||
                              learnModeQuestions[currentQuestionIndex].type === 'true_false') && (
                              <div className="space-y-3 sm:space-y-4">
                                {(learnModeQuestions[currentQuestionIndex].type === 'true_false' && (!learnModeQuestions[currentQuestionIndex].options || learnModeQuestions[currentQuestionIndex].options.length === 0)
                                  ? ['True', 'False']
                                  : learnModeQuestions[currentQuestionIndex].options
                                ).map((option, idx) => {
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
                            )}

                            {/* Written Answer Input */}
                            {learnModeQuestions[currentQuestionIndex].type === 'written' && (
                              <div className="space-y-4">
                                <textarea
                                  value={writtenAnswer}
                                  onChange={(e) => setWrittenAnswer(e.target.value)}
                                  disabled={showExplanation}
                                  placeholder="Type your answer here..."
                                  rows={4}
                                  className={`w-full p-4 rounded-xl border-2 text-sm sm:text-base resize-none transition-all ${
                                    showExplanation
                                      ? writtenAnswerFeedback?.isCorrect
                                        ? 'bg-green-50 dark:bg-green-500/15 border-green-500 dark:border-green-400'
                                        : 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400'
                                      : 'bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] focus:border-blue-500 dark:focus:border-blue-400'
                                  } text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-gray-500`}
                                />
                                {showExplanation && writtenAnswerFeedback && (
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Key concepts found:</span>
                                    {writtenAnswerFeedback.matchedKeywords.length > 0 ? (
                                      writtenAnswerFeedback.matchedKeywords.map((kw, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs rounded-full">
                                          {kw}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-amber-600 dark:text-amber-400">None detected</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fill in the Blank Input */}
                            {learnModeQuestions[currentQuestionIndex].type === 'fill_in_blank' && (
                              <div className="space-y-4">
                                <input
                                  type="text"
                                  value={writtenAnswer}
                                  onChange={(e) => setWrittenAnswer(e.target.value)}
                                  disabled={showExplanation}
                                  placeholder="Type the missing word or phrase..."
                                  className={`w-full p-4 rounded-xl border-2 text-sm sm:text-base transition-all ${
                                    showExplanation
                                      ? writtenAnswerFeedback?.isCorrect
                                        ? 'bg-green-50 dark:bg-green-500/15 border-green-500 dark:border-green-400'
                                        : 'bg-red-50 dark:bg-red-500/15 border-red-500 dark:border-red-400'
                                      : 'bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] focus:border-blue-500 dark:focus:border-blue-400'
                                  } text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-gray-500`}
                                />
                                {showExplanation && !writtenAnswerFeedback?.isCorrect && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Correct answer: <span className="font-semibold text-green-600 dark:text-green-400">{learnModeQuestions[currentQuestionIndex].correctAnswer}</span>
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Explanation */}
                            {showExplanation && (() => {
                              const currentQ = learnModeQuestions[currentQuestionIndex]
                              const isCorrectAnswer = currentQ.type === 'multiple_choice' || currentQ.type === 'true_false'
                                ? selectedAnswer === currentQ.correctAnswer
                                : writtenAnswerFeedback?.isCorrect || false

                              return (
                                <div className={`mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl ${
                                  isCorrectAnswer
                                    ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/40'
                                    : currentQ.type === 'written'
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/40'
                                    : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/40'
                                }`}>
                                  <div className="flex items-start gap-3 sm:gap-4">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      isCorrectAnswer
                                        ? 'bg-green-500'
                                        : currentQ.type === 'written'
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    }`}>
                                      <span className="text-white text-lg sm:text-xl font-bold">
                                        {isCorrectAnswer ? '✓' : currentQ.type === 'written' ? '!' : '✗'}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <p className={`font-semibold mb-1 text-sm sm:text-base ${
                                        isCorrectAnswer
                                          ? 'text-green-900 dark:text-green-200'
                                          : currentQ.type === 'written'
                                          ? 'text-amber-900 dark:text-amber-200'
                                          : 'text-red-900 dark:text-red-200'
                                      }`}>
                                        {isCorrectAnswer ? 'Correct!' : currentQ.type === 'written' ? 'Review your answer' : 'Incorrect'}
                                      </p>
                                      <p className={`text-sm sm:text-base leading-relaxed ${
                                        isCorrectAnswer
                                          ? 'text-green-800 dark:text-green-300'
                                          : currentQ.type === 'written'
                                          ? 'text-amber-800 dark:text-amber-300'
                                          : 'text-red-800 dark:text-red-300'
                                      }`}>
                                        {currentQ.explanation}
                                      </p>
                                      {(currentQ.type === 'written' || currentQ.type === 'fill_in_blank') && !isCorrectAnswer && (
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                          <span className="font-medium">Expected answer:</span> {currentQ.correctAnswer}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* Action Buttons */}
                            <div className="mt-5 sm:mt-6 flex gap-3">
                              {!showExplanation ? (
                                <button
                                  onClick={handleSubmitAnswer}
                                  disabled={
                                    (learnModeQuestions[currentQuestionIndex].type === 'multiple_choice' ||
                                     learnModeQuestions[currentQuestionIndex].type === 'true_false')
                                      ? !selectedAnswer
                                      : !writtenAnswer.trim()
                                  }
                                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white btn-press rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                                >
                                  Submit Answer
                                </button>
                              ) : (
                                <button
                                  onClick={handleNextQuestion}
                                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl btn-press font-semibold transition-all text-sm sm:text-base"
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
                  <span className="text-lg">⚠️</span>
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
                  <span className="text-lg">⚠️</span>
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
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium mb-1">Recording Error:</p>
                    <p className="text-red-700 text-sm">{recordingError}</p>
                  </div>
                </div>
              </div>
            )}
            {!isSupported && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
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
                  <span className="text-lg">⏳</span>
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
            <div className="mt-6">
              {(() => {
                const courseLectures = lectures.filter(l => l.course_id === selectedCourse)

                if (courseLectures.length === 0) {
                  return (
                    <>
                      {/* Empty State */}
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                          <span className="text-lg">🎤</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No lectures yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                          Record your first lecture and let AI generate smart notes for you.
                        </p>
                        <button
                          onClick={() => setShowReadyToRecordModal(true)}
                          disabled={isRecording || isStoppingRecording || isGeneratingNotes || isTranscribing}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
                        >
                          <span className="text-lg">🎤</span>
                          Record First Lecture
                        </button>
                      </div>

                      {/* Danger Zone */}
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Danger Zone</h3>
                        <button
                          onClick={() => {
                            hapticButton()
                            setShowDeleteCourseModal(true)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 active:scale-[0.98] transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Course
                        </button>
                      </div>
                    </>
                  )
                }

                return (
                  <>
                    {/* Record New Lecture Button */}
                    <button
                      onClick={() => setShowReadyToRecordModal(true)}
                      disabled={isRecording || isStoppingRecording || isGeneratingNotes || isTranscribing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <span className="text-lg">🎤</span>
                      Record New Lecture
                    </button>

                    {/* Lectures List */}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lectures</h2>
                    <div className="space-y-3 mb-6">
                      {courseLectures.map((lecture) => {
                        const durationMinutes = Math.floor(lecture.duration / 60)

                        return (
                          <button
                            key={lecture.id}
                            onClick={() => {
                              hapticSelection()
                              setSelectedLecture(lecture.id)
                              setSelectedCourse(null)
                              setActiveScreen('library')
                            }}
                            className="w-full bg-white dark:bg-[#1E293B] rounded-2xl p-4 text-left hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-[0.98] transition-all border border-gray-100 dark:border-white/[0.06] group"
                          >
                            <div className="flex items-center gap-4">
                              {(() => {
                                const color = getLectureColor(lecture.id)
                                const colorClass = lectureColorClasses[color] || lectureColorClasses.blue
                                return (
                                  <div className={`w-12 h-12 ${colorClass.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    <Play className={`text-lg ${colorClass.text}`} />
                                  </div>
                                )
                              })()}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {lecture.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {durationMinutes > 0 ? `${durationMinutes} min` : 'Just now'}
                                </p>
                              </div>
                              <span className="text-lg">▶</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Danger Zone</h3>
                      <button
                        onClick={() => {
                          hapticButton()
                          setShowDeleteCourseModal(true)
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 active:scale-[0.98] transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Course
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
          )
        })()}
              </div>
            </div>
            )}
          </ScreenTransition>
        )}

        {/* Library Screen */}
        {(activeScreen === 'library' || (isTransitioning && previousScreen === 'library')) && (
          <ScreenTransition
            animationType={activeScreen === 'library' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'library'}
          >
            <LibraryScreen
              lectures={lectures}
              selectedLecture={selectedLecture}
              selectedLectureData={selectedLectureData}
              selectedLectureNotes={selectedLectureNotes}
              flashcards={flashcards}
              learnModeQuestions={learnModeQuestions}
              isLoadingLectures={isLoadingLectures}
              isLoadingLectureNotes={isLoadingLectureNotes}
              isGeneratingFlashcards={isGeneratingFlashcards}
              isGeneratingLearnMode={isGeneratingLearnMode}
              isSavingNotes={isSavingNotes}
              librarySearchQuery={librarySearchQuery}
              libraryFilter={libraryFilter}
              isLearnModeActive={isLearnModeActive}
              isFlashcardModeActive={isFlashcardModeActive}
              isEditingNotes={isEditingNotes}
              isExitingLecture={isExitingLecture}
              editedNotesContent={editedNotesContent}
              notesWasEdited={notesWasEdited}
              currentQuestionIndex={currentQuestionIndex}
              selectedAnswer={selectedAnswer}
              showExplanation={showExplanation}
              onLibrarySearchQueryChange={setLibrarySearchQuery}
              onLibraryFilterChange={setLibraryFilter}
              onSelectLecture={setSelectedLecture}
              onDeleteLecture={deleteLecture}
              onExitLecture={() => {
                setIsExitingLecture(true)
                setTimeout(() => {
                  setSelectedLecture(null)
                  setIsExitingLecture(false)
                  setIsEditingNotes(false)
                  setEditedNotesContent('')
                  setNotesWasEdited(false)
                }, 200)
              }}
              onEditNotesChange={setEditedNotesContent}
              onSaveNotes={async () => {
                if (!selectedLecture || !user?.id) return
                setIsSavingNotes(true)
                try {
                  const { error } = await (supabase as any)
                    .from('notes')
                    .update({ content: editedNotesContent })
                    .eq('lecture_id', selectedLecture)
                    .eq('user_id', user.id)
                  
                  if (error) throw error
                  
                  hapticSuccess()
                  toast.success('Notes saved successfully')
                  setSelectedLectureNotes(editedNotesContent)
                  setNotesWasEdited(true)
                  setIsEditingNotes(false)
                } catch (error) {
                  console.error('Error saving notes:', error)
                  hapticError()
                  toast.error('Failed to save notes')
                } finally {
                  setIsSavingNotes(false)
                }
              }}
              onCancelEditNotes={() => {
                setIsEditingNotes(false)
                setEditedNotesContent('')
              }}
              onStartEditNotes={() => {
                setEditedNotesContent(selectedLectureNotes || '')
                setIsEditingNotes(true)
              }}
              onShowLearnModeConfig={() => setShowLearnModeConfigModal(true)}
              onShowFlashcardConfig={() => setShowFlashcardConfigModal(true)}
              onShowDeleteModal={() => setShowDeleteLectureModal(true)}
              onSetIsFlashcardModeActive={setIsFlashcardModeActive}
              onSetCurrentFlashcardIndex={setCurrentFlashcardIndex}
              onSetIsLearnModeActive={setIsLearnModeActive}
              onAnswerSelect={handleAnswerSelect}
              onSubmitAnswer={handleSubmitAnswer}
              onNextQuestion={handleNextQuestion}
              onExitLearnMode={exitLearnMode}
              onShowViewNotesModal={() => setShowFullScreenNotes(true)}
            />
          </ScreenTransition>
        )}

        {/* Analytics Screen */}
        {(activeScreen === 'analytics' || (isTransitioning && previousScreen === 'analytics')) && (
          <ScreenTransition
            animationType={activeScreen === 'analytics' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'analytics'}
          >
            <AnalyticsScreen
              lectures={lectures}
              courses={courses}
              streak={streak}
              isActiveToday={isActiveToday}
              onLectureClick={(lectureId) => {
                setSelectedLecture(lectureId)
                setActiveScreen('library')
              }}
            />
          </ScreenTransition>
        )}

        {/* Classes Screen - Join & Share Lectures */}
        {(activeScreen === 'feed' || (isTransitioning && previousScreen === 'feed')) && (
          <ScreenTransition
            animationType={activeScreen === 'feed' ? (animationType?.enter || 'fade') : (animationType?.exit || 'fade')}
            isActive={activeScreen === 'feed'}
          >
            <FeedScreen
              userClasses={userClasses}
              joinClassCode={joinClassCode}
              isJoiningClass={isJoiningClass}
              onJoinClassCodeChange={setJoinClassCode}
              onJoinClass={handleJoinClass}
              onCreateNewClass={() => setShowCreateClassScreen(true)}
              onDeleteClass={deleteClass}
              onViewClass={handleViewClass}
            />
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
                  Subject *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    disabled={isCreatingCourse}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      {newCourseData.subject ? (
                        <>
                          {(() => {
                            const subjectIcons: Record<string, any> = {
                              math: "🧮",
                              science: "🧪",
                              chemistry: "🧬",
                              biology: "🔬",
                              physics: "⚛️",
                              genetics: "🧬",
                              engineering: "⚡",
                              literature: "📚",
                              other: "📚",
                            }
                            const SubjectIcon = subjectIcons[newCourseData.subject] || BookOpen
                            return <SubjectIcon className="w-4 h-4" />
                          })()}
                          <span className="capitalize">{newCourseData.subject}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Select a subject</span>
                      )}
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSubjectDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {[
                        { value: 'math', label: 'Math', icon: "🧮" },
                        { value: 'science', label: 'Science', icon: "🧪" },
                        { value: 'chemistry', label: 'Chemistry', icon: "🧬" },
                        { value: 'biology', label: 'Biology', icon: "🔬" },
                        { value: 'physics', label: 'Physics', icon: "⚛️" },
                        { value: 'genetics', label: 'Genetics', icon: "🧬" },
                        { value: 'engineering', label: 'Engineering', icon: "⚡" },
                        { value: 'literature', label: 'Literature', icon: "📚" },
                        { value: 'other', label: 'Other', icon: "📚" },
                      ].map((subject) => (
                        <button
                          key={subject.value}
                          type="button"
                          onClick={() => {
                            setNewCourseData({ ...newCourseData, subject: subject.value })
                            setShowSubjectDropdown(false)
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left ${
                            newCourseData.subject === subject.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <subject.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-900 dark:text-white">{subject.label}</span>
                          {newCourseData.subject === subject.value && (
                            <span className="text-lg">✅</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewCourseModal(false)
                    setShowSubjectDropdown(false)
                    setNewCourseData({
                      name: '',
                      code: '',
                      professor: '',
                      subject: '',
                      color: 'blue',
                      category: 'Computer Science'
                    })
                  }}
                  disabled={isCreatingCourse}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={isCreatingCourse || !newCourseData.subject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg btn-press hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Screen - Full Screen Modal */}
      {showCreateClassScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Class</h2>

            <div className="space-y-4">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassData.name}
                  onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  disabled={isCreatingClass}
                />
              </div>

              {/* Class Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Code
                </label>
                <input
                  type="text"
                  value={newClassData.code}
                  onChange={(e) => setNewClassData({ ...newClassData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS101AB"
                  minLength={6}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 uppercase"
                  disabled={isCreatingClass}
                />
              </div>

              {/* Professor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Professor
                </label>
                <input
                  type="text"
                  value={newClassData.professor}
                  onChange={(e) => setNewClassData({ ...newClassData, professor: e.target.value })}
                  placeholder="e.g., Dr. Jane Smith"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  disabled={isCreatingClass}
                />
              </div>

              {/* Color Theme */}
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
                        setNewClassData({ ...newClassData, color })
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

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    hapticButton()
                    setShowCreateClassScreen(false)
                    setNewClassData({
                      name: '',
                      code: '',
                      professor: '',
                      color: 'blue'
                    })
                  }}
                  disabled={isCreatingClass}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewClass}
                  disabled={isCreatingClass || !newClassData.name.trim() || !newClassData.code.trim() || newClassData.code.length < 6 || !newClassData.professor.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingClass ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Detail View Modal */}
      {selectedClass && selectedClassData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClassData.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedClassData.professor}</p>
              </div>
              <button
                onClick={() => {
                  hapticButton()
                  setSelectedClass(null)
                  setSelectedClassData(null)
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Class Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Class Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedClassData.code}</p>
                  <button
                    onClick={() => {
                      hapticButton()
                      navigator.clipboard.writeText(selectedClassData.code)
                      toast.success('Code copied to clipboard!')
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Members</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedClassData.class_memberships?.length || 0}</p>
              </div>
            </div>

            {/* Share Course Section (Owner Only) */}
            {selectedClassData.owner_id === user?.id && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    hapticButton()
                    setShowShareCourseModal(true)
                  }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Share Course to Class
                </button>
              </div>
            )}

            {/* Lectures in Class */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shared Lectures</h3>
              {isLoadingClassLectures ? (
                <div className="text-center py-6">
                  <div className="animate-spin text-blue-600 dark:text-blue-400 mb-2">⟳</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading lectures...</p>
                </div>
              ) : classLectures.length > 0 ? (
                <div className="space-y-2">
                  {classLectures.map((lecture: any) => (
                    <div key={lecture.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{lecture.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {lecture.duration ? `${Math.round(lecture.duration / 60)} min` : 'Duration unknown'}
                        </p>
                      </div>
                      {lecture.audio_url && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                          Has Audio
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No lectures shared yet</p>
                </div>
              )}
            </div>

            {/* Leave Class Button (Non-Owner) */}
            {selectedClassData.owner_id !== user?.id && (
              <button
                onClick={() => {
                  hapticButton()
                  if (confirm('Are you sure you want to leave this class?')) {
                    handleLeaveClass()
                  }
                }}
                disabled={isExitingClass}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
              >
                {isExitingClass ? 'Leaving...' : 'Leave Class'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Course to Class Modal */}
      {showShareCourseModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share Course</h2>
              <button
                onClick={() => {
                  hapticButton()
                  setShowShareCourseModal(false)
                  setSelectedCourseToShare(null)
                }}
                disabled={isSharingCourse}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a course to share all its lectures with this class
            </p>

            {/* Course List */}
            <div className="space-y-2 mb-6">
              {courses && courses.length > 0 ? (
                courses.map((course: any) => {
                  const lectureCount = lectures.filter(l => l.course_id === course.id).length
                  return (
                    <button
                      key={course.id}
                      onClick={() => {
                        hapticSelection()
                        setSelectedCourseToShare(course.id)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all border-2 ${
                        selectedCourseToShare === course.id
                          ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{course.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {lectureCount} lecture{lectureCount !== 1 ? 's' : ''}
                      </p>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No courses available</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  hapticButton()
                  setShowShareCourseModal(false)
                  setSelectedCourseToShare(null)
                }}
                disabled={isSharingCourse}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareCourse}
                disabled={isSharingCourse || !selectedCourseToShare}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isSharingCourse ? 'Sharing...' : 'Share Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Lecture to Class Modal */}
      {showShareLectureModal && lectureToShare && (
        <ShareLectureToClassModal
          isOpen={showShareLectureModal}
          onClose={() => {
            setShowShareLectureModal(false)
            setLectureToShare(null)
            setSelectedClassForLecture(null)
          }}
          lectureTitle={lectures.find(l => l.id === lectureToShare)?.title || 'Lecture'}
          currentClassId={getLectureClassId(lectureToShare)}
          userClasses={userClasses}
          selectedClassId={selectedClassForLecture}
          onClassSelect={setSelectedClassForLecture}
          onConfirmShare={handleShareLecture}
          isSharing={isSharingLecture}
        />
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
                      <span className="text-lg">✅</span>
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
                      <span className="text-lg">✅</span>
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
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* Mobile Bottom Navigation with Center Record Button - Hidden in flashcard/quiz mode */}
      {!isFlashcardModeActive && !isLearnModeActive && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2235] border-t border-gray-200 dark:border-white/[0.08] z-50 pb-8">
        <div className="flex items-end justify-evenly h-16 px-4 pt-2">
          {/* Home */}
          <button
            onClick={() => {
              if (activeScreen !== 'dashboard') {
                hapticSelection()
                setActiveScreen('dashboard')
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
              activeScreen === 'dashboard' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-medium dark:opacity-60">Home</span>
          </button>

          {/* Library */}
          <button
            onClick={() => {
              if ((activeScreen as any) !== 'library') {
                hapticSelection()
                setActiveScreen('library')
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
              activeScreen === 'library' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
            }`}
          >
            <span className="text-lg">📚</span>
            <span className="text-[10px] font-medium dark:opacity-60">Library</span>
          </button>

          {/* Center Record Button */}
          <div className="relative">
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
            className={`relative rounded-full shadow-lg flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.95] active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-14 h-14 mb-[-8px] ${
              isRecording
                ? 'bg-red-500 shadow-red-500/25 animate-recording-pulse'
                : 'bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40 hover:shadow-xl'
            }`}
          >
            {isStoppingRecording || isGeneratingNotes || isTranscribing ? (
              <span className="text-lg">⏳</span>
            ) : (
              <Mic className="w-5 h-5 text-white" strokeWidth={1.5} />
            )}
            </button>
          </div>

          {/* Analytics */}
          <button
            onClick={() => {
              if (activeScreen !== 'analytics') {
                hapticSelection()
                setActiveScreen('analytics')
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
              activeScreen === 'analytics' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-[10px] font-medium dark:opacity-60">Analytics</span>
          </button>

          {/* Classes */}
          <button
            onClick={() => {
              if (activeScreen !== 'feed') {
                hapticSelection()
                setActiveScreen('feed')
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] ${
              activeScreen === 'feed' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-white/50'
            }`}
          >
            <span className="text-lg">👥</span>
            <span className="text-[10px] font-medium dark:opacity-60">Classes</span>
          </button>
        </div>
      </nav>
      )}

      
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
              <div className={`mx-auto w-32 h-32 rounded-full bg-red-500 flex items-center justify-center text-white mb-4 ${!isPaused && 'recording-indicator'}`}>
                <span className="text-lg">🎤</span>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 h-8 mb-4">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full transition-all duration-75"
                    style={{
                      height: isPaused ? '8px' : `${level}px`,
                    }}
                  />
                ))}
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
                  {isPaused ? <><span className="text-lg">▶️</span> Resume</> : <><span className="text-lg">⏸</span> Pause</>}
                </button>
                <button
                  onClick={async () => {
                    hapticImpact('medium')
                    setIsStoppingRecording(true)
                    try {
                      const result = await stopAndGenerateNotes()
                      console.log('[Dashboard Stop Button] stopAndGenerateNotes result:', result ? { transcript: result.transcript?.length, notes: result.notes?.length, audioBlob: result.audioBlob?.size } : 'null')

                      // Always capture audioBlob if available
                      if (result?.audioBlob) {
                        capturedAudioBlobRef.current = result.audioBlob
                        console.log('[Dashboard Stop Button] Captured audioBlob in ref:', result.audioBlob.size, 'bytes')
                      }

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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  <Square className="w-5 h-5" />
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
                <span className="text-lg">🎤</span>
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
              <Trash2 className="w-12 h-12 mx-auto text-red-600" strokeWidth={1.5} />
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
                  <span className="text-lg">⏳</span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {showDeleteCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 w-80 animate-fade-in">
            <div className="text-center space-y-2">
              <Trash2 className="w-12 h-12 mx-auto text-red-600" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Course?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">This will delete the course and all its lectures. This action cannot be undone.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  hapticButton()
                  setShowDeleteCourseModal(false)
                }}
                disabled={isDeletingCourse}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedCourse || !user?.id) return
                  hapticImpact('heavy')
                  setIsDeletingCourse(true)
                  try {
                    // Delete all lectures in the course first
                    const { error: lecturesError } = await (supabase as any)
                      .from('lectures')
                      .delete()
                      .eq('course_id', selectedCourse)
                      .eq('user_id', user.id)

                    if (lecturesError) throw lecturesError

                    // Delete the course
                    const { error: courseError } = await (supabase as any)
                      .from('courses')
                      .delete()
                      .eq('id', selectedCourse)
                      .eq('user_id', user.id)

                    if (courseError) throw courseError

                    hapticSuccess()
                    toast.success('Course deleted successfully')
                    setShowDeleteCourseModal(false)
                    setSelectedCourse(null)
                    fetchCourses()
                    fetchLectures()
                  } catch (error) {
                    console.error('Error deleting course:', error)
                    hapticError()
                    toast.error('Failed to delete course')
                  } finally {
                    setIsDeletingCourse(false)
                  }
                }}
                disabled={isDeletingCourse}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg btn-press font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeletingCourse ? (
                  <span className="text-lg">⏳</span>
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
                    // Get audio URL first (if audio is available) before creating lecture
                    let audioUrl: string | null = null
                    let uploadedExtension: string | null = null
                    let tempUploadId: string | null = null
                    const audioBlobToUpload = capturedAudioBlobRef.current
                    console.log('[SaveLecture Modal] audioBlob from ref:', audioBlobToUpload ? `Blob size: ${audioBlobToUpload.size}, type: ${audioBlobToUpload.type}` : 'null')

                    if (audioBlobToUpload) {
                      try {
                        console.log('[SaveLecture Modal] Uploading audio to storage with temp ID...')
                        // Use a temporary ID for initial upload
                        tempUploadId = `temp-${Date.now()}`
                        const uploadResult = await uploadAudioFile(user!.id, tempUploadId, audioBlobToUpload)
                        audioUrl = uploadResult.url
                        uploadedExtension = uploadResult.extension
                        console.log('[SaveLecture Modal] Audio uploaded, URL:', audioUrl)
                      } catch (audioError) {
                        console.error('[SaveLecture Modal] Failed to upload audio:', audioError)
                        toast.error(`Warning: Audio file could not be uploaded. ${(audioError as Error).message}`)
                        // Continue saving even if audio upload fails
                      }
                    } else {
                      console.log('[SaveLecture Modal] No audioBlob available to upload')
                    }

                    // Check lecture limit before inserting
                    const { count: lectureCount } = await (supabase as any)
                      .from('lectures')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', user!.id)

                    if (lectureCount !== null && lectureCount >= MAX_LECTURES) {
                      hapticError()
                      toast.error(`Storage limit reached! You can only store ${MAX_LECTURES} lectures on the free plan. Please delete some lectures to continue.`)
                      throw new Error('Lecture limit reached')
                    }

                    // Use sequential naming based on existing lecture count
                    const defaultTitle = lectureCount !== null ? `Lecture ${lectureCount + 1}` : `Lecture ${new Date().toLocaleDateString()}`

                    const { data: lecture, error: lectureError } = await (supabase as any)
                      .from('lectures')
                      .insert({
                        user_id: user!.id,
                        course_id: selectedCourseForRecording,
                        title: lectureTitle.trim() || defaultTitle,
                        duration: duration,
                        transcription_status: 'completed',
                        audio_url: audioUrl,
                      })
                      .select()
                      .single()

                    if (lectureError) {
                      throw lectureError
                    }

                    // If we uploaded audio with a temp ID, reorganize the file to use the actual lecture ID
                    if (audioUrl && tempUploadId && uploadedExtension) {
                      try {
                        console.log('[SaveLecture Modal] Reorganizing audio file with lecture ID...')
                        const newAudioUrl = await reorganizeAudioFile(
                          user!.id,
                          tempUploadId,
                          lecture.id,
                          uploadedExtension
                        )

                        console.log('[SaveLecture Modal] New audio URL:', newAudioUrl)

                        // Update lecture with the correct audio URL
                        const { error: updateError } = await (supabase as any)
                          .from('lectures')
                          .update({ audio_url: newAudioUrl })
                          .eq('id', lecture.id)

                        if (updateError) {
                          console.error('[SaveLecture Modal] Failed to update lecture with new audio URL:', updateError)
                        } else {
                          console.log('[SaveLecture Modal] Lecture updated with reorganized audio URL successfully')
                        }
                      } catch (reorganizeError) {
                        console.error('[SaveLecture Modal] Failed to reorganize audio file:', reorganizeError)
                        // File is still accessible at the temp URL, so this is non-critical
                      }
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
                    soundSuccess()

                    setShowCourseSelectionModal(false)
                    setSelectedCourseForRecording(null)
                    setLectureTitle('')
                    capturedAudioBlobRef.current = null
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">This Week</h3>
              <div className="flex justify-between">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const today = new Date().getDay()
                  const adjustedToday = today === 0 ? 6 : today - 1 // Convert to Mon=0 format
                  const isToday = i === adjustedToday
                  const isPast = i < adjustedToday
                  const isActive = (isPast && streak > 0) || (isToday && isActiveToday())

                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <span className={`text-xs ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {day}
                      </span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-orange-500'
                          : isToday
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {isActive ? (
                          <span className="text-lg">🔥</span>
                        ) : (
                          <span className={`text-sm ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
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
                  { days: 3, label: '3 days', icon: <span className="text-lg">🌱</span> },
                  { days: 7, label: '1 week', icon: <span className="text-lg">⭐</span> },
                  { days: 14, label: '2 weeks', icon: <span className="text-lg">🎖️</span> },
                  { days: 30, label: '1 month', icon: <span className="text-lg">🏆</span> },
                  { days: 60, label: '2 months', icon: <span className="text-lg">💎</span> },
                  { days: 100, label: '100 days', icon: <span className="text-lg">👑</span> },
                ].map(({ days, label, icon }) => (
                  <div
                    key={days}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl text-center ${
                      streak >= days
                        ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {streak >= days ? (
                      <div className="text-orange-600 dark:text-orange-400">{icon}</div>
                    ) : (
                      <span className="text-lg">🔒</span>
                    )}
                    <p className={`text-xs mt-1 font-medium ${streak >= days ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => { hapticButton(); setShowStreakModal(false) }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Keep Studying!
            </button>
          </div>
        </div>
      )}

      {/* Level Progress Modal */}
      <LevelProgressModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        levelInfo={levelInfo}
        totalXP={totalXP}
        xpHistory={xpHistory}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={showLevelUp}
        onClose={dismissLevelUp}
        newLevel={newLevel}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        achievements={getAllAchievements()}
        unlockedCount={unlockedCount}
        totalCount={totalCount}
      />

      {/* Achievement Unlocked Modal */}
      <AchievementUnlockedModal
        isOpen={showAchievementModal}
        onClose={dismissAchievement}
        achievement={newAchievement}
      />

      {/* Learn Mode Config Modal */}
      <LearnModeConfigModal
        isOpen={showLearnModeConfigModal}
        onClose={() => setShowLearnModeConfigModal(false)}
        onGenerate={(config) => generateLearnMode(undefined, config)}
        isGenerating={isGeneratingLearnMode}
      />

      {/* Flashcard Config Modal */}
      <FlashcardConfigModal
        isOpen={showFlashcardConfigModal}
        onClose={() => setShowFlashcardConfigModal(false)}
        onGenerate={(config) => generateFlashcards(undefined, config)}
        isGenerating={isGeneratingFlashcards}
      />

      {/* Generating Quiz/Flashcards Loading Screen */}
      <GeneratingScreen
        isVisible={isGeneratingLearnMode || isGeneratingFlashcards}
        type={isGeneratingLearnMode ? 'quiz' : 'flashcards'}
      />

      {/* Full Screen Notes Modal */}
      {showFullScreenNotes && selectedLectureNotes && (
        <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-40 overflow-y-auto">
          {/* Notes content - full screen */}
          <div className="px-4 sm:px-5 pt-32 lg:pt-6 pb-32 lg:pb-8">
            {/* Inline back button */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowFullScreenNotes(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform shadow-sm"
              >
                <span className="text-lg">◀</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {selectedLectureData?.title || 'Notes'}
              </h1>
            </div>

            <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:font-bold prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:font-semibold prose-h3:text-gray-800 dark:prose-h3:text-gray-100 prose-h3:mb-2 prose-h3:mt-6
              prose-p:text-base sm:prose-p:text-lg prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3
              prose-ul:my-3 prose-ul:ml-0 prose-ul:pl-6
              prose-li:my-1 prose-li:text-base sm:prose-li:text-lg prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed prose-li:marker:text-blue-600 dark:prose-li:marker:text-blue-400
              prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
              [&>*:first-child]:mt-0
              [&_ul]:list-disc [&_ul]:space-y-1
            ">
              <ReactMarkdown>{selectedLectureNotes}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      </div> {/* Close h-screen-safe */}
    </Suspense>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><span className="text-lg">⏳</span></div>}>
      <DashboardContent />
    </Suspense>
  )
}
