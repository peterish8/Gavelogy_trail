'use client'

import React from 'react'

interface SidebarSectionProps {
  title?: string
  children: React.ReactNode
}

export function SidebarSection({ children }: SidebarSectionProps) {
  return (
    <div className="space-y-0.5">
      {children}
    </div>
  )
}
