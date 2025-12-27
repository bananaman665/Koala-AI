import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { hapticSuccess, hapticError } from '@/lib/haptics'

type Lecture = Database['public']['Tables']['lectures']['Row']
type LectureWithCourse = Lecture & {
  courses?: {
    name: string
    code: string
    color: string
  } | null
}

// Query: Fetch all lectures for a user
export function useLectures(userId: string | undefined) {
  return useQuery<LectureWithCourse[]>({
    queryKey: ['lectures', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      
      const { data, error } = await supabase
        .from('lectures')
        .select('*, courses(name, code, color)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

// Query: Fetch a single lecture with notes
export function useLecture(lectureId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: ['lecture', lectureId, userId],
    queryFn: async () => {
      if (!lectureId || !userId) throw new Error('Lecture ID and User ID are required')

      // Fetch lecture details
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .select('*, courses(name, code, color)')
        .eq('id', lectureId)
        .eq('user_id', userId)
        .single()

      if (lectureError) throw lectureError

      // Fetch notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('content')
        .eq('lecture_id', lectureId)
        .single()

      return {
        lecture,
        notes: notes?.content || null,
      }
    },
    enabled: !!lectureId && !!userId,
  })
}

// Mutation: Delete a lecture
export function useDeleteLecture() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ lectureId, userId }: { lectureId: string; userId: string }) => {
      // Delete associated notes first
      await supabase
        .from('notes')
        .delete()
        .eq('lecture_id', lectureId)

      // Delete the lecture
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lectureId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
      hapticSuccess()
      toast.success('Lecture deleted successfully')
    },
    onError: (error: Error) => {
      hapticError()
      toast.error(`Failed to delete lecture: ${error.message}`)
    },
  })
}

// Mutation: Update lecture notes
export function useUpdateNotes() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      lectureId,
      userId,
      content,
    }: {
      lectureId: string
      userId: string
      content: string
    }) => {
      const { error } = await supabase
        .from('notes')
        .update({ content })
        .eq('lecture_id', lectureId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lecture', variables.lectureId] })
      hapticSuccess()
      toast.success('Notes saved successfully')
    },
    onError: (error: Error) => {
      hapticError()
      toast.error(`Failed to save notes: ${error.message}`)
    },
  })
}