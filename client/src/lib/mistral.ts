import { Mistral } from '@mistralai/mistralai'

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
})

// Available Mistral models
export const MISTRAL_MODELS = {
  SMALL: 'mistral-small-latest',
  MEDIUM: 'mistral-medium-latest',
  LARGE: 'mistral-large-latest',
} as const

// Default settings - using small for free tier
export const DEFAULT_MISTRAL_CONFIG = {
  model: MISTRAL_MODELS.SMALL,
  maxTokens: 2048,
}

/**
 * Generate AI notes from lecture transcript
 */
export async function generateNotesFromTranscript(
  transcript: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
) {
  try {
    const systemPrompt = `You are a concise note generator. Create study notes that are specific, insight-driven, and useful for review.

RULES:
- Do not repeat the same idea using different wording
- Merge overlapping points into one stronger statement
- Prefer actions, focus areas, or outcomes over vague traits
- Avoid generic phrases like "passionate about," "enjoys," or "interested in" unless followed by a concrete example
- Each bullet must add new information
- Keep bullets short (1 line each)

MARKDOWN SYNTAX:
- Use ## (two hashtags + space) for section headers
- Use - (dash + space) for bullet points
- Use **keyword** for emphasis (max 2-3 per section)

STRUCTURE:
- 2-4 focused sections with ## headers (keep titles ~10 characters max)
- 3-5 bullets per section (each bullet = new information)
- End with "## Key Takeaway" (1-2 sentences that add insight, not repetition)

TONE:
- Clear, neutral, professional
- Not motivational, not fluffy
- Direct facts, not narration

BAD EXAMPLE:
## Personal Interests
- Enjoys programming
- Passionate about coding
- Interested in building apps
- Likes productivity tools

GOOD EXAMPLE:
## Software
- Building productivity apps with React and TypeScript
- Automating repetitive workflows
- Studying algorithms for performance optimization

## Key Take
- Focused on practical software that saves time, with emphasis on web technologies.

CRITICAL:
- NO AI narration ("the speaker says/claims/believes")
- NO redundant bullets saying the same thing differently
- Every bullet must provide unique, actionable information
- Output must feel useful for studying, not like an auto-generated summary`

    const response = await mistral.chat.complete({
      model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
      maxTokens: options?.maxTokens || DEFAULT_MISTRAL_CONFIG.maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please convert this lecture transcript into structured study notes:\n\n${transcript}`,
        },
      ],
    })

    const notes = response.choices?.[0]?.message?.content || ''
    return typeof notes === 'string' ? notes : ''
  } catch (error: any) {
    throw error
  }
}

/**
 * Generate a summary of lecture notes
 */
export async function generateSummary(
  content: string,
  options?: {
    model?: string
    maxWords?: number
  }
) {
  const maxWords = options?.maxWords || 150

  const response = await mistral.chat.complete({
    model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: Math.ceil(maxWords * 1.5),
    messages: [
      {
        role: 'system',
        content: 'You are a concise summarization assistant. Create brief, informative summaries that capture the main points.',
      },
      {
        role: 'user',
        content: `Summarize the following content in approximately ${maxWords} words:\n\n${content}`,
      },
    ],
  })

  const summary = response.choices?.[0]?.message?.content || ''
  return typeof summary === 'string' ? summary : ''
}

/**
 * Extract key points from content
 */
export async function extractKeyPoints(
  content: string,
  numberOfPoints: number = 5
) {
  const response = await mistral.chat.complete({
    model: DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: 500,
    messages: [
      {
        role: 'system',
        content: 'You are an expert at identifying key takeaways from educational content. Extract the most important points concisely.',
      },
      {
        role: 'user',
        content: `Extract exactly ${numberOfPoints} key points from this content. Format as a numbered list:\n\n${content}`,
      },
    ],
  })

  const points = response.choices?.[0]?.message?.content || ''
  return typeof points === 'string' ? points : ''
}

/**
 * Generate flashcards from lecture content
 */
export async function generateFlashcards(
  content: string,
  numberOfCards: number = 10,
  options?: {
    model?: string
  }
) {
  const response = await mistral.chat.complete({
    model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: 2000,
    messages: [
      {
        role: 'system',
        content: 'You are an expert at creating effective study flashcards. Create clear, concise flashcards that help students learn and retain information. Each flashcard should have a question on the front and a detailed answer on the back.',
      },
      {
        role: 'user',
        content: `Create exactly ${numberOfCards} flashcards from this lecture content. Format your response as a JSON array with objects containing "question" and "answer" fields. Make the questions clear and the answers comprehensive but concise.\n\nContent:\n${content}`,
      },
    ],
  })

  const responseText = response.choices?.[0]?.message?.content || ''
  const text = typeof responseText === 'string' ? responseText : ''

  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text
    return JSON.parse(jsonString)
  } catch (error) {
    // Return empty array if parsing fails
    return []
  }
}

// Question types for learn mode
export type QuestionType = 'multiple_choice' | 'true_false' | 'written' | 'fill_in_blank'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface LearnModeOptions {
  model?: string
  questionTypes?: QuestionType[]
  difficulty?: DifficultyLevel
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

  // Build question type instructions
  const typeInstructions = questionTypes.map(type => {
    switch (type) {
      case 'multiple_choice':
        return '- Multiple Choice: 4 options with one correct answer'
      case 'true_false':
        return '- True/False: a STATEMENT (not a question) that is either true or false. Example: "The mitochondria is the powerhouse of the cell." NOT "What is the powerhouse of the cell?"'
      case 'written':
        return '- Written: open-ended question requiring a short written response (1-3 sentences)'
      case 'fill_in_blank':
        return '- Fill in the Blank: sentence with a key term removed (shown as ___)'
      default:
        return ''
    }
  }).join('\n')

  const difficultyInstructions = {
    easy: 'Create straightforward questions that test basic recall and understanding. Use clear, simple language.',
    medium: 'Create moderately challenging questions that require understanding concepts and making connections.',
    hard: 'Create challenging questions that require deep understanding, analysis, and application of concepts.'
  }

  const typeSchemas = questionTypes.map(type => {
    switch (type) {
      case 'multiple_choice':
        return `For multiple_choice:
  - "options": array of exactly 4 options (include the correct answer, randomly positioned)
  - "correctAnswer": the exact text of the correct option`
      case 'true_false':
        return `For true_false:
  - "question": must be a STATEMENT (not a question), e.g. "The sky is blue." NOT "Is the sky blue?"
  - "options": ["True", "False"]
  - "correctAnswer": either "True" or "False"`
      case 'written':
        return `For written:
  - "options": [] (empty array)
  - "correctAnswer": the ideal/expected answer (1-3 sentences)
  - "keywords": array of 3-5 key terms/concepts that should appear in a correct answer`
      case 'fill_in_blank':
        return `For fill_in_blank:
  - "options": [] (empty array)
  - "correctAnswer": the word or phrase that fills the blank
  - "acceptableAnswers": array of alternative acceptable answers (synonyms, variations)`
      default:
        return ''
    }
  }).join('\n\n')

  const response = await mistral.chat.complete({
    model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: 4000,
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating effective study questions. ${difficultyInstructions[difficulty]}`,
      },
      {
        role: 'user',
        content: `Create exactly ${numberOfQuestions} learn mode questions from this lecture content.

Question types to include (distribute evenly):
${typeInstructions}

Format your response as a JSON array with objects containing:
- "question": the question text
- "type": one of: ${questionTypes.map(t => `"${t}"`).join(', ')}
- "correctAnswer": the correct answer
- "options": array of options (varies by type)
- "explanation": brief explanation of why the answer is correct

Type-specific fields:
${typeSchemas}

Content:
${content}`,
      },
    ],
  })

  const responseText = response.choices?.[0]?.message?.content || ''
  const text = typeof responseText === 'string' ? responseText : ''

  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text
    return JSON.parse(jsonString)
  } catch (error) {
    // Return empty array if parsing fails
    return []
  }
}

/**
 * Answer questions about lecture content
 */
export async function answerQuestion(
  question: string,
  context: string,
  options?: {
    model?: string
  }
) {
  const response = await mistral.chat.complete({
    model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful teaching assistant. Answer questions about lecture content clearly and accurately based on the provided context.',
      },
      {
        role: 'user',
        content: `Context (lecture notes):\n${context}\n\nQuestion: ${question}`,
      },
    ],
  })

  const answer = response.choices?.[0]?.message?.content || ''
  return typeof answer === 'string' ? answer : ''
}

/**
 * Stream chat completion (for real-time responses)
 */
export async function* streamChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string
    temperature?: number
  }
) {
  const stream = await mistral.chat.stream({
    model: options?.model || DEFAULT_MISTRAL_CONFIG.model,
    maxTokens: 2048,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  })

  for await (const event of stream) {
    const content = event.data?.choices?.[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}
