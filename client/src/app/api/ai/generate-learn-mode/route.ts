import { NextRequest, NextResponse } from 'next/server'
import { generateLearnModeQuestions, QuestionType, DifficultyLevel } from '@/lib/mistral'

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      numberOfQuestions = 10,
      questionTypes,
      difficulty
    } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content is too short to generate meaningful questions' },
        { status: 400 }
      )
    }

    // Validate question types if provided
    const validTypes: QuestionType[] = ['multiple_choice', 'true_false', 'written', 'fill_in_blank']
    if (questionTypes && Array.isArray(questionTypes)) {
      const invalidTypes = questionTypes.filter((t: string) => !validTypes.includes(t as QuestionType))
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `Invalid question types: ${invalidTypes.join(', ')}. Valid types are: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate difficulty if provided
    const validDifficulties: DifficultyLevel[] = ['easy', 'medium', 'hard']
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty: ${difficulty}. Valid difficulties are: ${validDifficulties.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('[generate-learn-mode] Starting generation', {
      contentLength: content.length,
      numberOfQuestions,
      questionTypes,
      difficulty,
      timestamp: new Date().toISOString()
    })

    // Generate learn mode questions using Claude
    const questions = await generateLearnModeQuestions(content, numberOfQuestions, {
      questionTypes: questionTypes as QuestionType[],
      difficulty: difficulty as DifficultyLevel,
    })

    // Validate we got results
    if (!questions || questions.length === 0) {
      console.error('[generate-learn-mode] Empty result:', {
        contentLength: content.length,
        numberOfQuestions
      })
      throw new Error('AI did not generate any questions')
    }

    console.log('[generate-learn-mode] Success', {
      count: questions.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    // Add detailed error logging
    console.error('[generate-learn-mode] Error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        error: 'Failed to generate learn mode questions',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
