import { NextRequest, NextResponse } from 'next/server'
import { generateLearnModeQuestions } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { content, numberOfQuestions = 10 } = await request.json()

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

    // Generate learn mode questions using Groq
    const questions = await generateLearnModeQuestions(content, numberOfQuestions)

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {

    return NextResponse.json(
      {
        error: 'Failed to generate learn mode questions',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
