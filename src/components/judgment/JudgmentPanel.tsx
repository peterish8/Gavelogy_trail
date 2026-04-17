'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useVirtualPDF } from './useVirtualPDF';
import { HighlightOverlay } from './HighlightOverlay';
import type { NotePdfLink } from '@/types';
import type * as PDFJSLib from 'pdfjs-dist';

const SCALE = 1.3;

interface ActiveHighlight {
  linkId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface JudgmentPanelProps {
  pdfUrl: string;
  linkMappings: NotePdfLink[];
  activeLinkId: string | null;
  onHighlightReady: (linkId: string, rect: DOMRect) => void;
}

// Single virtualised page
function PdfPage({
  pageNum,
  renderPage,
  getPageText,
  activeHighlight,
  onHighlightReady,
  onHighlightExpire,
}: {
  pageNum: number;
  renderPage: (pageNum: number, canvas: HTMLCanvasElement, scale?: number) => Promise<PDFJSLib.PageViewport | null>;
  getPageText: (pageNum: number) => Promise<string>;
  activeHighlight: ActiveHighlight | null;
  onHighlightReady: (rect: DOMRect) => void;
  onHighlightExpire: () => void;
}) {
  const [rendered, setRendered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pageHeight, setPageHeight] = useState(1100); // default estimate
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection observer — render when visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !rendered) {
          setRendered(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(container);

    return () => observerRef.current?.disconnect();
  }, [rendered]);

  // Render canvas once marked as visible
  useEffect(() => {
    if (!rendered || !canvasRef.current) return;

    renderPage(pageNum, canvasRef.current, SCALE).then((viewport) => {
      if (viewport) setPageHeight(viewport.height);
    });
  }, [rendered, pageNum, renderPage]);

  // When an active highlight lands on this page — notify parent with DOMRect
  useEffect(() => {
    if (!activeHighlight || !highlightRef.current) return;
    // Small delay to let layout settle
    const t = setTimeout(() => {
      if (highlightRef.current) {
        onHighlightReady(highlightRef.current.getBoundingClientRect());
      }
    }, 100);
    return () => clearTimeout(t);
  }, [activeHighlight, onHighlightReady]);

  const handleCanvasClick = useCallback(async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = await getPageText(pageNum);
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, getPageText, pageNum]);

  return (
    <div
      ref={containerRef}
      data-page={pageNum}
      style={{ position: 'relative', marginBottom: 8, minHeight: pageHeight }}
      className="pdf-page-container"
    >
      {/* Page number label */}
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 select-none">
        <span>Page {pageNum}</span>
        {isSpeaking && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
            Speaking...
          </span>
        )}
      </div>

      {/* Canvas */}
      {rendered ? (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ display: 'block', cursor: 'pointer' }}
          title="Click to read this page aloud"
        />
      ) : (
        <div
          style={{ height: pageHeight, background: '#f8f7f4' }}
          className="animate-pulse rounded"
        />
      )}

      {/* Highlight overlay */}
      {activeHighlight && (
        <div ref={highlightRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <HighlightOverlay
            x={activeHighlight.x}
            y={activeHighlight.y}
            width={activeHighlight.width}
            height={activeHighlight.height}
            onExpire={onHighlightExpire}
          />
        </div>
      )}
    </div>
  );
}

export function JudgmentPanel({
  pdfUrl,
  linkMappings,
  activeLinkId,
  onHighlightReady,
}: JudgmentPanelProps) {
  const { totalPages, isLoading, error, renderPage, getPageText } = useVirtualPDF(pdfUrl);
  const [activeHighlightPage, setActiveHighlightPage] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // When activeLinkId changes, scroll to the right page and show highlight
  useEffect(() => {
    if (!activeLinkId || !linkMappings.length) return;

    const mapping = linkMappings.find((m) => m.link_id === activeLinkId);
    if (!mapping) return;

    const targetPage = mapping.pdf_page;

    // Scroll to the page container
    const container = document.querySelector(`[data-page="${targetPage}"]`);
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // After scroll, show highlight
    const t = setTimeout(() => {
      // We need the viewport height for coordinate conversion.
      // We approximate: screenY = viewportHeight - (y + height) * scale
      // viewportHeight is canvas.height which equals viewport.height from PDF.js
      // We store it dynamically but for now compute from canvas element
      const canvas = document.querySelector(`[data-page="${targetPage}"] canvas`) as HTMLCanvasElement | null;
      const viewportHeight = canvas?.height ?? 1100;

      const screenX = mapping.x * SCALE;
      const screenY = viewportHeight - (mapping.y + mapping.height) * SCALE;
      const screenW = mapping.width * SCALE;
      const screenH = mapping.height * SCALE;

      setActiveHighlightPage(targetPage);
      setActiveHighlight({
        linkId: activeLinkId,
        x: screenX,
        y: screenY,
        width: screenW,
        height: screenH,
      });
    }, 600);

    return () => clearTimeout(t);
  }, [activeLinkId, linkMappings]);

  const handleHighlightReady = useCallback(
    (rect: DOMRect) => {
      if (activeLinkId) {
        onHighlightReady(activeLinkId, rect);
      }
    },
    [activeLinkId, onHighlightReady]
  );

  const handleHighlightExpire = useCallback(() => {
    setActiveHighlight(null);
    setActiveHighlightPage(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p>Loading judgment PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto h-full bg-gray-50"
      style={{ padding: '8px 12px' }}
    >
      <p className="text-xs text-gray-400 mb-2 select-none">
        Click any page to hear it read aloud • {totalPages} pages
      </p>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <PdfPage
          key={pageNum}
          pageNum={pageNum}
          renderPage={renderPage}
          getPageText={getPageText}
          activeHighlight={activeHighlightPage === pageNum ? activeHighlight : null}
          onHighlightReady={handleHighlightReady}
          onHighlightExpire={handleHighlightExpire}
        />
      ))}
    </div>
  );
}
