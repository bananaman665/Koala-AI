'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with analytics screen active
    router.replace('/dashboard?screen=analytics')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Analytics...</p>
      </div>
    </div>
  )
}
