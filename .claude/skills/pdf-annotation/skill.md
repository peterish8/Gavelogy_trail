---
name: PDF Annotation & Judgment Mode
description: Load when working with the PDF viewer, highlights, bezier connectors, the judgment mode split-panel, or the useVirtualPDF hook
---

# Purpose
Gavelogy's Judgment Mode — a specialized PDF viewer with virtual rendering, text highlighting, bezier curve connectors linking notes to PDF regions, and admin annotation tools.

# When to Use
- Adding features to the PDF viewer
- Debugging highlight rendering or coordinate mapping
- Working on the notes ↔ PDF connector system
- Modifying the admin tagging tool
- Optimizing PDF performance (page virtualization)

# Setup
```bash
# Dependencies
pdfjs-dist: 5.5.207    # PDF rendering
# Worker file is auto-copied via postinstall script
```

Key files:
| File | Purpose |
|------|---------|
| `src/components/judgment/JudgmentPanel.tsx` | Main PDF viewer with highlights |
| `src/components/judgment/useVirtualPDF.ts` | Lazy-loading PDF pages hook |
| `src/components/judgment/HighlightOverlay.tsx` | Renders highlight regions on canvas |
| `src/components/judgment/BezierConnector.tsx` | SVG bezier curves linking notes to PDF |
| `src/components/judgment/NotesJudgmentLayout.tsx` | Split-panel layout |
| `src/app/admin/tag/[caseId]/TaggingCanvas.tsx` | Admin highlight creation tool |
| `src/app/admin/tag/[caseId]/NotesPanel.tsx` | Admin notes management panel |
| `src/app/admin/tag/[caseId]/TagModal.tsx` | Tag creation/editing modal |

# Core Concepts

## PDF Virtualization (`useVirtualPDF.ts`)
```ts
// Only renders visible pages — critical for large law case PDFs (100+ pages)
interface VirtualPDFState {
  totalPages: number;
  loadedPages: Map<number, HTMLCanvasElement>;
  visiblePages: Set<number>;
  loadPage: (pageNum: number) => Promise<void>;
  getPageDimensions: (pageNum: number) => { width: number; height: number };
}

// Uses IntersectionObserver to detect which page containers are visible
// Renders pages at 1.3x scale for readability
const RENDER_SCALE = 1.3;
```

## Highlight Coordinate System
```ts
interface HighlightRegion {
  pageNumber: number;
  x: number;      // percentage of page width (0–100)
  y: number;      // percentage of page height (0–100)
  width: number;  // percentage
  height: number; // percentage
  text: string;   // highlighted text content
  color: string;  // rgba color string
  tagId: string;  // links to a note tag
}
```

Using percentages instead of pixels makes highlights resolution-independent — they render correctly at any scale.

## Bezier Connector System
```ts
// Links a note text span to a PDF highlight region
interface ConnectorPath {
  noteAnchor: { x: number; y: number };  // absolute DOM coords
  pdfAnchor: { x: number; y: number };   // absolute DOM coords
  color: string;
}

// SVG path calculation for bezier curve
function calculateBezierPath(from: Point, to: Point): string {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}
```

## Text-to-Speech Integration
```ts
// JudgmentPanel supports TTS — clicking highlighted text reads it aloud
const { speak, stop, isSpeaking } = useTTS();

function handleHighlightClick(region: HighlightRegion) {
  if (isSpeaking) {
    stop();
  } else {
    speak(region.text);
  }
}
```

# Best Practices

## Setting Up PDF.js Worker
```ts
// Must be configured before rendering any PDF
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
// Worker file is copied to public/ via postinstall script
```

## Loading a PDF Document
```ts
async function loadPDF(url: string) {
  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: true, // for auth-protected PDFs
  });

  const pdf = await loadingTask.promise;
  return pdf;
}
```

## Rendering a Single Page to Canvas
```ts
async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.3
) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d')!;
  await page.render({ canvasContext: context, viewport }).promise;
}
```

## Virtual Page Container
```tsx
// Each page gets a placeholder div for IntersectionObserver
function PDFPageContainer({ pageNum, onVisible }: { pageNum: number; onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onVisible();
      },
      { rootMargin: '200px' } // preload 200px before entering viewport
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pageNum]);

  return (
    <div ref={ref} className="relative" style={{ minHeight: '400px' }}>
      <canvas id={`page-${pageNum}`} className="w-full" />
      <HighlightOverlay pageNum={pageNum} />
    </div>
  );
}
```

