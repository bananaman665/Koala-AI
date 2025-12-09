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
 * Upload audio file to Supabase Storage
 * @param userId - The user's ID
 * @param lectureId - The lecture's ID
 * @param audioBlob - The audio blob to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadAudioFile(
  userId: string,
  lectureId: string,
  audioBlob: Blob
): Promise<string> {
  const fileName = `${lectureId}.wav`
  const filePath = `audio-recordings/${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(filePath, audioBlob, {
      contentType: 'audio/wav',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio-recordings')
    .getPublicUrl(filePath)

  return publicUrl
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
