/**
 * Design System Tokens
 * Centralized design values for consistent styling across the app
 */

export const spacing = {
  card: {
    padding: 'p-4 sm:p-6',
    paddingSmall: 'p-3 sm:p-4',
    gap: 'space-y-4',
    gapSmall: 'space-y-3',
  },
  section: {
    padding: 'px-4 sm:px-6 lg:px-8',
    paddingY: 'py-4 sm:py-8',
    margin: 'mb-6 sm:mb-8',
  },
  list: {
    gap: 'space-y-3',
  },
} as const

export const borderRadius = {
  card: 'rounded-xl',
  button: 'rounded-lg',
  input: 'rounded-lg',
  modal: 'rounded-2xl',
  badge: 'rounded-full',
} as const

export const shadows = {
  card: 'shadow-sm hover:shadow-md',
  cardActive: 'shadow-md',
  modal: 'shadow-2xl',
  button: 'shadow-lg',
} as const

export const transitions = {
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
} as const

export const colors = {
  primary: {
    bg: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
    text: 'text-violet-600',
    border: 'border-violet-600',
  },
  secondary: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    hover: 'hover:bg-gray-300 dark:hover:bg-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  success: {
    bg: 'bg-green-500',
    hover: 'hover:bg-green-600',
    text: 'text-green-600 dark:text-green-400',
    bgLight: 'bg-green-50 dark:bg-green-500/10',
    border: 'border-green-500',
  },
  danger: {
    bg: 'bg-red-500',
    hover: 'hover:bg-red-600',
    text: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-500',
  },
  warning: {
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-600',
    text: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-500',
  },
} as const

export const typography = {
  heading: {
    h1: 'text-2xl sm:text-3xl font-bold',
    h2: 'text-xl sm:text-2xl font-bold',
    h3: 'text-lg sm:text-xl font-semibold',
  },
  body: {
    base: 'text-base',
    small: 'text-sm',
    large: 'text-lg',
  },
} as const