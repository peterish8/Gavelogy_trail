'use client'

import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { cn } from '@/lib/utils'
import { SidebarLogo } from './sidebar-logo'
import { SidebarNav } from './sidebar-nav'
import { SidebarToggle } from './sidebar-toggle'
import { SidebarFooter } from './sidebar-footer'

import { usePathname } from 'next/navigation'

import { useState, useEffect } from 'react'

export function AppSidebar() {
  const { setCollapsed } = useSidebarStore()
  // Use shared effective state hook
  const { isCollapsed, isMounted } = useSidebarState()
  const pathname = usePathname()
  const setIsMobile = useState(false)[1]
  
  const isLandingPage = pathname === "/"
  const isCourseViewerPage = pathname === "/course-viewer"

  // Handle screen resize - close on mobile, respect user preference on desktop
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true) // Auto-close on mobile
      }
      // Don't auto-open on desktop - respect user preference
    }
    
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [setCollapsed, setIsMobile])

  // Do not render sidebar on landing page or course-viewer (has its own sidebar)
  if (isLandingPage || isCourseViewerPage) return null

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        // Before mount: start hidden to avoid flash, then transition to correct state
        !isMounted ? "w-0 opacity-0" : (
          isCollapsed 
            ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none"
            : "w-[240px] opacity-100"
        )
      )}
    >
      {/* Header Area */}
      <div 
        suppressHydrationWarning
        className="flex items-center justify-between h-[60px] px-4 shrink-0"
      >
        {/* Logo */}
        <SidebarLogo compact={false} />
        
        {/* Toggle Button (ChevronsLeft to collapse) - only shows when expanded */}
        <SidebarToggle />
      </div>

      {/* Navigation Area */}
      <div 
        suppressHydrationWarning
        className="flex-1 overflow-y-auto overflow-x-hidden py-4"
      >
        <SidebarNav />
      </div>
      
      {/* User Profile / Footer - Flex pinned to bottom */}
      <div suppressHydrationWarning className="mt-auto shrink-0 bg-sidebar border-t border-sidebar-border/30 pt-2 pb-2">
        <SidebarFooter />
      </div>
    </aside>
  )
}

