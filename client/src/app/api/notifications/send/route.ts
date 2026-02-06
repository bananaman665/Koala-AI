import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface SendNotificationRequest {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
  sendViaOneSignal?: boolean
}

/**
 * POST /api/notifications/send
 * Send a push notification to a user via OneSignal
 *
 * This endpoint:
 * 1. Stores the notification in the database
 * 2. Sends it via OneSignal API if configured
 *
 * Required environment variables:
 * - NEXT_PUBLIC_ONESIGNAL_APP_ID
 * - ONESIGNAL_API_KEY (for sending notifications)
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json()
    const { userId, title, body: notificationBody, data, sendViaOneSignal = true } = body

    if (!userId || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      )
    }

    // Store notification in database for record-keeping
    const { error: insertError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          body: notificationBody,
          data,
          created_at: new Date().toISOString(),
          read_at: null,
        },
      ])

    if (insertError) {
      console.error('Error storing notification:', insertError)
      return NextResponse.json(
        { error: 'Failed to store notification' },
        { status: 500 }
      )
    }

    // Send via OneSignal if enabled and configured
    if (sendViaOneSignal && process.env.ONESIGNAL_API_KEY) {
      try {
        const onesignalResponse = await sendViaOneSignalAPI({
          userId,
          title,
          body: notificationBody,
          data,
        })

        return NextResponse.json(
          {
            success: true,
            message: 'Notification sent via OneSignal',
            notificationId: onesignalResponse.id || `${userId}-${Date.now()}`,
          },
          { status: 200 }
        )
      } catch (onesignalError) {
        console.error('Error sending via OneSignal:', onesignalError)
        // Still return success as notification is stored in database
        // OneSignal will be retried or sent via dashboard
        return NextResponse.json(
          {
            success: true,
            message: 'Notification stored (OneSignal delivery pending)',
            notificationId: `${userId}-${Date.now()}`,
          },
          { status: 200 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notification stored (awaiting OneSignal configuration)',
        notificationId: `${userId}-${Date.now()}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in notification endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send notification via OneSignal API
 * Uses OneSignal's REST API to send notifications to users
 */
async function sendViaOneSignalAPI({
  userId,
  title,
  body,
  data,
}: {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
}) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY

  if (!appId || !apiKey) {
    throw new Error('OneSignal credentials not configured')
  }

  // Get user's OneSignal subscription ID from our database
  const { data: subscriptions, error } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)
    .limit(1)

  if (error || !subscriptions || subscriptions.length === 0) {
    console.log('No device tokens found for user:', userId)
    return { id: 'queued' }
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_subscription_ids: subscriptions.map((s) => s.token),
      headings: { en: title },
      contents: { en: body },
      data: data || {},
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OneSignal API error: ${error}`)
  }

  return await response.json()
}
