'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { JudgmentPanel } from './JudgmentPanel';
import { BezierConnector } from './BezierConnector';
import { fetchLinksForItem } from '@/actions/judgment/links';
import type { NotePdfLink } from '@/types';
import { BookOpen, SplitSquareHorizontal } from 'lucide-react';

interface NotesJudgmentLayoutProps {
  itemId: string | null;
  pdfUrl: string | null;
  children: ReactNode;
}

export function NotesJudgmentLayout({
  itemId,
  pdfUrl,
  children,
}: NotesJudgmentLayoutProps) {
  const [mode, setMode] = useState<'notes' | 'split'>('notes');
  const [linkMappings, setLinkMappings] = useState<NotePdfLink[]>([]);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [fromRect, setFromRect] = useState<DOMRect | null>(null);
  const [toRect, setToRect] = useState<DOMRect | null>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const isDragging = useRef(false);

  // Load link mappings when we have an itemId
  useEffect(() => {
    if (!itemId || !pdfUrl) return;
    fetchLinksForItem(itemId).then(setLinkMappings);
  }, [itemId, pdfUrl]);

  // Web Speech on notes — click any paragraph
  useEffect(() => {
    const container = notesContainerRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Ignore clicks on linked-text spans (those jump to PDF)
      if (target.closest('[data-link-id]')) return;
      // Find the nearest text block (p, li, h1-h3, div.note-box)
      const block = target.closest('p, li, h1, h2, h3, div.note-box') as HTMLElement | null;
      if (!block) return;

      const text = block.innerText?.trim();
      if (!text) return;

      // Toggle: if same block is speaking, stop
      if (block.classList.contains('speaking')) {
        window.speechSynthesis.cancel();
        block.classList.remove('speaking');
        return;
      }

      // Stop any previous speech
      window.speechSynthesis.cancel();
      document.querySelectorAll('.speaking').forEach((el) => el.classList.remove('speaking'));

      block.classList.add('speaking');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = () => block.classList.remove('speaking');
      utterance.onerror = () => block.classList.remove('speaking');
      window.speechSynthesis.speak(utterance);
    }

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [mode]);

  // Handle linked-text clicks in notes — jump to PDF
  useEffect(() => {
    const container = notesContainerRef.current;
    if (!container || mode !== 'split') return;

    function handleLinkClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const span = target.closest('[data-link-id]') as HTMLElement | null;
      if (!span) return;

      e.stopPropagation();
      const linkId = span.getAttribute('data-link-id');
      if (!linkId) return;

      // Clear previous timer
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

      setActiveLinkId(linkId);
      setFromRect(span.getBoundingClientRect());
      setToRect(null);

      // Auto-clear after 4.5s (highlight lives 4s)
      clearTimerRef.current = setTimeout(() => {
        setActiveLinkId(null);
        setFromRect(null);
        setToRect(null);
      }, 4500);
    }

    container.addEventListener('click', handleLinkClick);
    return () => container.removeEventListener('click', handleLinkClick);
  }, [mode]);

  const handleHighlightReady = useCallback((_linkId: string, rect: DOMRect) => {
    setToRect(rect);
  }, []);

  // Draggable divider
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const pct = (ev.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(75, pct)));
    }
    function onUp() {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // If no PDF — render children only
  if (!pdfUrl) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Mode toggle button */}
      <div className="absolute top-0 right-0 z-20 flex gap-1 p-1">
        <button
          onClick={() => setMode('notes')}
          title="Notes Only"
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'notes'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-white/80 text-gray-600 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Notes Only
        </button>
        <button
          onClick={() => setMode('split')}
          title="Notes + Judgment"
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'split'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-white/80 text-gray-600 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          <SplitSquareHorizontal className="w-3 h-3" />
          Notes + Judgment
        </button>
      </div>

      {mode === 'notes' ? (
        <div ref={notesContainerRef} className="notes-speech-container">
          {children}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${leftWidth}% 4px ${100 - leftWidth}%`,
            height: 'calc(100vh - 80px)',
            overflow: 'hidden',
          }}
        >
          {/* LEFT: Notes */}
          <div
            ref={notesContainerRef}
            className="notes-speech-container overflow-y-auto h-full"
          >
            {children}
          </div>

          {/* DIVIDER */}
          <div
            onMouseDown={handleDividerMouseDown}
            style={{
              cursor: 'col-resize',
              background: '#e5c97d',
              userSelect: 'none',
            }}
            className="hover:bg-amber-400 transition-colors"
          />

          {/* RIGHT: Judgment PDF */}
          <div className="h-full overflow-hidden border-l border-amber-200">
            <JudgmentPanel
              pdfUrl={pdfUrl}
              linkMappings={linkMappings}
              activeLinkId={activeLinkId}
              onHighlightReady={handleHighlightReady}
            />
          </div>
        </div>
      )}

      {/* Bezier connector overlay */}
      <BezierConnector
        fromRect={fromRect}
        toRect={toRect}
        visible={mode === 'split' && !!activeLinkId && !!fromRect && !!toRect}
      />
    </div>
  );
}
