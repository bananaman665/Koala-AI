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

  // Update theme-color meta tag for iOS status bar
  const updateThemeColor = (dark: boolean) => {
    const themeColor = dark ? '#111827' : '#ffffff' // gray-900 for dark, white for light
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', themeColor)
  }

  // Update iOS status bar style (text/icon color)
  const updateStatusBarStyle = (dark: boolean) => {
    // black-translucent = white text, default = black text
    const style = dark ? 'black-translucent' : 'default'
    let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (!metaStatusBar) {
      metaStatusBar = document.createElement('meta')
      metaStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
      document.head.appendChild(metaStatusBar)
    }
    metaStatusBar.setAttribute('content', style)
  }

  // Load theme preference from localStorage on mount (default to light mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference')

    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
      updateThemeColor(true)
      updateStatusBarStyle(true)
    } else {
      // Default to light mode (ignore system preference)
      setIsDark(false)
      document.documentElement.classList.remove('dark')
      updateThemeColor(false)
      updateStatusBarStyle(false)
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
    updateThemeColor(newDarkMode)
    updateStatusBarStyle(newDarkMode)
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
