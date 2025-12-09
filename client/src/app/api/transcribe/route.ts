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
    console.log('='.repeat(50))
    console.log('TRANSCRIPTION REQUEST RECEIVED')
    console.log('='.repeat(50))
    console.log('File name:', audioFile.name)
    console.log('File type (MIME):', audioFile.type)
    console.log('File size:', audioFile.size, 'bytes')
    console.log('File constructor:', audioFile.constructor.name)

    // Check if file has content
    const arrayBuffer = await audioFile.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes')

    // Recreate file from buffer to ensure it's properly formed
    const fileBlob = new Blob([arrayBuffer], { type: audioFile.type || 'audio/webm' })
    const reconstructedFile = new File([fileBlob], audioFile.name, {
      type: audioFile.type || 'audio/webm'
    })

    console.log('Reconstructed file name:', reconstructedFile.name)
    console.log('Reconstructed file type:', reconstructedFile.type)
    console.log('Reconstructed file size:', reconstructedFile.size)
    console.log('='.repeat(50))
    // === DIAGNOSTIC LOGGING END ===

    // Transcribe audio using Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: reconstructedFile,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      language: 'en',
    })

    const transcriptText = transcription.text

    console.log('Transcription complete:', transcriptText.substring(0, 100) + '...')

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
        console.error('Error saving lecture:', lectureError)
      } else {
        // Save transcript
        const { error: transcriptError } = await supabase.from('transcripts').insert({
          lecture_id: lecture.id,
          user_id: userId,
          content: transcriptText,
        })

        if (transcriptError) {
          console.error('Error saving transcript:', transcriptError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
    })
  } catch (error: any) {
    // === DIAGNOSTIC ERROR LOGGING START ===
    console.log('='.repeat(50))
    console.log('TRANSCRIPTION ERROR')
    console.log('='.repeat(50))
    console.log('Error name:', error?.name)
    console.log('Error message:', error?.message)
    console.log('Error status:', error?.status)
    console.log('Error type:', error?.constructor?.name)

    // Log Groq-specific error details
    if (error?.error) {
      console.log('Groq error object:', JSON.stringify(error.error, null, 2))
    }
    if (error?.headers) {
      console.log('Response headers:', JSON.stringify(Object.fromEntries(error.headers?.entries?.() || []), null, 2))
    }

    console.log('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.log('='.repeat(50))
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
