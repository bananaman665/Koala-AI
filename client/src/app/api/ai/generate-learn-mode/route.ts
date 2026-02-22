import { NextRequest, NextResponse } from 'next/server'
import { generateLearnModeQuestions, QuestionType, DifficultyLevel } from '@/lib/gemini'

export const maxDuration = 60

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

    // Determine friendly error message based on error type
    let friendlyMessage = 'Unable to generate quiz at this moment. Please try again.'
    let statusCode = 500

    if (error?.message?.includes('Content is required')) {
      friendlyMessage = 'Please provide content to generate a quiz'
      statusCode = 400
    } else if (error?.message?.includes('too short')) {
      friendlyMessage = 'The content is too short. Please provide more text.'
      statusCode = 400
    } else if (error?.message?.includes('Invalid')) {
      friendlyMessage = 'Invalid quiz settings. Please check your selections and try again.'
      statusCode = 400
    } else if (error?.message?.includes('parse') || error?.message?.includes('JSON')) {
      friendlyMessage = 'We had trouble processing the response. Please try again.'
      statusCode = 500
    } else if (error?.message?.includes('API') || error?.message?.includes('MISTRAL')) {
      friendlyMessage = 'The AI service is temporarily unavailable. Please try again shortly.'
      statusCode = 503
    } else if (error?.message?.includes('timeout')) {
      friendlyMessage = 'The request took too long. Please try again.'
      statusCode = 504
    } else if (error?.message?.includes('zero questions')) {
      friendlyMessage = 'Could not generate quiz questions from this content. Try with different text.'
      statusCode = 400
    }

    return NextResponse.json(
      {
        error: friendlyMessage,
        message: friendlyMessage,
      },
      { status: statusCode }
    )
  }
}
