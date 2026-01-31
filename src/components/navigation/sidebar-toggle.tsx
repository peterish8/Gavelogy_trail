'use client'

import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { ChevronsLeft, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

// Floating toggle button - visible when sidebar is collapsed (desktop only)
export function FloatingMenuToggle() {
  const { toggleSidebar } = useSidebarStore()
  const { isCollapsed, isMounted } = useSidebarState()
  const pathname = usePathname()
  
  const isLandingPage = pathname === "/"
  const isCourseViewerPage = pathname === "/course-viewer"
  
  // Don't show on pages without sidebar
  if (isLandingPage || isCourseViewerPage) return null
  
  // Wait for client mount to avoid hydration mismatch
  if (!isMounted) return null
  
  // Only show when collapsed
  if (!isCollapsed) return null

  return (
    <button
      onClick={toggleSidebar}
      suppressHydrationWarning
      className="fixed top-4 left-4 z-60 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-900 hover:shadow-md transition-all duration-200 animate-in fade-in duration-300"
      aria-label="Open Sidebar"
    >
      <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  )
}

// Internal toggle button - shown inside sidebar header when expanded
export function SidebarToggle() {
  const { toggleSidebar } = useSidebarStore()
  const { isCollapsed, isMounted } = useSidebarState()

  // Wait for mount to avoid hydration mismatch
  if (!isMounted) return null
  
  // When collapsed, the FloatingMenuToggle handles opening
  if (isCollapsed) return null

  return (
    <button
      onClick={toggleSidebar}
      suppressHydrationWarning
      className="flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
      aria-label="Collapse Sidebar"
    >
      <ChevronsLeft className="w-5 h-5" />
    </button>
  )
}
