'use client'

import React from 'react'

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  )
}
