import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (isDark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,

      toggleTheme: () => {
        const newTheme = !get().isDarkMode
        set({ isDarkMode: newTheme })
        
        // Update HTML classes and attributes for proper dark mode
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
          if (newTheme) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },

      setTheme: (isDark: boolean) => {
        set({ isDarkMode: isDark })
        
        // Update HTML classes and attributes for proper dark mode
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }),
    {
      name: 'gavalogy-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state && typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light')
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }
  )
)
