'use client'

import { cn } from '@/lib/utils'

interface SidebarLogoProps {
  compact?: boolean
}

export function SidebarLogo({ compact }: SidebarLogoProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
      {/* Rounded square mark — matches design screenshot */}
      <div
        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: "var(--brand)" }}
      >
        <span className="text-white font-bold text-base leading-none">G</span>
      </div>
      <span
        suppressHydrationWarning
        className={cn(
          "font-bold text-lg tracking-tight text-[var(--ink)] animate-in fade-in duration-300",
          compact && "hidden"
        )}
        style={{ fontFamily: "var(--display-family)", letterSpacing: "-0.02em" }}
      >
        Gavelogy
      </span>
    </div>
  )
}
