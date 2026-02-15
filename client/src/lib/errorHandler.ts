/**
 * User-friendly error messages for common error scenarios
 */

export interface FriendlyError {
  title: string
  message: string
  suggestedAction?: string
}

/**
 * Maps HTTP status codes to user-friendly error messages
 */
const HTTP_STATUS_MESSAGES: Record<number, FriendlyError> = {
  400: {
    title: 'Invalid Request',
    message: 'The request was invalid. Please try again with different settings.',
    suggestedAction: 'Check your input and try again'
  },
  401: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    suggestedAction: 'Sign in'
  },
  403: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    suggestedAction: 'Contact support if you believe this is an error'
  },
  404: {
    title: 'Not Found',
    message: 'The resource you\'re looking for doesn\'t exist or has been deleted.',
    suggestedAction: 'Go back and try again'
  },
  429: {
    title: 'Too Many Requests',
    message: 'You\'re doing this too frequently. Please wait a moment and try again.',
    suggestedAction: 'Wait a few seconds and retry'
  },
  500: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified.',
    suggestedAction: 'Try again in a few moments'
  },
  502: {
    title: 'Service Unavailable',
    message: 'We\'re experiencing technical difficulties. Please try again shortly.',
    suggestedAction: 'Refresh and try again'
  },
  503: {
    title: 'Service Maintenance',
    message: 'We\'re temporarily down for maintenance. We\'ll be back soon.',
    suggestedAction: 'Check back in a few minutes'
  },
  504: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    suggestedAction: 'Try again'
  }
}

/**
 * Maps error keywords/patterns to user-friendly messages
 */
const ERROR_PATTERN_MESSAGES: Record<string, FriendlyError> = {
  'network': {
    title: 'Connection Error',
    message: 'We couldn\'t connect to the server. Check your internet connection and try again.',
    suggestedAction: 'Check your internet and retry'
  },
  'timeout': {
    title: 'Request Timed Out',
    message: 'The request took too long to complete. Please try again.',
    suggestedAction: 'Try again'
  },
  'parse': {
    title: 'Invalid Response',
    message: 'We received an unexpected response. Please try again.',
    suggestedAction: 'Retry the action'
  },
  'offline': {
    title: 'You\'re Offline',
    message: 'Check your internet connection and try again.',
    suggestedAction: 'Connect to the internet'
  },
  'ai': {
    title: 'Generation Failed',
    message: 'We couldn\'t generate the content. Please try again.',
    suggestedAction: 'Try again'
  },
  'quota': {
    title: 'Quota Exceeded',
    message: 'You\'ve reached your limit for this action. Try again later.',
    suggestedAction: 'Wait and try again'
  },
  'auth': {
    title: 'Authentication Error',
    message: 'Please sign in and try again.',
    suggestedAction: 'Sign in'
  }
}

/**
 * Converts an HTTP status code to a friendly error
 */
export function getErrorFromStatus(status: number | null | undefined): FriendlyError {
  if (!status) {
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      suggestedAction: 'Retry'
    }
  }

  return HTTP_STATUS_MESSAGES[status] || {
    title: 'Something Went Wrong',
    message: `An error occurred (${status}). Please try again.`,
    suggestedAction: 'Retry'
  }
}

/**
 * Analyzes an error and returns a user-friendly message
 */
export function getFriendlyError(error: any): FriendlyError {
  if (!error) {
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      suggestedAction: 'Retry'
    }
  }

  // Check for HTTP status errors from fetch responses
  if (error.status) {
    return getErrorFromStatus(error.status)
  }

  // Check error message for patterns
  const message = (error.message || error.toString() || '').toLowerCase()

  // Check for specific patterns
  for (const [pattern, friendlyError] of Object.entries(ERROR_PATTERN_MESSAGES)) {
    if (message.includes(pattern)) {
      return friendlyError
    }
  }

  // Check for API-specific error messages that should be passed through
  if (error.message && typeof error.message === 'string') {
    // If it's already a user-friendly message from the API, use it
    if (
      error.message.includes('Failed') ||
      error.message.includes('missing') ||
      error.message.includes('invalid') ||
      error.message.includes('too short')
    ) {
      return {
        title: 'Request Failed',
        message: error.message,
        suggestedAction: 'Try again with different settings'
      }
    }
  }

  // Default fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    suggestedAction: 'Retry'
  }
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    error instanceof TypeError
  )
}

/**
 * Checks if error is an auth error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('session') ||
    error.status === 401
  )
}

/**
 * Sanitizes error message for display (removes technical details)
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove stack traces
  if (message.includes('\n')) {
    message = message.split('\n')[0]
  }

  // Remove "Error: " prefix
  message = message.replace(/^Error:\s*/i, '')

  // Truncate very long messages
  if (message.length > 150) {
    message = message.substring(0, 147) + '...'
  }

  return message
}

/**
 * Logs error to console with context (only in development)
 */
export function logError(context: string, error: any, additionalData?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, {
      message: error?.message,
      status: error?.status,
      stack: error?.stack,
      ...additionalData
    })
  }
}
