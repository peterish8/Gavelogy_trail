"use client";

import { useEffect } from 'react';
import { initializeCache } from '@/lib/data-loader';

export function CacheInitializer() {
  useEffect(() => {
    // Initialize cache on app startup
    initializeCache();
  }, []);

  return null; // This component doesn't render anything
}