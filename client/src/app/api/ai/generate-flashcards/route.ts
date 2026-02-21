import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/mistral'

export const maxDuration = 60

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

    // Determine friendly error message based on error type
    let friendlyMessage = 'Unable to generate flashcards at this moment. Please try again.'
    let statusCode = 500

    if (error?.message?.includes('Content is required')) {
      friendlyMessage = 'Please provide content to generate flashcards'
      statusCode = 400
    } else if (error?.message?.includes('too short')) {
      friendlyMessage = 'The content is too short. Please provide more text.'
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
    } else if (error?.message?.includes('zero flashcards')) {
      friendlyMessage = 'Could not generate flashcards from this content. Try with different text.'
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
