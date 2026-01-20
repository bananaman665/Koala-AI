import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { hapticSuccess, hapticError } from '@/lib/haptics'

type Course = Database['public']['Tables']['courses']['Row']

const MAX_COURSES = 5

// Query: Fetch all courses for a user
export function useCourses(userId: string | undefined) {
  return useQuery<Course[]>({
    queryKey: ['courses', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Create default course if none exists
      if (!data || data.length === 0) {
        const { data: newCourse, error: createError } = await (supabase.from('courses') as any)
          .insert([{
            user_id: userId,
            name: 'My Course',
            code: '100',
            professor: 'Prof. Smith',
            category: 'General',
            color: 'blue',
            lectures: 0,
            total_hours: 0,
            last_updated: new Date().toISOString(),
          }])
          .select()
          .single()

        if (createError || !newCourse) return []
        return [newCourse]
      }

      return data
    },
    enabled: !!userId,
  })
}

// Mutation: Create a new course
export function useCreateCourse() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      userId,
      name,
      code,
      professor,
      category,
      color,
    }: {
      userId: string
      name: string
      code: string
      professor: string
      category?: string
      color?: string
    }) => {
      // Check course limit
      const { count } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (count !== null && count >= MAX_COURSES) {
        throw new Error(
          `Course limit reached! You can only create ${MAX_COURSES} courses on the free plan.`
        )
      }

      const { data, error } = await (supabase.from('courses') as any)
        .insert([{
          user_id: userId,
          name: name.trim(),
          code: code.trim(),
          professor: professor.trim(),
          category: category || 'General',
          color: color || 'blue',
          lectures: 0,
          total_hours: 0,
          last_updated: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      hapticSuccess()
      toast.success('Course created successfully')
    },
    onError: (error: Error) => {
      hapticError()
      toast.error(error.message)
    },
  })
}

// Mutation: Delete a course
export function useDeleteCourse() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) => {
      // Delete all lectures in this course first
      await supabase
        .from('lectures')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userId)

      // Delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['lectures'] })
      hapticSuccess()
      toast.success('Course deleted successfully')
    },
    onError: (error: Error) => {
      hapticError()
      toast.error(`Failed to delete course: ${error.message}`)
    },
  })
}