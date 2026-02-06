'use client'

import { useEffect, useCallback } from 'react'

interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
}

export function usePushNotifications() {
  // Initialize OneSignal
  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
          console.warn('NEXT_PUBLIC_ONESIGNAL_APP_ID not configured')
          return
        }

        // Dynamically import OneSignal SDK (only on client side)
        const OneSignal = (await import('react-onesignal')).default

        // Initialize OneSignal
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        })

        // Request notification permissions
        await OneSignal.Slidedown.promptPush()

        // Get subscription ID
        const subscription = await OneSignal.User.pushSubscription.id
        console.log('OneSignal subscription ID:', subscription)

        // Store subscription ID in window for later use
        if (typeof window !== 'undefined') {
          ;(window as any).__onesignalSubscriptionId = subscription
        }

        console.log('OneSignal initialized successfully')
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error)
      }
    }

    if (typeof window !== 'undefined') {
      initializeOneSignal()
    }
  }, [])

  // Handle incoming notifications
  useEffect(() => {
    if (typeof window === 'undefined') return

    const setupListeners = async () => {
      try {
        const OneSignal = (await import('react-onesignal')).default

        // Handle notification clicks
        OneSignal.User.PushSubscription.addEventListener('click', (event) => {
          console.log('Notification clicked:', event)

          const notification = event.notification
          const data = notification.data || {}

          // Handle notification actions based on data
          if (data.action) {
            handleNotificationAction_impl(data.action, data)
          }

          // Show in-app notification
          if (window.__toastNotification) {
            window.__toastNotification({
              title: notification.title || 'Notification',
              body: notification.body || '',
              data,
            })
          }
        })

        // Handle foreground notifications
        OneSignal.Notifications.addEventListener('foreground', (event) => {
          console.log('Foreground notification received:', event)

          const notification = event.notification

          // Show in-app notification for foreground messages
          if (window.__toastNotification) {
            window.__toastNotification({
              title: notification.title || 'Notification',
              body: notification.body || '',
              data: notification.data || {},
            })
          }
        })
      } catch (error) {
        console.error('Failed to set up notification listeners:', error)
      }
    }

    setupListeners()
  }, [])

  // Get OneSignal subscription ID
  const getNotificationToken = useCallback(async () => {
    try {
      const OneSignal = (await import('react-onesignal')).default
      const subscription = await OneSignal.User.pushSubscription.id
      return subscription
    } catch (error) {
      console.error('Failed to get OneSignal subscription ID:', error)
      return null
    }
  }, [])

  // Send a test notification (for development)
  const sendTestNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      console.log('Test notification would be sent via OneSignal dashboard')
      // Notifications are sent through OneSignal dashboard or API
      // Not directly from the app
    } catch (error) {
      console.error('Error with test notification:', error)
    }
  }, [])

  // Set user properties (optional - for segmentation)
  const setUserProperty = useCallback(async (key: string, value: string) => {
    try {
      const OneSignal = (await import('react-onesignal')).default
      OneSignal.User.addTag(key, value)
    } catch (error) {
      console.error('Failed to set user property:', error)
    }
  }, [])

  return {
    getNotificationToken,
    sendTestNotification,
    setUserProperty,
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

// Export function to log events (for analytics)
export async function logOneSignalEvent(eventName: string, properties?: Record<string, any>) {
  try {
    const OneSignal = (await import('react-onesignal')).default
    OneSignal.User.addTag('last_event', eventName)
    console.log('Event logged:', eventName, properties)
  } catch (error) {
    console.error('Error logging event:', error)
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
    __onesignalSubscriptionId?: string
  }
}
