import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get form data with file
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const lectureId = formData.get('lectureId') as string

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!userId || !lectureId) {
      return NextResponse.json(
        { error: 'userId and lectureId are required' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    console.log('[uploadAudioEndpoint] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId,
      lectureId,
    })

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    // Determine file extension based on actual MIME type
    const mimeType = file.type || 'audio/webm'
    let extension = 'webm'
    if (mimeType.includes('aac')) extension = 'm4a'
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) extension = 'm4a'
    else if (mimeType.includes('wav')) extension = 'wav'
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) extension = 'mp3'
    else if (mimeType.includes('ogg')) extension = 'ogg'

    // Initialize Supabase with service role key (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[uploadAudioEndpoint] Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server misconfigured: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Construct file path
    const fileName = `${lectureId}.${extension}`
    const filePath = `${userId}/${fileName}`

    console.log('[uploadAudioEndpoint] Uploading to path:', filePath)

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.error('[uploadAudioEndpoint] Upload failed:', {
        message: error.message,
        status: (error as any).status,
        statusCode: (error as any).statusCode,
        name: error.name,
      })
      return NextResponse.json(
        {
          error: 'Failed to upload audio file',
          details: error.message,
        },
        { status: 500 }
      )
    }

    console.log('[uploadAudioEndpoint] Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(filePath)

    // Validate the public URL format
    if (!publicUrl || typeof publicUrl !== 'string' || publicUrl.trim() === '') {
      console.error('[uploadAudioEndpoint] Invalid public URL returned:', {
        publicUrl,
        type: typeof publicUrl,
        length: publicUrl?.length || 0,
      })
      return NextResponse.json(
        {
          error: 'Failed to get public URL from storage',
          details: 'Public URL is empty or invalid',
        },
        { status: 500 }
      )
    }

    console.log('[uploadAudioEndpoint] Public URL:', {
      url: publicUrl,
      length: publicUrl.length,
      hasHttps: publicUrl.startsWith('https://'),
      hasFilePath: publicUrl.includes(filePath),
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      extension,
      filePath,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[uploadAudioEndpoint] Exception:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload audio file',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
