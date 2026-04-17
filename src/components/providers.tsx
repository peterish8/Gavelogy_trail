'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/theme'
import { useAuthStore } from '@/lib/stores/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setTheme } = useThemeStore()
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('gavelogy-theme')
    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      setTheme(theme.state.isDarkMode)
    }

    // Check authentication status
    checkAuth()
  }, [setTheme, checkAuth])

  return <>{children}</>
}