## Highlight Overlay Rendering
```tsx
function HighlightOverlay({ pageNum }: { pageNum: number }) {
  const highlights = useHighlights(pageNum);
  const canvas = document.getElementById(`page-${pageNum}`) as HTMLCanvasElement;
  if (!canvas) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvas.width, height: canvas.height }}
    >
      {highlights.map((h) => (
        <div
          key={h.tagId}
          className="absolute cursor-pointer"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.width}%`,
            height: `${h.height}%`,
            backgroundColor: h.color,
            opacity: 0.4,
          }}
          onClick={() => handleHighlightClick(h)}
        />
      ))}
    </div>
  );
}
```

# Code Examples

## Admin Tagging Canvas
```tsx
// Admin marks a region by click+drag on the PDF
function TaggingCanvas({ pageNum, onTagCreated }: TaggingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [start, setStart] = useState<Point | null>(null);
  const [current, setCurrent] = useState<Point | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStart({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!start || !current) return;
    setIsDrawing(false);
    // Open TagModal with the selected region
    onTagCreated({
      pageNumber: pageNum,
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    });
  };

  return (
    <div
      className="relative cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => isDrawing && setCurrent(getRelativeCoords(e))}
      onMouseUp={handleMouseUp}
    >
      {/* PDF canvas */}
      {isDrawing && start && current && (
        <SelectionRect start={start} end={current} />
      )}
    </div>
  );
}
```

## BezierConnector SVG
```tsx
function BezierConnector({ from, to, color }: ConnectorPath) {
  const path = calculateBezierPath(from, to);

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={path}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeDasharray="4,4"
        markerEnd="url(#arrowhead)"
        opacity={0.7}
      />
    </svg>
  );
}
```

# Common Pitfalls

1. **Rendering all pages at once** → crashes browser for 100+ page documents
2. **Pixel coordinates instead of percentages** → highlights misalign at different zoom levels
3. **Not awaiting PDF worker init** → "Worker is not initialized" errors
4. **Canvas 2D context not cleared** → ghost renders when page re-renders
5. **Missing pointer-events: none** on highlight overlay → blocks PDF canvas interaction

```ts
// Always clear canvas before rendering
const context = canvas.getContext('2d')!;
context.clearRect(0, 0, canvas.width, canvas.height);
await page.render({ canvasContext: context, viewport }).promise;
```

# Performance Notes
- Virtual rendering: only load/render pages within viewport + 200px margin
- Use `requestIdleCallback` for background page pre-loading
- PDF.js rendering is CPU-intensive — render on a Web Worker where possible
- Cache rendered canvas elements — don't re-render unchanged pages on scroll
- For very large PDFs (200+ pages), implement page eviction: unload pages > 10 screens away

```ts
// Evict distant pages from memory
function evictDistantPages(visiblePage: number, loadedPages: Map<number, HTMLCanvasElement>) {
  for (const [pageNum] of loadedPages) {
    if (Math.abs(pageNum - visiblePage) > 10) {
      loadedPages.delete(pageNum);
    }
  }
}
```

# Security Notes
- PDF URLs should be authenticated (Supabase storage with signed URLs)
- Copy protection hook prevents screenshot-like text selection on judgment panels
- Admin tagging routes should check for admin role before loading
- Validate highlight coordinates server-side (0–100 range) to prevent injection

# Testing Strategy
```ts
// Mock PDF.js for unit tests
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 5,
      getPage: vi.fn((n) => Promise.resolve({
        getViewport: () => ({ width: 800, height: 1100 }),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
      })),
    }),
  })),
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Test highlight coordinate calculation
it('converts pixel coords to percentages correctly', () => {
  const result = pixelToPercent({ x: 400, y: 550 }, { width: 800, height: 1100 });
  expect(result).toEqual({ x: 50, y: 50 });
});
```

# Upgrade / Versioning Notes
- **pdfjs-dist v5**: New worker format (`pdf.worker.min.mjs` instead of `.js`)
- **pdfjs-dist v4→v5**: Some rendering APIs changed — check `page.render()` return type
- Worker file must match pdfjs-dist version exactly
- Watch: https://github.com/mozilla/pdf.js/releases

# Related Skills
- `admin-tagging` — Full admin workflow for creating and managing annotations
- `nextjs-app-router` — `dynamic(() => import(...), { ssr: false })` required for PDF viewer
