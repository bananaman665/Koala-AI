import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Reorganize audio file from temp ID to final lecture ID
 * This endpoint handles moving/renaming uploaded audio files
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, tempId, lectureId, extension } = await request.json()

    // Validation
    if (!userId || !tempId || !lectureId || !extension) {
      return NextResponse.json(
        { error: 'userId, tempId, lectureId, and extension are required' },
        { status: 400 }
      )
    }

    console.log('[reorganizeAudioEndpoint] Starting reorganization:', {
      userId,
      tempId,
      lectureId,
      extension,
    })

    // Initialize Supabase with service role key (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[reorganizeAudioEndpoint] Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server misconfigured: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Construct file paths
    const oldPath = `${userId}/${tempId}.${extension}`
    const newPath = `${userId}/${lectureId}.${extension}`

    console.log('[reorganizeAudioEndpoint] Moving from:', oldPath, 'to:', newPath)

    // Download the temp file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio-recordings')
      .download(oldPath)

    if (downloadError) {
      console.error('[reorganizeAudioEndpoint] Failed to download temp file:', downloadError)
      return NextResponse.json(
        {
          error: 'Failed to reorganize audio file',
          details: downloadError.message,
        },
        { status: 500 }
      )
    }

    if (!fileData) {
      console.error('[reorganizeAudioEndpoint] Temp file not found:', oldPath)
      return NextResponse.json(
        { error: 'Temp file not found' },
        { status: 404 }
      )
    }

    // Upload to new location with lecture ID
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-recordings')
      .upload(newPath, fileData, { upsert: true })

    if (uploadError) {
      console.error('[reorganizeAudioEndpoint] Failed to upload new file:', uploadError)
      return NextResponse.json(
        {
          error: 'Failed to reorganize audio file',
          details: uploadError.message,
        },
        { status: 500 }
      )
    }

    console.log('[reorganizeAudioEndpoint] New file uploaded:', uploadData)

    // Delete temp file
    const { error: deleteError } = await supabase.storage
      .from('audio-recordings')
      .remove([oldPath])

    if (deleteError) {
      console.warn('[reorganizeAudioEndpoint] Failed to delete temp file (non-critical):', deleteError)
      // Don't fail if temp file deletion fails - the new file is already uploaded
    } else {
      console.log('[reorganizeAudioEndpoint] Temp file deleted successfully')
    }

    // Get the new public URL
    const { data: { publicUrl: newAudioUrl } } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(newPath)

    console.log('[reorganizeAudioEndpoint] New public URL:', newAudioUrl)

    return NextResponse.json({
      success: true,
      url: newAudioUrl,
      filePath: newPath,
      reorganizedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[reorganizeAudioEndpoint] Exception:', error)
    return NextResponse.json(
      {
        error: 'Failed to reorganize audio file',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
