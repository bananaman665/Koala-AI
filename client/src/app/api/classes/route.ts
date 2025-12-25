import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      )
    }

    const { name, code, professor, description, color } = await request.json()

    if (!name || !code || !professor) {
      return NextResponse.json(
        { error: 'Name, code, and professor are required', success: false },
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

    // Create the class
    const { data, error } = await supabase
      .from('classes')
      .insert({
        owner_id: userId,
        name,
        code,
        professor,
        description: description || '',
        color: color || 'blue'
      })
      .select()
      .single()

    if (error) {
      console.error('[createClassEndpoint] Error creating class:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    // Add owner as member
    await supabase
      .from('class_memberships')
      .insert({
        class_id: data.id,
        user_id: userId,
        role: 'instructor'
      })

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[createClassEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get all classes the user owns or is a member of
    // First get classes where user is owner
    const { data: ownedClasses, error: ownedError } = await supabase
      .from('classes')
      .select(`
        *,
        class_memberships(id, user_id, role)
      `)
      .eq('owner_id', userId)

    if (ownedError && ownedError.code !== 'PGRST116') {
      console.error('[getClassesEndpoint] Error fetching owned classes:', ownedError)
      return NextResponse.json(
        { error: ownedError.message, success: false },
        { status: 500 }
      )
    }

    // Then get classes where user is a member (but not owner)
    const { data: memberClasses, error: memberError } = await supabase
      .from('class_memberships')
      .select(`
        class_id,
        classes(
          id,
          owner_id,
          name,
          code,
          professor,
          description,
          color,
          created_at,
          updated_at,
          class_memberships(id, user_id, role)
        )
      `)
      .eq('user_id', userId)
      .not('classes', 'is', null)

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('[getClassesEndpoint] Error fetching member classes:', memberError)
      return NextResponse.json(
        { error: memberError.message, success: false },
        { status: 500 }
      )
    }

    // Combine and deduplicate
    const allClasses = [...(ownedClasses || []), ...(memberClasses || []).map((m: any) => m.classes)].filter((cls, index, self) =>
      self.findIndex(c => c.id === cls.id) === index
    )

    return NextResponse.json({
      success: true,
      data: allClasses || []
    })
  } catch (error: any) {
    console.error('[getClassesEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
