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
  temperature: 0.7,
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
    console.log('[GROQ] Initializing Groq API call...')
    console.log('[GROQ] API Key present:', !!process.env.GROQ_API_KEY)
    console.log('[GROQ] Transcript length:', transcript.length)

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert note-taking assistant. Your job is to convert lecture transcripts into clear, structured, and comprehensive notes. Format the notes with:
- Main topics as headings
- Key concepts with bullet points
- Important definitions highlighted
- Examples and explanations
- Summary at the end

Make the notes easy to study from and understand.`,
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

    console.log('[GROQ] API call successful')
    console.log('[GROQ] Response choices count:', completion.choices?.length || 0)

    const notes = completion.choices[0]?.message?.content || ''
    console.log('[GROQ] Notes content length:', notes.length)

    if (!notes) {
      console.error('[GROQ] No content in response')
    }

    return notes
  } catch (error: any) {
    console.error('[GROQ] Error calling API:', error?.message || error)
    console.error('[GROQ] Error details:', {
      status: error?.status,
      statusText: error?.statusText,
      code: error?.code,
    })
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
    console.error('Failed to parse flashcards JSON:', error)
    // Return empty array if parsing fails
    return []
  }
}

/**
 * Generate learn mode questions with multiple choice options
 */
export async function generateLearnModeQuestions(
  content: string,
  numberOfQuestions: number = 10,
  options?: {
    model?: string
  }
) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating effective study questions. Create a mix of multiple choice and true/false questions that help students learn and retain information. Make the questions challenging but fair, with plausible distractors for multiple choice.`,
      },
      {
        role: 'user',
        content: `Create exactly ${numberOfQuestions} learn mode questions from this lecture content. Format your response as a JSON array with objects containing:
- "question": the question text
- "type": either "multiple_choice" or "true_false"
- "correctAnswer": the correct answer
- "options": array of 4 options for multiple choice (include the correct answer), or ["True", "False"] for true/false
- "explanation": brief explanation of why the answer is correct

Make sure the correct answer is randomly positioned in the options array.

Content:
${content}`,
      },
    ],
    model: options?.model || GROQ_MODELS.LLAMA_70B,
    temperature: 0.6,
    max_tokens: 3000,
  })

  const response = completion.choices[0]?.message?.content || ''

  // Try to parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : response
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to parse learn mode questions JSON:', error)
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
