"use client"

import { useState, useEffect } from "react"
import { useSidebarStore } from "@/lib/stores/sidebar-store"

export function useSidebarState() {
  const { isCollapsed } = useSidebarStore()
  
  // Hydration state
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Logic: 
  // 1. If we are NOT mounted yet (SSR/Hydration phase), rely strictly on the DOM attribute to match Server/Blocking Script
  // 2. If we ARE mounted, rely strictly on the Zustand Store
  
  // To avoid flicker, we compute the state synchronously based on these flags
  
  let effectiveCollapsed = false // Default assumption (Expanded) if nothing else is known
  
  if (!isMounted) {
     if (typeof window !== 'undefined') {
        const attr = document.documentElement.getAttribute('data-sidebar-state')
        effectiveCollapsed = attr === 'collapsed'
     }
  } else {
     effectiveCollapsed = isCollapsed
  }
  
  return { isCollapsed: effectiveCollapsed, isMounted }
}
