import { NextRequest, NextResponse } from 'next/server'
import { generateNotesFromTranscript } from '@/lib/mistral'

export async function POST(request: NextRequest) {
  try {
    const { transcript, options } = await request.json()


    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      )
    }

    if (transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nothing recorded' },
        { status: 400 }
      )
    }

    // Generate notes using Claude
    const notes = await generateNotesFromTranscript(transcript, options)

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to generate notes',
          message: 'Mistral API returned empty response',
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

    return NextResponse.json(
      {
        error: 'Failed to generate notes',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
