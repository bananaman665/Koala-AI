import { supabase, QuizQuestion, QuizConfig, Flashcard, FlashcardConfig } from './supabase'

/**
 * Save or update flashcard deck for a lecture
 */
export async function saveFlashcardDeck(
  lectureId: string,
  userId: string,
  cards: Flashcard[],
  config: FlashcardConfig
) {
  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .upsert({
        lecture_id: lectureId,
        user_id: userId,
        cards,
        config,
      }, {
        onConflict: 'lecture_id,user_id'
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error('[saveFlashcardDeck] Error:', error)
    throw new Error(`Failed to save flashcards: ${error.message}`)
  }
}

/**
 * Load flashcard deck for a lecture
 */
export async function loadFlashcardDeck(lectureId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('lecture_id', lectureId)
      .eq('user_id', userId)
      .single()

    if (error) {
      // No flashcard deck exists yet
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  } catch (error: any) {
    console.error('[loadFlashcardDeck] Error:', error)
    throw new Error(`Failed to load flashcards: ${error.message}`)
  }
}

/**
 * Save or update quiz for a lecture
 */
export async function saveQuiz(
  lectureId: string,
  userId: string,
  questions: QuizQuestion[],
  config: QuizConfig
) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .upsert({
        lecture_id: lectureId,
        user_id: userId,
        questions,
        config,
      }, {
        onConflict: 'lecture_id,user_id'
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error('[saveQuiz] Error:', error)
    throw new Error(`Failed to save quiz: ${error.message}`)
  }
}

/**
 * Load quiz for a lecture
 */
export async function loadQuiz(lectureId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lecture_id', lectureId)
      .eq('user_id', userId)
      .single()

    if (error) {
      // No quiz exists yet
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  } catch (error: any) {
    console.error('[loadQuiz] Error:', error)
    throw new Error(`Failed to load quiz: ${error.message}`)
  }
}

/**
 * Delete flashcard deck for a lecture
 */
export async function deleteFlashcardDeck(lectureId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('lecture_id', lectureId)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('[deleteFlashcardDeck] Error:', error)
    throw new Error(`Failed to delete flashcards: ${error.message}`)
  }
}

/**
 * Delete quiz for a lecture
 */
export async function deleteQuiz(lectureId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('lecture_id', lectureId)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('[deleteQuiz] Error:', error)
    throw new Error(`Failed to delete quiz: ${error.message}`)
  }
}
