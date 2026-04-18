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
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 group relative pressable",
        active ? "" : "nav-inactive hover:bg-white/10 dark:hover:bg-white/5"
      )}
      style={active ? {
        background: "rgba(75, 42, 214, 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(75, 42, 214, 0.25)",
        boxShadow: "0 2px 8px rgba(75, 42, 214, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        color: "var(--brand)",
      } : {}}
    >
      {/* Icon */}
      <Icon className={cn(
        "w-4 h-4 shrink-0 transition-colors",
        active ? "text-[var(--brand)]" : "text-[var(--ink-3)] group-hover:text-[var(--ink)]"
      )} />
      
      {/* Label - truncate if needed */}
      <span className="truncate">{label}</span>
      
    </Link>
  )
}
