'use client'

import { cn } from '@/lib/utils'

interface SidebarLogoProps {
  compact?: boolean
}

export function SidebarLogo({ compact }: SidebarLogoProps) {
  return (
    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
      <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center shrink-0">
        <span className="text-sidebar-primary-foreground font-bold">G</span>
      </div>
      <span 
        suppressHydrationWarning
        className={cn(
          "font-semibold text-lg tracking-tight text-sidebar-foreground animate-in fade-in duration-300",
          compact && "hidden"
        )}
      >
        Gavelogy
      </span>
    </div>
  )
}
