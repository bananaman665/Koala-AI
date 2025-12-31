import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
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

    // Get class details
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_memberships(id, user_id, role)
      `)
      .eq('id', params.classId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Class not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[getClassEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if user is the owner
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('owner_id')
      .eq('id', params.classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found', success: false },
        { status: 404 }
      )
    }

    if (classData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only the owner can delete a class', success: false },
        { status: 403 }
      )
    }

    // Delete all memberships first
    await supabase
      .from('class_memberships')
      .delete()
      .eq('class_id', params.classId)

    // Delete the class
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', params.classId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    })
  } catch (error: any) {
    console.error('[deleteClassEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
