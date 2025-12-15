'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import AppIcon from '@/components/AppIcon'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <AppIcon size="xl" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Koala.ai
          </span>
        </Link>

        {/* Reset Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-600">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {/* Back to Login */}
              <Link
                href="/auth/login"
                className="flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mt-6"
              >
                <FiArrowLeft />
                <span>Back to login</span>
              </Link>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <FiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                <p className="text-gray-600 mb-6">
                  We've sent password reset instructions to
                </p>
                <p className="text-blue-600 font-medium mb-8">{email}</p>
                <p className="text-sm text-gray-500 mb-8">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    try another email address
                  </button>
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft />
                  <span>Back to login</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
