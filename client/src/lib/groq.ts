import Groq from 'groq-sdk'

// Initialize Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Available Groq models
export const GROQ_MODELS = {
  LLAMA_70B: 'llama-3.3-70b-versatile',
  LLAMA_8B: 'llama-3.1-8b-instant',
  MIXTRAL: 'mixtral-8x7b-32768',
  GEMMA_7B: 'gemma-7b-it',
} as const

// Default settings
export const DEFAULT_GROQ_CONFIG = {
  model: GROQ_MODELS.LLAMA_70B,
  temperature: 0.5,
  max_tokens: 2048,
  top_p: 1,
  stream: false,
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

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a markdown note formatter. You MUST use proper markdown syntax with bullet points.

MANDATORY MARKDOWN SYNTAX:
- Use ## (two hashtags + space) for section headers
- Use - (dash + space) for EVERY bullet point
- Use  - (2 spaces + dash + space) for sub-bullets

YOU MUST START EVERY LINE WITH MARKDOWN SYNTAX. NO PLAIN TEXT LINES ALLOWED.

CRITICAL FORMATTING RULES:

1. EVERY FACT = BULLET POINT WITH "-"
   - Start each line with "- " (dash + space)
   - NO lines without dashes (except ## headers)
   - NO paragraphs, NO prose, NO plain text
   - Each bullet = one concise fact

2. NO AI NARRATION
   - NEVER write: "the speaker says/claims/believes/explains", "this implies", "in summary"
   - Write direct facts like a textbook
   - BAD: "The speaker claims to have powers"
   - GOOD: "- Claims of supernatural abilities (Note: appears exaggerated)"

3. EXTREME CLAIMS SOFTENER
   - Flag unrealistic claims: "(Note: appears exaggerated/metaphorical)"
   - Examples: flying, superpowers, impossible feats
   - Add disclaimer in same bullet point

4. MINIMAL BOLD (MAX 2-3 PER SECTION)
   - Bold only 2-3 critical keywords per section
   - Use **keyword** syntax
   - NO bolding phrases or sentences

5. SECTION STRUCTURE
   - 3-4 sections with ## headers
   - 3-5 bullet points per section
   - Always end with "## Key Takeaway"

YOU MUST OUTPUT VALID MARKDOWN. Here's the EXACT format to follow:

## Section Name Here
- First fact with **keyword** if needed
- Second fact about the topic
- Third fact providing details

## Another Section
- Main point discussed
- Supporting detail or example
- Additional relevant fact

## Key Takeaway
- One sentence summarizing the core lesson

WRONG (NO DASHES):
Introduction
This is about photosynthesis
Plants use light

RIGHT (WITH DASHES):
## Introduction
- Photosynthesis converts light to energy
- Plants use **chlorophyll** to capture sunlight
- Process produces oxygen

Remember: EVERY content line needs "- " at the start. NO exceptions.`,
        },
        {
          role: 'user',
          content: `Please convert this lecture transcript into structured study notes:\n\n${transcript}`,
        },
      ],
      model: options?.model || DEFAULT_GROQ_CONFIG.model,
      temperature: options?.temperature || DEFAULT_GROQ_CONFIG.temperature,
      max_tokens: options?.maxTokens || DEFAULT_GROQ_CONFIG.max_tokens,
    })


    const notes = completion.choices[0]?.message?.content || ''

    return notes
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

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a concise summarization assistant. Create brief, informative summaries that capture the main points.`,
      },
      {
        role: 'user',
        content: `Summarize the following content in approximately ${maxWords} words:\n\n${content}`,
      },
    ],
    model: options?.model || GROQ_MODELS.LLAMA_8B, // Use faster model for summaries
    temperature: 0.5,
    max_tokens: Math.ceil(maxWords * 1.5),
  })

  return completion.choices[0]?.message?.content || ''
}

/**
 * Extract key points from content
 */
export async function extractKeyPoints(
  content: string,
  numberOfPoints: number = 5
) {
  const completion = await groq.chat.completions.create({
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
    model: GROQ_MODELS.LLAMA_8B,
    temperature: 0.3,
    max_tokens: 500,
  })

  return completion.choices[0]?.message?.content || ''
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
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating effective study flashcards. Create clear, concise flashcards that help students learn and retain information. Each flashcard should have a question on the front and a detailed answer on the back.`,
      },
      {
        role: 'user',
        content: `Create exactly ${numberOfCards} flashcards from this lecture content. Format your response as a JSON array with objects containing "question" and "answer" fields. Make the questions clear and the answers comprehensive but concise.\n\nContent:\n${content}`,
      },
    ],
    model: options?.model || GROQ_MODELS.LLAMA_70B,
    temperature: 0.5,
    max_tokens: 2000,
  })

  const response = completion.choices[0]?.message?.content || ''

  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : response
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

  const completion = await groq.chat.completions.create({
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
    model: options?.model || GROQ_MODELS.LLAMA_70B,
    temperature: 0.6,
    max_tokens: 4000,
  })

  const response = completion.choices[0]?.message?.content || ''

  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : response
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
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a helpful teaching assistant. Answer questions about lecture content clearly and accurately based on the provided context.`,
      },
      {
        role: 'user',
        content: `Context (lecture notes):\n${context}\n\nQuestion: ${question}`,
      },
    ],
    model: options?.model || GROQ_MODELS.LLAMA_70B,
    temperature: 0.4,
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content || ''
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
  const stream = await groq.chat.completions.create({
    messages,
    model: options?.model || DEFAULT_GROQ_CONFIG.model,
    temperature: options?.temperature || DEFAULT_GROQ_CONFIG.temperature,
    max_tokens: 2048,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}
