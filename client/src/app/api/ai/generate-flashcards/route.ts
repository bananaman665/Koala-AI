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

    console.log('[generate-flashcards] Starting generation', {
      contentLength: content.length,
      numberOfCards,
      timestamp: new Date().toISOString()
    })

    // Generate flashcards using Claude
    const flashcards = await generateFlashcards(content, numberOfCards)

    // Validate we got results
    if (!flashcards || flashcards.length === 0) {
      console.error('[generate-flashcards] Empty result:', {
        contentLength: content.length,
        numberOfCards
      })
      throw new Error('AI did not generate any flashcards')
    }

    console.log('[generate-flashcards] Success', {
      count: flashcards.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      flashcards,
      count: flashcards.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    // Add detailed error logging
    console.error('[generate-flashcards] Error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        error: 'Failed to generate flashcards',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
