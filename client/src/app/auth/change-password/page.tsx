'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hapticButton, hapticSuccess, hapticError } from '@/lib/haptics'

export const dynamic = 'force-dynamic'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { updatePassword, user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Password requirements
  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Upper & lowercase letters', met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: 'At least one number', met: /\d/.test(newPassword) },
    { label: 'Special character (!@#$%...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ]

  const metRequirements = requirements.filter(r => r.met).length
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const canSubmit = metRequirements >= 3 && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canSubmit) {
      hapticError()
      setError('Please meet the password requirements')
      return
    }

    setLoading(true)
    hapticButton()

    try {
      await updatePassword(newPassword)
      hapticSuccess()
      setSuccess(true)
    } catch (err: any) {
      hapticError()
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    hapticButton()
    router.back()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-lg">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You need to be signed in to change your password.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {!success ? (
          <>
            {/* Icon Header */}
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-lg">🛡️</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Create a strong password to keep your account secure
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Password</h2>
                </div>

                <div className="p-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-lg">🔒</span>
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showNewPassword ? (
                        <span className="text-lg">👁️‍🗨️</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  {newPassword && (
                    <div className="mt-4 space-y-2">
                      {requirements.map((req, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            req.met
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {req.met ? (
                              <span className="text-lg">✅</span>
                            ) : (
                              <span className="text-lg">❌</span>
                            )}
                          </div>
                          <span className={`text-sm ${
                            req.met
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Password Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confirm Password</h2>
                </div>

                <div className="p-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-lg">🔒</span>
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11 pr-12 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 ${
                        confirmPassword && !passwordsMatch
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <span className="text-lg">👁️‍🗨️</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="mt-3 flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        passwordsMatch
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {passwordsMatch ? (
                          <span className="text-lg">✅</span>
                        ) : (
                          <span className="text-lg">❌</span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        passwordsMatch
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 dark:disabled:text-gray-500 py-4 rounded-xl font-semibold transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Updating...</span>
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center py-12">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-fade-in">
              <span className="text-lg">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Updated!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
              Your password has been successfully changed.
            </p>
            <button
              onClick={() => { hapticButton(); router.push('/settings') }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              Back to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
