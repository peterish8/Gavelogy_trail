"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Save, StickyNote, X, Highlighter } from "lucide-react";
import { createPortal } from "react-dom";

// Highlight colors matching the main highlight toolbar
const HIGHLIGHT_COLORS = [
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#fecaca', // Red/Pink
  '#bfdbfe', // Blue
  '#e9d5ff', // Purple
];

interface CourseNotesProps {
  courseId: string;
  itemId: string;
}

export function CourseNotes({ courseId, itemId }: CourseNotesProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<{
    element: HTMLElement;
    text: string;
    rect: DOMRect;
  } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const storageKey = `course-notes-${courseId}-${itemId}`;
  const placeholderText = "Write your key takeaways, questions, or thoughts here...";

  // Load note from local storage
  useEffect(() => {
    if (editorRef.current) {
      const savedNote = localStorage.getItem(storageKey);
      if (savedNote) {
        editorRef.current.innerHTML = savedNote;
      } else {
        editorRef.current.innerHTML = "";
      }
    }
  }, [courseId, itemId, storageKey]);

  // Save content with debounce
  const saveContent = useCallback(() => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    const content = editorRef.current.innerHTML;
    
    setTimeout(() => {
      localStorage.setItem(storageKey, content);
      setIsSaving(false);
    }, 300);
  }, [storageKey]);

  // Handle input changes
  const handleInput = () => {
    saveContent();
  };

  // Check for text selection
  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();

    if (!sel || !text || text.length < 1) {
      setToolbarPosition(null);
      setSelectedText("");
      return;
    }

    if (!editorRef.current) {
      setToolbarPosition(null);
      setSelectedText("");
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      let startElement = range.startContainer;
      if (startElement.nodeType === Node.TEXT_NODE) {
        startElement = startElement.parentElement as Node;
      }

      // Check if selection is inside our editor
      if (!editorRef.current.contains(startElement)) {
        setToolbarPosition(null);
        setSelectedText("");
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setToolbarPosition(null);
        setSelectedText("");
        return;
      }

      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10,
      });
      setSelectedText(text);
    } catch {
      setToolbarPosition(null);
      setSelectedText("");
    }
  }, []);

  // Listen for selection changes globally (more reliable than onMouseUp)
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(checkSelection, 50);
    };

    const handleSelectionChange = () => {
      setTimeout(checkSelection, 100);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [checkSelection]);

  // Apply highlight to selected text
  const applyHighlight = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !selectedText) return;

    const range = sel.getRangeAt(0);
    
    // Create highlight mark
    const mark = document.createElement("mark");
    mark.className = "personal-note-highlight";
    mark.style.backgroundColor = color;
    mark.style.padding = "1px 2px";
    mark.style.borderRadius = "2px";
    
    try {
      range.surroundContents(mark);
    } catch {
      // If selection spans multiple elements, extract and wrap
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }

    sel.removeAllRanges();
    setToolbarPosition(null);
    setSelectedText("");
    saveContent();
  };

  // Handle hover on highlights
  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === "MARK" && target.classList.contains("personal-note-highlight")) {
      const rect = target.getBoundingClientRect();
      setActiveHighlight({
        element: target,
        text: target.textContent || "",
        rect,
      });
    } else if (!(e.target as HTMLElement).closest("[data-note-highlight-action]")) {
      setActiveHighlight(null);
    }
  };

  // Remove highlight
  const removeHighlight = () => {
    if (!activeHighlight) return;
    
    const mark = activeHighlight.element;
    const parent = mark.parentNode;
    
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    }
    
    setActiveHighlight(null);
    saveContent();
  };

  // Close toolbar on click outside
  const closeToolbar = () => {
    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
    setSelectedText("");
  };

  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-800">
            <StickyNote className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Personal Notes</h3>
        </div>
        <button 
            onClick={() => setIsVisible(!isVisible)}
            className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2"
        >
            {isVisible ? "Hide Notes" : "Show Notes"}
        </button>
      </div>
      
      {isVisible && (
      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
        <Label htmlFor="course-note" className="sr-only">
          Add personal notes
        </Label>
        <div className="relative">
          <div
            ref={editorRef}
            id="personal-notes-editor"
            contentEditable
            onInput={handleInput}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            }}
            onMouseMove={handleMouseMove}
            data-placeholder={placeholderText}
            className="h-40 min-h-[160px] resize-y overflow-y-auto bg-slate-50 border border-slate-200 rounded-md text-slate-700 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-2 md:p-4 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none">
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Saved locally</span>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 pl-1">
          These notes are stored in your browser's local storage and are private to you. 
          <Highlighter className="inline w-3 h-3 ml-1 mb-0.5"/> Select text to highlight.
        </p>
      </div>
      )}

      {/* Highlight Color Toolbar */}
      {toolbarPosition && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-50 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1.5"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            transform: "translateX(-50%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => applyHighlight(color)}
              className="w-6 h-6 rounded-full border-2 border-transparent hover:border-gray-400 hover:scale-110 transition-all"
              style={{ backgroundColor: color }}
              title={`Highlight with ${color}`}
            />
          ))}
          <button
            onClick={closeToolbar}
            className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* Hover Delete Button for Highlights */}
      {activeHighlight && typeof document !== "undefined" && createPortal(
        <div
          data-note-highlight-action
          className="fixed z-9999"
          style={{
            top: `${activeHighlight.rect.top - 12}px`,
            left: `${activeHighlight.rect.right - 12}px`,
          }}
        >
          <button
            className="bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors w-5 h-5 flex items-center justify-center transform hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              removeHighlight();
            }}
          >
            <X className="w-3 h-3 stroke-[3px]" />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
