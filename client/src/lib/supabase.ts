import { createClient } from '@supabase/supabase-js'

// Use dummy values if not configured (for test mode)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if Supabase is properly configured
export const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          display_name: string | null
          university: string | null
          plan: 'free' | 'pro' | 'enterprise'
          storage_used: number
          monthly_minutes_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          display_name?: string | null
          university?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          storage_used?: number
          monthly_minutes_used?: number
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          display_name?: string | null
          university?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          storage_used?: number
          monthly_minutes_used?: number
        }
      }
      courses: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          professor: string
          category: string
          color: string
          lectures: number
          total_hours: number
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          code: string
          professor: string
          category?: string
          color?: string
          lectures?: number
          total_hours?: number
          last_updated?: string
        }
        Update: {
          name?: string
          code?: string
          professor?: string
          category?: string
          color?: string
          lectures?: number
          total_hours?: number
          last_updated?: string
        }
      }
      lectures: {
        Row: {
          id: string
          user_id: string
          course_id: string
          title: string
          duration: number
          audio_url: string | null
          transcription_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          course_id: string
          title: string
          duration: number
          audio_url?: string | null
          transcription_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Update: {
          title?: string
          duration?: number
          audio_url?: string | null
          transcription_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
      }
      transcripts: {
        Row: {
          id: string
          lecture_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          lecture_id: string
          user_id: string
          content: string
        }
      }
      notes: {
        Row: {
          id: string
          lecture_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          lecture_id: string
          user_id: string
          content: string
        }
        Update: {
          content?: string
        }
      }
    }
  }
}

// Supabase client for auth, database, and storage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * Upload audio file to Supabase Storage via backend API
 * This bypasses RLS issues by using the server-side service role key
 * @param userId - The user's ID
 * @param lectureId - The lecture's ID
 * @param audioBlob - The audio blob to upload
 * @returns Object with public URL and file extension
 */
export async function uploadAudioFile(
  userId: string,
  lectureId: string,
  audioBlob: Blob
): Promise<{ url: string; extension: string }> {
  const mimeType = audioBlob.type || 'audio/webm'

  console.log('[uploadAudioFile] Starting upload:', {
    userId,
    lectureId,
    blobSize: audioBlob.size,
    blobType: audioBlob.type,
    mimeType
  })

  try {
    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('file', audioBlob, `audio.${mimeType.split('/')[1] || 'webm'}`)
    formData.append('userId', userId)
    formData.append('lectureId', lectureId)

    console.log('[uploadAudioFile] Sending to backend API...')

    // Call backend API endpoint
    const response = await fetch('/api/audio/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[uploadAudioFile] Backend API error:', {
        status: response.status,
        error: data.error,
        details: data.details,
      })
      throw new Error(`Upload failed: ${data.error} - ${data.details || ''}`)
    }

    // Validate the returned URL
    if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
      console.error('[uploadAudioFile] Invalid URL returned from API:', {
        url: data.url,
        type: typeof data.url,
        length: data.url?.length || 0,
      })
      throw new Error(`Invalid URL returned from upload: ${JSON.stringify(data.url)}`)
    }

    console.log('[uploadAudioFile] Upload successful:', {
      url: data.url,
      urlLength: data.url.length,
      hasHttps: data.url.startsWith('https://'),
      extension: data.extension,
      filePath: data.filePath,
    })

    return { url: data.url, extension: data.extension }
  } catch (error: any) {
    console.error('[uploadAudioFile] Upload error:', {
      message: error.message,
      cause: error.cause,
    })
    throw new Error(`Failed to upload audio: ${error.message}`)
  }
}

/**
 * Reorganize audio file from temp ID to final lecture ID
 * @param userId - The user's ID
 * @param tempId - The temporary ID used for initial upload
 * @param lectureId - The final lecture ID
 * @param extension - The file extension
 * @returns The new public URL
 */
export async function reorganizeAudioFile(
  userId: string,
  tempId: string,
  lectureId: string,
  extension: string
): Promise<string> {
  console.log('[reorganizeAudioFile] Starting reorganization:', {
    userId,
    tempId,
    lectureId,
    extension,
  })

  try {
    const response = await fetch('/api/audio/reorganize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        tempId,
        lectureId,
        extension,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[reorganizeAudioFile] Backend API error:', {
        status: response.status,
        error: data.error,
        details: data.details,
      })
      throw new Error(`Reorganization failed: ${data.error} - ${data.details || ''}`)
    }

    console.log('[reorganizeAudioFile] Reorganization successful:', {
      url: data.url,
      filePath: data.filePath,
    })

    return data.url
  } catch (error: any) {
    console.error('[reorganizeAudioFile] Error:', {
      message: error.message,
      cause: error.cause,
    })
    throw new Error(`Failed to reorganize audio file: ${error.message}`)
  }
}

/**
 * Delete audio file from Supabase Storage
 * @param userId - The user's ID
 * @param lectureId - The lecture's ID
 */
export async function deleteAudioFile(
  userId: string,
  lectureId: string
): Promise<void> {
  const filePath = `audio-recordings/${userId}/${lectureId}.wav`

  const { error } = await supabase.storage
    .from('audio-recordings')
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete audio: ${error.message}`)
  }
}

/**
 * Get download URL for an audio file
 * @param userId - The user's ID
 * @param lectureId - The lecture's ID
 * @returns Download URL
 */
export async function getAudioDownloadUrl(
  userId: string,
  lectureId: string
): Promise<string> {
  const filePath = `audio-recordings/${userId}/${lectureId}.wav`

  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .createSignedUrl(filePath, 3600) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get download URL: ${error.message}`)
  }

  return data.signedUrl
}
