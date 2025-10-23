import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IST Timezone utility functions
export function getISTDate(): string {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes in milliseconds
  const now = new Date()
  const istTime = new Date(now.getTime() + IST_OFFSET)
  return istTime.toISOString().split('T')[0] // YYYY-MM-DD
}

export function getISTDateTime(): string {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const now = new Date()
  const istTime = new Date(now.getTime() + IST_OFFSET)
  return istTime.toISOString()
}

// Format time in MM:SS format
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Format time in HH:MM:SS format
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Calculate accuracy percentage
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

// Calculate coins based on accuracy
export function calculateCoins(accuracy: number, isMockTest: boolean = false): number {
  if (isMockTest) {
    if (accuracy >= 80) return 50
    if (accuracy >= 60) return 30
    return 15
  } else {
    if (accuracy >= 80) return 10
    if (accuracy >= 60) return 7
    return 3
  }
}

// Generate order ID for payments
export function generateOrderId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD_${dateStr}_${timeStr}_${random}`
}

// Check if user has access to a course
export async function checkUserCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase')
    const { data, error } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error || !data) return false
    return true
  } catch (error) {
    console.error('Error checking course access:', error)
    return false
  }
}

// Debounce function for auto-save
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage helpers
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: unknown) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore errors
    }
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
}
