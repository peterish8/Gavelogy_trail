# Master Info — Gavelogy: Notes + Judgment Mode

## Project Summary

A new optional mode inside Gavelogy's existing Next.js + Supabase notes system. When a case has a judgment PDF and admin has created coordinate mappings, students get a split-panel view. Left = existing notes. Right = real PDF via PDF.js. Note phrases are linked to PDF bounding boxes. Both sides have Web Speech. An internal admin tagging tool creates and stores the mappings.

**Stage:** Feature addition on existing product  
**Stack:** Next.js 14 (App Router), Supabase, TypeScript, Tailwind CSS  
**Team:** Solo / small team

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Existing Gavelogy stack |
| PDF Rendering | `pdfjs-dist` | Free, browser-native, canvas-based, handles 700-page SC judgments |
| Speech | `window.speechSynthesis` (Web Speech API) | Zero cost, no API key, works on all modern browsers |
| DB | Supabase (PostgreSQL) | Existing Gavelogy DB |
| File Storage | Supabase Storage | PDF uploads go here |
| Styling | Tailwind CSS | Existing stack |
| State | React useState / useRef | Local component state — no global store needed |

---

## Architecture Overview

```
Existing Notes Page
        │
        ├── [mode = notes-only]  ← default, no change
        │
        └── [mode = notes+judgment]  ← new
              │
              ├── LEFT PANEL
              │     Existing <NotesContent /> unchanged
              │     + data-link-id on tagged spans
              │     + paragraph click → speechSynthesis
              │
              ├── DIVIDER (draggable)
              │
              └── RIGHT PANEL
                    PDF.js canvas pages
                    + highlight overlay divs
                    + SVG bezier line layer
                    + canvas click → speechSynthesis (page text)

Admin Route: /admin/tag/[case-id]
        │
        ├── PDF.js viewer (full width)
        ├── Drag-select region on any page
        ├── Modal: pick link_id → save to Supabase
        └── Existing mappings shown as coloured overlays
```

---

## Key Design Decisions

**PDF.js over react-pdf:** `react-pdf` is a thin wrapper — better to use `pdfjs-dist` directly for the level of control needed (custom overlays, coordinate math, text content extraction for speech).

**Visual overlay for highlights, not PDF text layer:** PDF text layers are fragile — coordinate offsets differ by browser zoom, font rendering, and PDF encoding. A simple absolutely-positioned `div` overlay on top of the canvas is reliable and visually sufficient.

**Coordinate system:** PDF.js `viewport` maps PDF units to screen pixels. Highlight coordinates stored in Supabase are in PDF user-space units. At runtime: `screenX = pdfX * scale`, `screenY = (pageHeight - pdfY - rectHeight) * scale`. Admin tagging tool records in PDF units, not screen pixels — so coordinates work at any zoom level.

**Page-level speech on PDF in MVP:** PDF renders as canvas (no selectable text). `getTextContent()` extracts all text items for a page — concatenate and speak. Sentence-level would require a text layer overlay (added in V2).

**Speech toggling:** Only one utterance plays at a time. Starting a new one cancels the previous via `speechSynthesis.cancel()` before speaking.

**Virtualized PDF rendering:** Don't render all pages upfront. Use an IntersectionObserver on placeholder divs — render a page canvas when its placeholder enters the viewport. Keeps memory reasonable for 600+ page SC judgments.

**Admin tagging stores PDF-space coordinates:** On the admin canvas, mouse event coordinates are converted back to PDF-space: `pdfX = mouseX / scale`, `pdfY = pageHeight - (mouseY / scale)`. This makes stored coords zoom-independent.

---

## Data Model

### Existing (no change)
```
cases
  id, title, subject, pdf_url (new field added here)

notes
  id, case_id, content (HTML or markdown)
```

### New Table
```sql
note_pdf_links
  id            uuid primary key
  case_id       uuid references cases(id)
  link_id       text          -- matches data-link-id on note span e.g. "link-ratio"
  pdf_page      integer       -- 1-indexed
  x             float         -- PDF user-space units
  y             float         -- PDF user-space units (from bottom of page)
  width         float
  height        float
  label         text          -- optional display label e.g. "¶58 — Core Ratio"
  created_at    timestamptz
```

### Supabase Storage
```
bucket: judgments
path:   {case_id}/{filename}.pdf
```

---

## PDF.js Integration Notes

**Install:**
```bash
pnpm add pdfjs-dist
```

**Worker setup (Next.js App Router):**
```ts
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
// Copy worker from node_modules/pdfjs-dist/build/ to /public/
```

