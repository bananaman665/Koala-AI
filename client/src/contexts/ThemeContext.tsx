'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

interface ThemeContextType {
  isDark: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true)
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

  // Update iOS status bar style (text/icon color) using Capacitor
  const updateStatusBarStyle = async (dark: boolean) => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Style.Dark = white text (for dark backgrounds)
        // Style.Light = black text (for light backgrounds)
        await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
      } catch (error) {
        console.error('Failed to update status bar style:', error)
      }
    }
  }

  // Load theme preference from localStorage on mount (default to dark mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference')

    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
      updateThemeColor(false)
      updateStatusBarStyle(false)
    } else {
      // Default to dark mode
      setIsDark(true)
      document.documentElement.classList.add('dark')
      updateThemeColor(true)
      updateStatusBarStyle(true)
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
      isDark: true,
      toggleDarkMode: () => {},
    }
  }
  return context
}
