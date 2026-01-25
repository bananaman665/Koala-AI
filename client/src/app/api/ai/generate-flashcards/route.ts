import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/mistral'

export async function POST(request: NextRequest) {
  try {
    const { content, numberOfCards = 10 } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content is too short to generate meaningful flashcards' },
        { status: 400 }
      )
    }

    // Generate flashcards using Claude
    const flashcards = await generateFlashcards(content, numberOfCards)

    return NextResponse.json({
      success: true,
      flashcards,
      count: flashcards.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {

    return NextResponse.json(
      {
        error: 'Failed to generate flashcards',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
