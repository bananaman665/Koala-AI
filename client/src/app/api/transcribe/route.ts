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
    console.log('[API Transcribe] Received file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Check if file has content
    const arrayBuffer = await audioFile.arrayBuffer()
    console.log('[API Transcribe] ArrayBuffer size:', arrayBuffer.byteLength)

    // Determine the correct MIME type for Groq
    // Groq Whisper supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
    let mimeType = audioFile.type
    let fileName = audioFile.name

    // If the file is AAC (from iOS Capacitor), convert to m4a format for Groq
    if (mimeType === 'audio/aac' || mimeType.includes('aac')) {
      mimeType = 'audio/mp4'
      fileName = fileName.replace(/\.[^/.]+$/, '.m4a')
      if (!fileName.endsWith('.m4a')) fileName = 'recording.m4a'
      console.log('[API Transcribe] Converting AAC to m4a:', { mimeType, fileName })
    }

    // If no valid type, try to infer from filename
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (fileName.endsWith('.m4a')) mimeType = 'audio/mp4'
      else if (fileName.endsWith('.webm')) mimeType = 'audio/webm'
      else if (fileName.endsWith('.wav')) mimeType = 'audio/wav'
      else if (fileName.endsWith('.mp3')) mimeType = 'audio/mpeg'
      else mimeType = 'audio/mp4' // Default to mp4 for unknown
      console.log('[API Transcribe] Inferred mimeType from filename:', mimeType)
    }

    // Recreate file with correct type
    const fileBlob = new Blob([arrayBuffer], { type: mimeType })
    const reconstructedFile = new File([fileBlob], fileName, { type: mimeType })

    // === DIAGNOSTIC LOGGING END ===

    // Transcribe audio using Groq Whisper
    console.log('[API Transcribe] Sending to Groq Whisper:', {
      fileName: reconstructedFile.name,
      fileSize: reconstructedFile.size,
      fileType: reconstructedFile.type,
    })

    const transcription = await groq.audio.transcriptions.create({
      file: reconstructedFile,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      language: 'en',
    })

    console.log('Groq transcription successful:', {
      textLength: transcription.text?.length || 0,
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
        console.error('Failed to create lecture:', lectureError)
      } else {
        // Upload audio to Supabase storage
        const audioFileName = `${lecture.id}.wav`
        const audioFilePath = `audio-recordings/${userId}/${audioFileName}`

        const { error: uploadError } = await supabase.storage
          .from('audio-recordings')
          .upload(audioFilePath, fileBlob, {
            contentType: audioFile.type || 'audio/webm',
            upsert: true,
          })

        if (uploadError) {
          console.error('Failed to upload audio:', uploadError)
        } else {
          // Get public URL and update lecture
          const { data: { publicUrl } } = supabase.storage
            .from('audio-recordings')
            .getPublicUrl(audioFilePath)

          // Update lecture with audio URL
          await supabase
            .from('lectures')
            .update({ audio_url: publicUrl })
            .eq('id', lecture.id)

          console.log('Audio uploaded successfully:', publicUrl)
        }

        // Save transcript
        const { error: transcriptError } = await supabase.from('transcripts').insert({
          lecture_id: lecture.id,
          user_id: userId,
          content: transcriptText,
        })

        if (transcriptError) {
          console.error('Failed to save transcript:', transcriptError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
    })
  } catch (error: any) {
    // === DIAGNOSTIC ERROR LOGGING START ===

    console.error('Transcription API error caught:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      type: error?.constructor?.name,
    })

    // Log Groq-specific error details
    if (error?.error) {
      console.error('Groq error object:', error.error)
    }
    if (error?.headers) {
      console.error('Error headers:', error.headers)
    }

    // Log the full error for debugging
    console.error('Full error object:', JSON.stringify(error, null, 2))

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
