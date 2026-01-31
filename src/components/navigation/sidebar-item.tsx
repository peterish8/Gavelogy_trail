'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  href: string
  active?: boolean
  indicatorColor?: string
  onClick?: () => void
}

export function SidebarItem({ icon: Icon, label, href, active, indicatorColor, onClick }: SidebarItemProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group relative",
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      {/* Indicator dot for active item */}
      {active && indicatorColor && (
        <span 
          className="absolute left-1 w-1 h-4 rounded-r-md" 
          style={{ backgroundColor: indicatorColor }}
        />
      )}
      
      {/* Icon */}
      <Icon className={cn(
        "w-4 h-4 shrink-0",
        active && indicatorColor ? `text-[${indicatorColor}]` : ""
      )} style={active && indicatorColor ? { color: indicatorColor } : {}} />
      
      {/* Label - truncate if needed */}
      <span className="truncate">{label}</span>
      
      {/* Simple dots for context menu (visual only for now) */}
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-[2px]">
           <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
           <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
           <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
        </div>
      </div>
    </Link>
  )
}
