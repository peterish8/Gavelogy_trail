"use client";

import { useThemeStore } from "@/lib/stores/theme";

/**
 * Returns inline style object for the arena diamond background.
 * Apply this directly to a page's root div via style={arenaBackgroundStyle}.
 */
export function useArenaBackground() {
  const { isDarkMode } = useThemeStore();

  if (!isDarkMode) {
    return {
      backgroundColor: '#ddd5f0',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='64' height='64' fill='%23ddd5f0'/%3E%3Cpath d='M32 1L63 32L32 63L1 32Z' fill='%23e8e0f8'/%3E%3Cpath d='M32 2L2 32' stroke='%23f0eaff' stroke-width='1.5' fill='none'/%3E%3Cpath d='M32 2L62 32' stroke='%23f0eaff' stroke-width='1.5' fill='none'/%3E%3Cpath d='M62 32L32 62' stroke='%23d0c6e4' stroke-width='1.5' fill='none'/%3E%3Cpath d='M2 32L32 62' stroke='%23d0c6e4' stroke-width='1.5' fill='none'/%3E%3Cpath d='M32 0L64 32L32 64L0 32Z' fill='none' stroke='%23c8bede' stroke-width='0.5'/%3E%3C/svg%3E")`,
      backgroundSize: '64px 64px',
    } as React.CSSProperties;
  }

  return {
    backgroundColor: '#0e0e14',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='64' height='64' fill='%230e0e14'/%3E%3Cpath d='M32 1L63 32L32 63L1 32Z' fill='%2315151d'/%3E%3Cpath d='M32 0L64 32L32 64L0 32Z' fill='none' stroke='%230b0b12' stroke-width='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: '64px 64px',
  } as React.CSSProperties;
}
