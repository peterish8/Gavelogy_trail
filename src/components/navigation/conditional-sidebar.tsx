'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/navigation/app-sidebar'
import { FloatingMenuToggle } from '@/components/navigation/sidebar-toggle'

const NO_SIDEBAR_ROUTES = ['/', '/login', '/signup', '/test-auth']

export function ConditionalSidebar() {
  const pathname = usePathname()
  const hideSidebar = NO_SIDEBAR_ROUTES.includes(pathname) || pathname.startsWith('/login') || pathname.startsWith('/signup')

  if (hideSidebar) return null

  return (
    <>
      <AppSidebar />
      <FloatingMenuToggle />
    </>
  )
}
