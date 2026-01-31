'use client'

import React from 'react'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

import { GlobalLoader } from '@/components/global-loader'
import { useLoadingStore } from '@/lib/stores/loading-store'

export function SidebarLayoutClient({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMounted } = useSidebarState()
  const { setLoading } = useLoadingStore()
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const isCourseViewerPage = pathname === "/course-viewer"
  
  // Pages without sidebar don't need left padding
  const hasCustomLayout = isLandingPage || isCourseViewerPage
  
  // Sync state to DOM attribute for CSS-based blocking script compatibility
  React.useEffect(() => {
    if (isMounted) {
      document.documentElement.setAttribute('data-sidebar-state', isCollapsed ? 'collapsed' : 'expanded')
    }
  }, [isCollapsed, isMounted])

  // Route-based loading logic
  React.useEffect(() => {
    // If not on dashboard, ensure loader is dismissed immediately to prevent blocking
    if (pathname !== '/dashboard') {
      setLoading(false)
    }
  }, [pathname, setLoading])
  
  // Compute padding:
  // - Before mount: no padding (content at left edge, sidebar hidden)
  // - After mount: apply padding based on sidebar state
  const getPaddingClass = () => {
    if (hasCustomLayout) return ''
    if (!isMounted) return 'lg:pl-0' // Start with no padding until mounted
    return isCollapsed ? 'lg:pl-0' : 'lg:pl-[240px]'
  }
  
  return (
    <div 
      suppressHydrationWarning
      className={cn(
        "flex min-h-screen transition-all duration-300 ease-in-out",
        getPaddingClass()
      )}
    >
      <GlobalLoader />
      {children}
    </div>
  )
}

