'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Highlighter } from 'lucide-react';
import { HIGHLIGHT_COLORS, saveHighlight } from '@/lib/highlight-storage';

interface HighlightToolbarProps {
  courseId: string;
  itemId: string;
  contentContainerId: string;
  onHighlightApplied: () => void;  // Called after highlight is saved
  onHighlightAdd?: (highlight: any) => void; // For history tracking
}

export function HighlightToolbar({ 
  courseId, 
  itemId, 
  contentContainerId,
  onHighlightApplied,
  onHighlightAdd
}: HighlightToolbarProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    
    // Only require 1+ character of text
    if (!sel || !text || text.length < 1) {
      setPosition(null);
      setSelectedText('');
      return;
    }

    // Check if selection is within our content container
    const container = document.getElementById(contentContainerId);
    if (!container) {
      setPosition(null);
      setSelectedText('');
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      
      // Simple check: is the selected text physically within the container element?
      // Get the actual start element (not text node)
      let startElement = range.startContainer;
      if (startElement.nodeType === Node.TEXT_NODE) {
        startElement = startElement.parentElement as Node;
      }
      
      // If the start element is inside container, show the toolbar
      if (!container.contains(startElement)) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // Position toolbar BELOW selection
      const rect = range.getBoundingClientRect();
      
      // Make sure rect is valid (has some size)
      if (rect.width === 0 && rect.height === 0) {
        setPosition(null);
        setSelectedText('');
        return;
      }
      
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10,  // No scrollY needed - fixed positioning uses viewport coords
      });
      setSelectedText(text);
    } catch (e) {
      // Selection might be invalid
      setPosition(null);
      setSelectedText('');
    }
  }, [contentContainerId]);

  const handleMouseUp = useCallback(() => {
    // Clear any pending check
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Delay to let selection complete
    checkTimeoutRef.current = setTimeout(checkSelection, 50);
  }, [checkSelection]);

  const handleSelectionChange = useCallback(() => {
    // Clear any pending check
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Debounce selection change
    checkTimeoutRef.current = setTimeout(checkSelection, 100);
  }, [checkSelection]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // If clicking on the toolbar, don't hide it
    const toolbar = document.getElementById('highlight-toolbar');
    if (toolbar && toolbar.contains(e.target as Node)) {
      return;
    }
    
    // Hide toolbar when starting a new selection
    setPosition(null);
    setSelectedText('');
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
      
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [handleMouseUp, handleMouseDown, handleSelectionChange]);

  const applyHighlight = (color: string) => {
    if (!selectedText) return;

    // Save to localStorage
    const saved = saveHighlight(courseId, itemId, selectedText, color);
    
    if (saved && onHighlightAdd) {
      onHighlightAdd(saved);
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setSelectedText('');
    
    // Trigger re-render with highlights
    onHighlightApplied();
  };

  const close = () => {
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setSelectedText('');
  };

  if (!position) return null;

  return (
    <div
      id="highlight-toolbar"
      className="fixed z-50 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1.5"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',  // Only center horizontally, no vertical shift
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent toolbar clicks from hiding it
    >
      <Highlighter className="w-4 h-4 text-gray-500 mr-1" />
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => applyHighlight(c.value)}
          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-gray-400 transition-all hover:scale-110"
          style={{ backgroundColor: c.value }}
          title={c.name}
        />
      ))}
      <button
        onClick={close}
        className="ml-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Cancel"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
