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
}

/**
 * POST /api/notifications/send
 * Send a push notification to a user
 *
 * This endpoint stores the notification in the database.
 * For actual push delivery, you'll need Firebase Cloud Messaging (FCM)
 * or another push service configured.
 *
 * Firebase Cloud Messaging Setup:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Cloud Messaging
 * 3. Get your Server API Key from Project Settings
 * 4. Add FIREBASE_SERVER_KEY to environment variables
 * 5. Store device tokens in your database when users register
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json()
    const { userId, title, body: notificationBody, data } = body

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

    // TODO: Send actual push notification via Firebase Cloud Messaging
    // This requires:
    // 1. Device registration tokens stored in database
    // 2. Firebase Cloud Messaging API key
    // 3. Call to FCM API to deliver notification
    //
    // Example Firebase Cloud Messaging call:
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     to: deviceToken,
    //     notification: {
    //       title,
    //       body: notificationBody,
    //     },
    //     data,
    //   }),
    // })

    return NextResponse.json(
      {
        success: true,
        message: 'Notification queued for delivery',
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
