'use client'

import { useEffect, useCallback } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { App } from '@capacitor/app'

interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
}

export function usePushNotifications() {
  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Request notification permissions
        const result = await PushNotifications.requestPermissions()

        if (result.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register()
          console.log('Push notifications registered successfully')
        } else {
          console.log('Push notification permissions denied')
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error)
      }
    }

    initializePushNotifications()
  }, [])

  // Handle incoming notifications
  useEffect(() => {
    const handlePushNotification = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push notification received:', notification)

        const { title, body, data } = notification

        // Show in-app notification
        if (window.__toastNotification) {
          window.__toastNotification({
            title: title || 'Notification',
            body: body || '',
            data,
          })
        }
      }
    )

    return () => {
      handlePushNotification.remove()
    }
  }, [])

  // Handle notification action taps
  useEffect(() => {
    const handleNotificationAction = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push notification action performed:', notification)

        const { notification: notifData } = notification

        // Handle notification actions based on data
        if (notifData.data?.action) {
          handleNotificationAction_impl(notifData.data.action, notifData.data)
        }
      }
    )

    return () => {
      handleNotificationAction.remove()
    }
  }, [])

  // Get notification token for backend
  const getNotificationToken = useCallback(async () => {
    try {
      const result = await PushNotifications.getDeliveryId()
      return result.id
    } catch (error) {
      console.error('Failed to get delivery ID:', error)
      return null
    }
  }, [])

  // Send a test notification (for development)
  const sendTestNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      console.log('Sending test notification:', payload)
      // This is primarily for testing local notifications
      // Production notifications come from your backend
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }, [])

  return {
    getNotificationToken,
    sendTestNotification,
  }
}

// Helper function to handle notification actions
function handleNotificationAction_impl(action: string, data: Record<string, any>) {
  switch (action) {
    case 'open_streak':
      // Navigate to streak/achievements page
      window.location.href = '/profile'
      break
    case 'open_lecture':
      // Navigate to specific lecture
      if (data.lectureId) {
        window.location.href = `/dashboard/lecture/${data.lectureId}`
      }
      break
    case 'open_quiz':
      // Navigate to quiz
      if (data.quizId) {
        window.location.href = `/dashboard/quiz/${data.quizId}`
      }
      break
    default:
      console.log('Unknown notification action:', action)
  }
}

// Export function to send notifications from app (call from backend)
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...payload,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send push notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}

// Extend window object for toast notifications
declare global {
  interface Window {
    __toastNotification?: (notification: {
      title: string
      body: string
      data?: Record<string, any>
    }) => void
  }
}
