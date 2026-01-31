import { useState, useEffect } from 'react';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

const STORAGE_KEY = 'course-viewer-font-size';

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>('base');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['xs', 'sm', 'base', 'lg', 'xl'].includes(saved)) {
      setFontSizeState(saved as FontSize);
    }
    setLoaded(true);
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_KEY, size);
  };

  return { fontSize, setFontSize, loaded };
}
