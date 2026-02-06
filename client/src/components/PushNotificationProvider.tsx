'use client'

import { ReactNode } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useToast } from './Toast'

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { info } = useToast()

  // Initialize push notifications and set up global toast handler
  usePushNotifications()

  // Set up global toast notification handler for push notifications
  if (typeof window !== 'undefined') {
    window.__toastNotification = (notification) => {
      info(`${notification.title}: ${notification.body}`)
    }
  }

  return <>{children}</>
}
