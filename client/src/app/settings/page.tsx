'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with settings screen active
    router.replace('/dashboard?screen=settings')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Settings...</p>
      </div>
    </div>
  )
}
