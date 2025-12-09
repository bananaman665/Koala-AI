import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { content, maxWords } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    // Generate summary using Groq
    const summary = await generateSummary(content, { maxWords })

    return NextResponse.json({
      success: true,
      summary,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating summary:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
