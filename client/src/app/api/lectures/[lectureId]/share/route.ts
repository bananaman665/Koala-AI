import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      )
    }

    const { classId } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured', success: false },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user owns this lecture
    const { data: lecture, error: fetchError } = await supabase
      .from('lectures')
      .select('user_id, class_id, title')
      .eq('id', params.lectureId)
      .single()

    if (fetchError || !lecture) {
      return NextResponse.json(
        { error: 'Lecture not found', success: false },
        { status: 404 }
      )
    }

    if (lecture.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not own this lecture', success: false },
        { status: 403 }
      )
    }

    // If classId provided, verify user is owner/member of that class
    if (classId) {
      const { data: membership, error: membershipError } = await supabase
        .from('class_memberships')
        .select('id')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .single()

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'You are not a member of this class', success: false },
          { status: 403 }
        )
      }
    }

    // Update lecture's class_id
    const { error: updateError } = await supabase
      .from('lectures')
      .update({ class_id: classId || null })
      .eq('id', params.lectureId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      previousClassId: lecture.class_id,
      newClassId: classId || null,
      message: classId
        ? `Lecture "${lecture.title}" shared to class`
        : `Lecture "${lecture.title}" unshared from class`,
    })
  } catch (error: any) {
    console.error('[shareLectureEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