**Loading a PDF:**
```ts
const pdf = await pdfjsLib.getDocument(pdfUrl).promise
```

**Rendering one page to canvas:**
```ts
const page = await pdf.getPage(pageNum) // 1-indexed
const viewport = page.getViewport({ scale: 1.3 })
const canvas = canvasRef.current
canvas.height = viewport.height
canvas.width = viewport.width
await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
```

**Getting text for speech:**
```ts
const page = await pdf.getPage(pageNum)
const textContent = await page.getTextContent()
const text = textContent.items.map((item: any) => item.str).join(' ')
window.speechSynthesis.cancel()
window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
```

**Coordinate conversion (PDF-space → screen-space):**
```ts
// PDF Y-axis is bottom-up; screen Y-axis is top-down
const screenX = link.x * scale
const screenY = (viewport.height - (link.y + link.height) * scale)
const screenW = link.width * scale
const screenH = link.height * scale
```

---

## Web Speech API Notes

- `window.speechSynthesis` — available in all modern browsers, no key needed.
- Always call `speechSynthesis.cancel()` before a new utterance to stop any in-progress speech.
- `SpeechSynthesisUtterance` accepts a plain string.
- On iOS Safari: must be triggered by a direct user gesture (click/tap). Works fine in this case since speech is always triggered by a click.
- Language: set `utterance.lang = 'en-IN'` for Indian English accent (matches legal terminology better).
- Rate: `utterance.rate = 0.9` — slightly slower than default for dense legal text.

---

## Admin Tagging Tool Notes

The core interaction is: drag-select a rectangle on any PDF page → save coordinates.

**Drag select logic:**
```
mousedown → record startX, startY (relative to canvas)
mousemove → draw live selection rectangle overlay
mouseup   → record endX, endY → compute { x, y, width, height } in PDF-space → open modal
```

Convert mouse coords to PDF-space before saving:
```ts
const pdfX = mouseX / scale
const pdfY = pageHeightPdfUnits - (mouseY / scale) - rectHeightPdfUnits
```

**Existing mappings overlay:** On load, fetch all `note_pdf_links` for the case. For each, render a semi-transparent coloured box on the right page canvas. Hovering shows the `link_id` label. This prevents double-tagging the same region.

---

## Component Structure (New Files Only)

```
components/
  judgment/
    JudgmentPanel.tsx         ← PDF.js viewer, handles speech on canvas click
    HighlightOverlay.tsx      ← positioned div over canvas for a single link
    BezierConnector.tsx       ← SVG line between note span and PDF highlight
    useVirtualPDF.ts          ← IntersectionObserver-based page renderer hook

admin/
  tag/
    [caseId]/
      page.tsx                ← admin tagging route
      TaggingCanvas.tsx       ← drag-select + existing overlays
      TagModal.tsx            ← link_id picker + save
```

Existing notes components stay untouched. The split layout wraps them.

---

## Supabase Queries

**Fetch all links for a case:**
```ts
const { data } = await supabase
  .from('note_pdf_links')
  .select('*')
  .eq('case_id', caseId)
```

**Save a new link (admin):**
```ts
await supabase.from('note_pdf_links').insert({
  case_id, link_id, pdf_page, x, y, width, height, label
})
```

**Check if case has a PDF:**
```ts
const { data } = await supabase
  .from('cases')
  .select('pdf_url')
  .eq('id', caseId)
  .single()
// If data.pdf_url exists → show Notes+Judgment toggle
```

---

## Security Considerations

- Supabase Storage bucket `judgments` should be public-read (students need to load PDFs directly in browser via URL). Admin uploads via Supabase service role.
- The `/admin/tag/[case-id]` route must be protected by existing Gavelogy admin auth middleware.
- `note_pdf_links` table: students read-only via RLS. Admin insert/update via service role.

---

## Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| PDF coordinate mismatch at different zoom levels | Store in PDF-space units, convert to screen pixels using `scale` at render time |
| Large PDFs (700 pages) cause memory/perf issues | Virtualise — IntersectionObserver renders only visible pages |
| `speechSynthesis` interrupted mid-sentence by another click | Always call `cancel()` before new utterance |
| Admin accidentally double-tags a region | Show existing overlays in the tagging UI |
| PDF.js worker 404 in Next.js | Copy `pdf.worker.min.js` to `/public/` during build |

---

## References

- PDF.js docs: https://mozilla.github.io/pdf.js/
- pdfjs-dist npm: https://www.npmjs.com/package/pdfjs-dist
- Web Speech API MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- LiquidText (inspiration): https://www.liquidtext.net/
- Existing Gavelogy prototype: see notes in repo