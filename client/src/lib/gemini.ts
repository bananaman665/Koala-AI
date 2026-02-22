// xAI Grok AI integration
// Uses the OpenAI-compatible xAI API via native fetch

const XAI_BASE_URL = 'https://api.x.ai/v1'
const DEFAULT_MODEL = 'grok-3-mini'

// Question types for learn mode
export type QuestionType = 'multiple_choice' | 'true_false' | 'written' | 'fill_in_blank'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface LearnModeOptions {
  model?: string
  questionTypes?: QuestionType[]
  difficulty?: DifficultyLevel
}

async function chat(messages: { role: string; content: string }[], options?: { model?: string; maxTokens?: number }) {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY is not configured')

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens || 2048,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`xAI API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Generate AI notes from lecture transcript
 */
export async function generateNotesFromTranscript(
  transcript: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  return await chat([
    {
      role: 'system',
      content: `You are a concise note generator. Create study notes that are specific, insight-driven, and useful for review.

RULES:
- Do not repeat the same idea using different wording
- Merge overlapping points into one stronger statement
- Each bullet must add new information
- Keep bullets short (1 line each)

MARKDOWN SYNTAX:
- Use ## (two hashtags + space) for section headers
- Use - (dash + space) for bullet points
- Use **keyword** for emphasis (max 2-3 per section)

STRUCTURE:
- 2-4 focused sections with ## headers
- 3-5 bullets per section
- End with "## Key Takeaway" (1-2 sentences)

CRITICAL:
- NO AI narration ("the speaker says/claims/believes")
- NO redundant bullets
- Every bullet must provide unique, actionable information`,
    },
    {
      role: 'user',
      content: `Please convert this lecture transcript into structured study notes:\n\n${transcript}`,
    },
  ], { model: options?.model, maxTokens: options?.maxTokens })
}

/**
 * Generate a summary of lecture notes
 */
export async function generateSummary(
  content: string,
  options?: { model?: string; maxWords?: number }
) {
  const maxWords = options?.maxWords || 150
  return await chat([
    {
      role: 'system',
      content: 'You are a concise summarization assistant. Create brief, informative summaries that capture the main points.',
    },
    {
      role: 'user',
      content: `Summarize the following content in approximately ${maxWords} words:\n\n${content}`,
    },
  ], { model: options?.model, maxTokens: Math.ceil(maxWords * 1.5) })
}

/**
 * Generate flashcards from lecture content
 */
export async function generateFlashcards(
  content: string,
  numberOfCards: number = 10,
  options?: { model?: string }
) {
  const text = await chat([
    {
      role: 'system',
      content: 'You are an expert at creating effective study flashcards. Output ONLY a valid JSON array — no markdown, no explanation, no code blocks.',
    },
    {
      role: 'user',
      content: `Create exactly ${numberOfCards} flashcards from this lecture content. Return a JSON array of objects with "question" and "answer" fields only.\n\nContent:\n${content}`,
    },
  ], { model: options?.model, maxTokens: 2000 })

  console.log('[generateFlashcards] xAI response:', {
    length: text.length,
    preview: text.substring(0, 200),
  })

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text.trim()
    const flashcards = JSON.parse(jsonString)

    if (!Array.isArray(flashcards)) throw new Error('Response is not an array')
    if (flashcards.length === 0) throw new Error('Generated zero flashcards')

    for (let i = 0; i < flashcards.length; i++) {
      if (!flashcards[i].question || !flashcards[i].answer) {
        throw new Error(`Flashcard ${i} missing required fields`)
      }
    }

    return flashcards
  } catch (error: any) {
    console.error('[generateFlashcards] Parse error:', {
      error: error.message,
      responsePreview: text.substring(0, 500),
    })
    throw new Error(`Failed to parse xAI response: ${error.message}`)
  }
}

/**
 * Generate learn mode questions with configurable question types and difficulty
 */
export async function generateLearnModeQuestions(
  content: string,
  numberOfQuestions: number = 10,
  options?: LearnModeOptions
) {
  const questionTypes = options?.questionTypes || ['multiple_choice', 'true_false']
  const difficulty = options?.difficulty || 'medium'

  const typeInstructions = questionTypes.map(type => {
    switch (type) {
      case 'multiple_choice': return '- Multiple Choice: 4 options with one correct answer'
      case 'true_false': return '- True/False: a STATEMENT (not a question) that is either true or false'
      case 'written': return '- Written: open-ended question requiring a short written response (1-3 sentences)'
      case 'fill_in_blank': return '- Fill in the Blank: sentence with a key term removed (shown as ___)'
      default: return ''
    }
  }).join('\n')

  const difficultyInstructions = {
    easy: 'Create straightforward questions that test basic recall and understanding.',
    medium: 'Create moderately challenging questions that require understanding concepts and making connections.',
    hard: 'Create challenging questions that require deep understanding, analysis, and application of concepts.',
  }

  const typeSchemas = questionTypes.map(type => {
    switch (type) {
      case 'multiple_choice': return `For multiple_choice: "options" array of exactly 4 options, "correctAnswer" is the exact text of the correct option`
      case 'true_false': return `For true_false: "question" must be a STATEMENT, "options": ["True", "False"], "correctAnswer": "True" or "False"`
      case 'written': return `For written: "options": [], "correctAnswer": ideal answer (1-3 sentences), "keywords": array of 3-5 key terms`
      case 'fill_in_blank': return `For fill_in_blank: "options": [], "correctAnswer": the missing word/phrase, "acceptableAnswers": array of alternatives`
      default: return ''
    }
  }).join('\n')

  const text = await chat([
    {
      role: 'system',
      content: `You are an expert at creating effective study questions. ${difficultyInstructions[difficulty]} Output ONLY a valid JSON array — no markdown, no explanation, no code blocks.`,
    },
    {
      role: 'user',
      content: `Create exactly ${numberOfQuestions} questions from this lecture content. Distribute evenly across these types:
${typeInstructions}

Return a JSON array where each object has:
- "question": the question text
- "type": one of ${questionTypes.map(t => `"${t}"`).join(', ')}
- "correctAnswer": the correct answer
- "options": array of options (varies by type)
- "explanation": brief explanation of the answer

Type-specific fields:
${typeSchemas}

Content:
${content}`,
    },
  ], { model: options?.model, maxTokens: 4000 })

  console.log('[generateLearnModeQuestions] xAI response:', {
    length: text.length,
    preview: text.substring(0, 200),
  })

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text.trim()
    const questions = JSON.parse(jsonString)

    if (!Array.isArray(questions)) throw new Error('Response is not an array')
    if (questions.length === 0) throw new Error('Generated zero questions')

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.type || !q.question || !q.correctAnswer) {
        throw new Error(`Question ${i} missing required fields`)
      }
      if (q.type === 'multiple_choice' && (!q.options || q.options.length !== 4)) {
        throw new Error(`Question ${i}: multiple_choice must have exactly 4 options`)
      }
      if (q.type === 'true_false' && (!q.options || !q.options.includes('True') || !q.options.includes('False'))) {
        throw new Error(`Question ${i}: true_false must have True and False options`)
      }
    }

    return questions
  } catch (error: any) {
    console.error('[generateLearnModeQuestions] Parse error:', {
      error: error.message,
      responsePreview: text.substring(0, 500),
    })
    throw new Error(`Failed to parse xAI response: ${error.message}`)
  }
}
