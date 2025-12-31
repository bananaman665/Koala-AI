'use client'

import { ReactNode, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function TouchDetector() {
  useEffect(() => {
    // Detect if device supports touch
    const isTouchDevice = () => {
      if (typeof window === 'undefined') return false

      return (
        'ontouchstart' in window ||
        (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints !== undefined && (navigator as any).msMaxTouchPoints > 0)
      )
    }

    if (isTouchDevice()) {
      document.documentElement.classList.add('touch-device')
    }
  }, [])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <TouchDetector />
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}