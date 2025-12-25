import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured', success: false },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is already a member
    const { data: existing } = await supabase
      .from('class_memberships')
      .select('*')
      .eq('class_id', params.classId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: 'You are already a member of this class' }, success: false },
        { status: 400 }
      )
    }

    // Add user to class
    const { error } = await supabase
      .from('class_memberships')
      .insert({
        class_id: params.classId,
        user_id: userId,
        role: 'student'
      })

    if (error) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined class'
    })
  } catch (error: any) {
    console.error('[joinClassEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
