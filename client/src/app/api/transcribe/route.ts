import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const courseId = formData.get('courseId') as string
    const userId = formData.get('userId') as string

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // === DIAGNOSTIC LOGGING START ===

    // Check if file has content
    const arrayBuffer = await audioFile.arrayBuffer()

    // Recreate file from buffer to ensure it's properly formed
    const fileBlob = new Blob([arrayBuffer], { type: audioFile.type || 'audio/webm' })
    const reconstructedFile = new File([fileBlob], audioFile.name, {
      type: audioFile.type || 'audio/webm'
    })

    // === DIAGNOSTIC LOGGING END ===

    // Transcribe audio using Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: reconstructedFile,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      language: 'en',
    })

    const transcriptText = transcription.text


    // Save transcript to database if userId and courseId provided
    if (userId && courseId) {
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .insert({
          user_id: userId,
          course_id: courseId,
          title: `Lecture ${new Date().toLocaleDateString()}`,
          duration: Math.floor((audioFile.size / 16000) / 60), // Rough estimate
          transcription_status: 'completed',
          audio_url: '',
        })
        .select()
        .single()

      if (lectureError) {
      } else {
        // Save transcript
        const { error: transcriptError } = await supabase.from('transcripts').insert({
          lecture_id: lecture.id,
          user_id: userId,
          content: transcriptText,
        })

        if (transcriptError) {
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
    })
  } catch (error: any) {
    // === DIAGNOSTIC ERROR LOGGING START ===

    // Log Groq-specific error details
    if (error?.error) {
    }
    if (error?.headers) {
    }

    // === DIAGNOSTIC ERROR LOGGING END ===

    // Extract the actual Groq error message
    let errorMessage = 'Unknown error'
    let groqErrorDetail = null

    // Check for Groq BadRequestError structure
    if (error?.error?.error?.message) {
      groqErrorDetail = error.error.error.message
      errorMessage = groqErrorDetail
    } else if (error?.message) {
      errorMessage = error.message
    }

    // Additional context for common errors
    if (errorMessage.includes('file must be one of the following types')) {
      errorMessage = `Audio format not supported. ${errorMessage}`
    }

    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        message: errorMessage,
        groqError: groqErrorDetail,
        errorType: error?.name || error?.constructor?.name,
        status: error?.status,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: error?.status || 500 }
    )
  }
}

// API route configuration using Next.js 14 App Router syntax
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
