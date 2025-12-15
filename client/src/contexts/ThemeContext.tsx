'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load theme preference from localStorage on mount (default to light mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference')

    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      // Default to light mode (ignore system preference)
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }

    setIsMounted(true)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme-preference', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme-preference', 'light')
    }
  }

  // Prevent hydration mismatch
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return safe defaults during SSR/static generation instead of throwing
  if (context === undefined) {
    return {
      isDark: false,
      toggleDarkMode: () => {},
    }
  }
  return context
}
