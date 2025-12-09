'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LibraryRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with library screen active
    router.replace('/dashboard?screen=library')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Library...</p>
      </div>
    </div>
  )
}
