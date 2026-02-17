'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in → go to dashboard
        router.replace('/dashboard')
      } else {
        // User is not logged in → go to login
        router.replace('/auth/login')
      }
    }
  }, [user, loading, router])

  // Show nothing while redirecting
  return null
}
