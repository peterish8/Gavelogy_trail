'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useVirtualPDF } from '@/components/judgment/useVirtualPDF';
import type { NotePdfLink } from '@/types';

const SCALE = 1.3;

// Distinct colours for overlay labels
const OVERLAY_COLORS = [
  'rgba(59,130,246,0.30)',
  'rgba(16,185,129,0.30)',
  'rgba(239,68,68,0.30)',
  'rgba(168,85,247,0.30)',
  'rgba(234,179,8,0.30)',
  'rgba(249,115,22,0.30)',
];

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pageNum: number;
  pageOffsetTop: number;
}

interface TagRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TaggingCanvasProps {
  pdfUrl: string;
  existingLinks: NotePdfLink[];
  onRegionSelected: (region: TagRegion) => void;
}

interface PageState {
  rendered: boolean;
  height: number;
}

export function TaggingCanvas({ pdfUrl, existingLinks, onRegionSelected }: TaggingCanvasProps) {
  const { totalPages, isLoading, error, renderPage } = useVirtualPDF(pdfUrl);
  const [pages, setPages] = useState<Map<number, PageState>>(new Map());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const observersRef = useRef<Map<number, IntersectionObserver>>(new Map());

  // Set up intersection observers once total pages known
  useEffect(() => {
    if (!totalPages) return;
    const initialPages = new Map<number, PageState>();
    for (let i = 1; i <= totalPages; i++) {
      initialPages.set(i, { rendered: false, height: 1100 });
    }
    setPages(initialPages);
  }, [totalPages]);

  // Render a page when it becomes visible
  const maybeRenderPage = useCallback(
    async (pageNum: number) => {
      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;
      const viewport = await renderPage(pageNum, canvas, SCALE);
      if (viewport) {
        setPages((prev) => {
          const next = new Map(prev);
          next.set(pageNum, { rendered: true, height: viewport.height });
          return next;
        });
      }
    },
    [renderPage]
  );

  useEffect(() => {
    if (!totalPages) return;
    // Small delay so canvases are in DOM
    const t = setTimeout(() => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) continue;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              maybeRenderPage(pageNum);
              obs.disconnect();
              observersRef.current.delete(pageNum);
            }
          },
          { rootMargin: '300px' }
        );
        obs.observe(canvas);
        observersRef.current.set(pageNum, obs);
      }
    }, 100);
    return () => {
      clearTimeout(t);
      observersRef.current.forEach((obs) => obs.disconnect());
    };
  }, [totalPages, maybeRenderPage]);

  // Drag handlers
  function getPageContainer(pageNum: number): HTMLElement | null {
    return containerRef.current?.querySelector(`[data-admin-page="${pageNum}"]`) as HTMLElement | null;
  }

  function getPagePdfHeight(pageNum: number): number {
    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return 850; // A4 estimate
    // canvas.height = viewport.height = pageHeightPdfUnits * SCALE
    return canvas.height / SCALE;
  }

  function handleMouseDown(e: React.MouseEvent, pageNum: number) {
    const pageEl = getPageContainer(pageNum);
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    setDrag({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
      pageNum,
      pageOffsetTop: rect.top,
    });
  }

  function handleMouseMove(e: React.MouseEvent, pageNum: number) {
    if (!drag || drag.pageNum !== pageNum) return;
    const pageEl = getPageContainer(pageNum);
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    setDrag((prev) =>
      prev ? { ...prev, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null
    );
  }

  function handleMouseUp(pageNum: number) {
    if (!drag || drag.pageNum !== pageNum) return;

    const mouseX = Math.min(drag.startX, drag.currentX);
    const mouseY = Math.min(drag.startY, drag.currentY);
    const mouseW = Math.abs(drag.currentX - drag.startX);
    const mouseH = Math.abs(drag.currentY - drag.startY);

    // Ignore tiny accidental drags
    if (mouseW < 8 || mouseH < 8) {
      setDrag(null);
      return;
    }

    const pageHeightPdf = getPagePdfHeight(pageNum);
    const pdfX = mouseX / SCALE;
    const pdfH = mouseH / SCALE;
    const pdfY = pageHeightPdf - mouseY / SCALE - pdfH;
    const pdfW = mouseW / SCALE;

    setDrag(null);
    onRegionSelected({ page: pageNum, x: pdfX, y: pdfY, width: pdfW, height: pdfH });
  }

  // Get links for a specific page
  function linksForPage(pageNum: number) {
    return existingLinks.filter((l) => l.pdf_page === pageNum);
  }

  // Convert a stored link back to screen coords for overlay
  function linkToScreen(link: NotePdfLink, canvasHeight: number) {
    const screenX = link.x * SCALE;
    const screenY = canvasHeight - (link.y + link.height) * SCALE;
    const screenW = link.width * SCALE;
    const screenH = link.height * SCALE;
    return { screenX, screenY, screenW, screenH };
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-amber-500 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mr-3" />
        Loading PDF...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-400 text-sm">{error}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      <p className="text-xs text-amber-600 px-4 py-2 select-none">
        Drag to select a region on any page
      </p>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
        const pageState = pages.get(pageNum);
        const canvasHeight = canvasRefs.current.get(pageNum)?.height ?? 1100;
        const links = linksForPage(pageNum);
        const isDraggingThisPage = drag?.pageNum === pageNum;

        return (
          <div
            key={pageNum}
            data-admin-page={pageNum}
            style={{ position: 'relative', marginBottom: 8, userSelect: 'none' }}
          >
            {/* Page label */}
            <div className="px-4 py-1 text-xs text-amber-700 select-none">Page {pageNum}</div>

            {/* Canvas + overlay wrapper */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                  else canvasRefs.current.delete(pageNum);
                }}
                style={{
                  display: 'block',
                  minHeight: pageState?.height ?? 1100,
                  background: '#f8f7f4',
                }}
              />

              {/* Existing link overlays */}
              {links.map((link, idx) => {
                const { screenX, screenY, screenW, screenH } = linkToScreen(link, canvasHeight);
                const color = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];
                return (
                  <div
                    key={link.id}
                    style={{
                      position: 'absolute',
                      left: screenX,
                      top: screenY,
                      width: screenW,
                      height: screenH,
                      background: color,
                      border: '1.5px solid rgba(201,146,42,0.7)',
                      borderRadius: 2,
                      pointerEvents: 'auto',
                      cursor: 'help',
                      zIndex: 5,
                    }}
                    onMouseEnter={(e) =>
                      setTooltip({
                        text: link.link_id + (link.label ? ` — ${link.label}` : ''),
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}

              {/* Drag-select interaction overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  cursor: 'crosshair',
                }}
                onMouseDown={(e) => handleMouseDown(e, pageNum)}
                onMouseMove={(e) => handleMouseMove(e, pageNum)}
                onMouseUp={() => handleMouseUp(pageNum)}
                onMouseLeave={() => {
                  if (drag?.pageNum === pageNum) setDrag(null);
                }}
              />

              {/* Live selection rectangle */}
              {isDraggingThisPage && drag && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(drag.startX, drag.currentX),
                    top: Math.min(drag.startY, drag.currentY),
                    width: Math.abs(drag.currentX - drag.startX),
                    height: Math.abs(drag.currentY - drag.startY),
                    border: '2px dashed #c9922a',
                    background: 'rgba(201,146,42,0.12)',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 24,
            zIndex: 100,
            pointerEvents: 'none',
          }}
          className="bg-[#1a1710] border border-amber-800/50 text-amber-200 text-xs px-2 py-1 rounded shadow"
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
