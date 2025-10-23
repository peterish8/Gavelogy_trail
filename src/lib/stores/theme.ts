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
        
        // Update HTML attribute for CSS variables
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
        }
      },

      setTheme: (isDark: boolean) => {
        set({ isDarkMode: isDark })
        
        // Update HTML attribute for CSS variables
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
        }
      },
    }),
    {
      name: 'gavalogy-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state && typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light')
        }
      },
    }
  )
)
