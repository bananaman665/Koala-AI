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
          content: `You are a note transformation expert. Convert lecture transcripts into clean, scannable study notes.

CRITICAL RULES:

1. NO AI NARRATION
   - Remove: "the speaker says", "this implies", "in summary", "it's important to note"
   - Write direct factual statements only
   - Example: Instead of "The speaker explains that mitosis is..." write "Mitosis is..."

2. VISUAL HIERARCHY
   - Use ## for main section headers (bold, 3-4 sections maximum)
   - Use - for bullet points under each section
   - Use  - (2 spaces) for sub-bullets only when necessary
   - Keep hierarchy shallow (max 2 levels of bullets)

3. SECTION LIMITS
   - Maximum 3-4 main sections
   - Merge redundant sections (don't have separate "Explanation", "Importance", AND "Summary")
   - Each section should be distinct and necessary

4. CONCISE LANGUAGE
   - Short, clear sentences
   - No repetition of ideas
   - Remove filler words
   - Get straight to the point

5. KEY TAKEAWAY (REQUIRED)
   - End with "## Key Takeaway" section
   - ONE sentence summarizing the most important concept
   - This is mandatory for every note

6. WHITESPACE & FORMATTING
   - Single blank line between sections
   - Single blank line between bullet groups
   - No long paragraphs (break into bullets)
   - Mobile-friendly line length
   - Markdown only, NO emojis

OUTPUT FORMAT:
- Start with content immediately (no title)
- Use markdown formatting
- Bold (**text**) for emphasis within bullets
- Keep it scannable and easy to review

Example structure:
## Section Name
- Key point with **bold emphasis**
- Another important fact
  - Supporting detail if needed

## Another Section
- Main concept
- Related idea

## Key Takeaway
One sentence capturing the core lesson from this lecture.`,
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
