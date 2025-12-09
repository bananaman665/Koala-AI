import { NextRequest, NextResponse } from 'next/server'
import { generateNotesFromTranscript } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { transcript, options } = await request.json()

    console.log('[NOTES API] Request received')
    console.log('[NOTES API] Transcript length:', transcript?.length || 0)
    console.log('[NOTES API] API Key present:', !!process.env.GROQ_API_KEY)

    if (!transcript || typeof transcript !== 'string') {
      console.error('[NOTES API] Invalid transcript type:', typeof transcript)
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      )
    }

    if (transcript.trim().length === 0) {
      console.error('[NOTES API] Transcript is empty')
      return NextResponse.json(
        { error: 'Nothing recorded' },
        { status: 400 }
      )
    }

    // Generate notes using Groq
    console.log('[NOTES API] Calling generateNotesFromTranscript...')
    const notes = await generateNotesFromTranscript(transcript, options)
    console.log('[NOTES API] Notes result length:', notes?.length || 0)
    console.log('[NOTES API] Notes preview:', notes?.substring(0, 100) || 'EMPTY')

    if (!notes || notes.trim().length === 0) {
      console.error('[NOTES API] Notes generation returned empty result')
      return NextResponse.json(
        {
          error: 'Failed to generate notes',
          message: 'Groq API returned empty response',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notes,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[NOTES API] Error:', error?.message || error)
    console.error('[NOTES API] Full error:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate notes',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
