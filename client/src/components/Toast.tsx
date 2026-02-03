'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  isExiting?: boolean
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastIcons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    // First mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t))
    // Then remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 150)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, message, type }])

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-safe pointer-events-none">
        <div className="w-full max-w-sm px-4 space-y-2 pt-2">
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.type]
            return (
              <div
                key={toast.id}
                className={`
                  ${toastStyles[toast.type]}
                  ${toast.isExiting ? 'toast-slide-out' : 'toast-slide-in'}
                  rounded-xl px-4 py-3 shadow-lg flex items-center space-x-3
                  pointer-events-auto
                `}
                onClick={() => removeToast(toast.id)}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
              </div>
            )
          })}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
