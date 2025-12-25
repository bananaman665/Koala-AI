import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required', success: false },
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

    // Search for class by code
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[searchClassEndpoint] Error searching for class:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[searchClassEndpoint] Exception:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
