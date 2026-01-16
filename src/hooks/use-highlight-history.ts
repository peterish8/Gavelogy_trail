import { useState, useCallback, useEffect } from 'react';
import { saveHighlight, removeHighlight, TextHighlight } from '@/lib/highlight-storage';

export type HighlightAction = {
  type: 'ADD' | 'REMOVE';
  courseId: string;
  itemId: string;
  data: {
    id: string;
    text: string;
    color: string;
    createdAt?: number;
  };
};

export function useHighlightHistory(
  courseId: string | null, 
  itemId: string | null,
  onUpdate: () => void 
) {
  const [past, setPast] = useState<HighlightAction[]>([]);
  const [future, setFuture] = useState<HighlightAction[]>([]);

  const addToHistory = useCallback((action: HighlightAction) => {
    setPast(prev => [...prev, action]);
    setFuture([]); // Clear future on new action
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const action = past[past.length - 1];
    const newPast = past.slice(0, -1);
    
    // Perform inverse operation
    if (action.type === 'ADD') {
      // Inverse of ADD is REMOVE
      removeHighlight(action.courseId, action.itemId, action.data.id);
    } else {
      // Inverse of REMOVE is ADD (forcing ID)
      saveHighlight(
        action.courseId, 
        action.itemId, 
        action.data.text, 
        action.data.color, 
        action.data.id,
        action.data.createdAt
      );
    }

    setPast(newPast);
    setFuture(prev => [action, ...prev]);
    onUpdate();
  }, [past, onUpdate]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const action = future[0];
    const newFuture = future.slice(1);

    // Perform original operation
    if (action.type === 'ADD') {
      saveHighlight(
        action.courseId, 
        action.itemId, 
        action.data.text, 
        action.data.color, 
        action.data.id,
        action.data.createdAt
      );
    } else {
      removeHighlight(action.courseId, action.itemId, action.data.id);
    }

    setPast(prev => [...prev, action]);
    setFuture(newFuture);
    onUpdate();
  }, [future, onUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Check for Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    addToHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0
  };
}
