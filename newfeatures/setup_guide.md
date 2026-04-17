# Setup Guide + Master Prompt — Gavelogy: Notes + Judgment Mode

---

## Prerequisites

- Existing Gavelogy Next.js 14 (App Router) + Supabase project running.
- `pnpm` installed.
- Supabase project with `cases` and `notes` tables already existing.
- Judgment PDFs available to upload.

---

## 1. Install PDF.js

```bash
pnpm add pdfjs-dist
```

Copy the PDF.js worker to your public folder (required for Next.js):

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

Add this to your Next.js build script or a postinstall hook in `package.json`:

```json
"scripts": {
  "postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js"
}
```

---

## 2. Supabase: Add New Table + Column

Run in Supabase SQL editor:

```sql
-- Add pdf_url to existing cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS pdf_url text;

-- New table for note→PDF coordinate links
CREATE TABLE note_pdf_links (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid references cases(id) on delete cascade,
  link_id    text not null,
  pdf_page   integer not null,
  x          float not null,
  y          float not null,
  width      float not null,
  height     float not null,
  label      text,
  created_at timestamptz default now()
);

-- RLS: students read-only
ALTER TABLE note_pdf_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read links"
  ON note_pdf_links FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert links"
  ON note_pdf_links FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## 3. Supabase Storage: Create Judgments Bucket

In Supabase dashboard → Storage → New bucket:

- Name: `judgments`
- Public: **yes** (students load PDFs directly in browser)

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('judgments', 'judgments', true);
```

Upload a judgment PDF:

```bash
# Via Supabase CLI or dashboard
# Path format: judgments/{case_id}/judgment.pdf
```

Then update the case record:

```sql
UPDATE cases
SET pdf_url = 'https://<project>.supabase.co/storage/v1/object/public/judgments/{case_id}/judgment.pdf'
WHERE id = '{case_id}';
```

---

## 4. Environment Variables

No new env vars needed — uses the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 5. Run Locally

```bash
pnpm dev
```

Navigate to an existing case notes page. If `pdf_url` is set on the case, you'll see the "Notes + Judgment" toggle once the components are added.

---

## 6. File Structure to Create

```
app/
  admin/
    tag/
      [caseId]/
        page.tsx

components/
  judgment/
    JudgmentPanel.tsx
    HighlightOverlay.tsx
    BezierConnector.tsx
    useVirtualPDF.ts
  notes/
    NotesJudgmentLayout.tsx   ← wraps existing notes + new split mode
```

---

## 7. Deploy

No special deploy steps beyond the existing Gavelogy setup. The `pdf.worker.min.js` must be in `/public/` — ensure `postinstall` script runs on Vercel (it does by default).

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `pdf.worker.min.js` 404 in browser | Run postinstall script — check `/public/` has the file |
| PDF highlights misaligned at different zoom | Convert coords with `scale` at render time, never hardcode pixel values |
| `speechSynthesis.speak()` does nothing on first load | Must be triggered by a real user gesture (click). It always is here — no issue |
| speechSynthesis won't stop when clicking new paragraph | Call `window.speechSynthesis.cancel()` before new `speak()` |
| Large PDF freezes browser | Enable virtualised rendering — only render pages in viewport using IntersectionObserver |
| Admin tagging coordinates drift after page reload | Verify `scale` is constant between tagging session and student view. Use same `scale` value (e.g., `1.3`) in both. |

---

## Useful Commands

```bash
pnpm dev                        # local dev
pnpm build                      # production build
pnpm postinstall                # re-copy pdf.worker if needed
```

---
---

# Master Prompt — For Cursor / Windsurf

Copy-paste this into your AI IDE to build the entire Notes + Judgment mode feature.

---

```
You are building a new feature for Gavelogy — an existing Next.js 14 (App Router) + Supabase + TypeScript + Tailwind CSS legal EdTech SaaS.

## What Already Exists (do NOT touch or rebuild)
- The notes page at `/cases/[caseId]/notes` — fully built, working.
- Supabase tables: `cases`, `notes`, `profiles`.
- Auth middleware protecting admin routes.
- Existing styling system using Tailwind with a dark amber-gold legal theme (parchment background, gold accents, IBM Plex Serif).

## What You Are Building
A new optional "Notes + Judgment" mode that activates on the existing notes page when a case has a `pdf_url` set in the `cases` table.

---

## Task 1 — Supabase Schema

Add `pdf_url text` column to the existing `cases` table.

Create a new table `note_pdf_links`:
- id (uuid, primary key)
- case_id (uuid, foreign key → cases.id, cascade delete)
- link_id (text) — matches `data-link-id` attribute on note spans
- pdf_page (integer, 1-indexed)
- x (float) — PDF user-space units
- y (float) — PDF user-space units (measured from bottom of page)
- width (float)
- height (float)
- label (text, nullable) — e.g. "¶58 — Core Ratio"
- created_at (timestamptz, default now())

Enable RLS. Students: SELECT only. Admin: INSERT/UPDATE via service_role.

---

## Task 2 — PDF.js Setup

Install `pdfjs-dist`. Copy `pdf.worker.min.mjs` from `node_modules/pdfjs-dist/build/` to `public/pdf.worker.min.js`. Add a `postinstall` script to `package.json` to automate this.

In all PDF-related components, set:
```ts
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
```

---

## Task 3 — NotesJudgmentLayout Component

Create `components/judgment/NotesJudgmentLayout.tsx`.

This component:
- Accepts `caseId: string`, `pdfUrl: string | null`, `children: React.ReactNode` (the existing notes content).
- Manages a `mode` state: `'notes'` | `'split'`.
- If `pdfUrl` is null → render children only (notes-only, no toggle shown).
- If `pdfUrl` exists → render a toggle button in the top-right ("Notes Only" / "Notes + Judgment"). Default is `'notes'`.
- When mode is `'split'`:
  - Render a two-column layout: `grid-template-columns: 1fr 4px 1fr`.
  - Left column: existing notes children.
  - Middle: draggable divider (mousedown → mousemove → resize columns).
  - Right column: `<JudgmentPanel />`.
- When mode is `'notes'`: render children only.
- Fetch `note_pdf_links` for this `caseId` from Supabase on mount. Pass the array as `linkMappings` prop to `JudgmentPanel`.
- Render an SVG overlay `<BezierConnector />` that sits `position: fixed` over the full viewport, `pointer-events: none`, `z-index: 100`.

---

## Task 4 — JudgmentPanel Component

Create `components/judgment/JudgmentPanel.tsx`.

Props:
- `pdfUrl: string`
- `linkMappings: NotePdfLink[]`
- `activeLinkId: string | null`
- `onHighlightReady: (linkId: string, rect: DOMRect) => void`

Behaviour:
- Load the PDF using `pdfjsLib.getDocument(pdfUrl).promise`.
- Render all pages using virtualised loading: create placeholder divs for each page with correct height. Use IntersectionObserver — when a placeholder enters the viewport, render the actual canvas for that page.
- Each rendered canvas has `data-page="{pageNum}"` attribute and is wrapped in a `position: relative` container div.
- When `activeLinkId` changes and is non-null:
  - Find the mapping for that `linkId` in `linkMappings`.
  - Scroll to the page container smoothly.
  - After scroll completes (wait 600ms), render a `<HighlightOverlay />` on that page with the correct coordinates.
  - Call `onHighlightReady` with the link ID and the bounding rect of the highlight box so the parent can draw the bezier line.
  - Remove the highlight after 4 seconds.
- Clicking anywhere on a page canvas triggers Web Speech for that page:
  ```ts
  const page = await pdf.getPage(pageNum)
  const textContent = await page.getTextContent()
  const text = textContent.items.map((item: any) => item.str).join(' ')
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-IN'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
  ```
- While speaking, show a subtle "Speaking..." badge on the active page header.

Coordinate conversion (PDF-space to screen-space):
```ts
const scale = 1.3
const screenX = link.x * scale
const screenY = (viewport.height - (link.y + link.height) * scale)
const screenW = link.width * scale
const screenH = link.height * scale
```

---

## Task 5 — HighlightOverlay Component

Create `components/judgment/HighlightOverlay.tsx`.

Props: `x, y, width, height` (all in screen pixels, pre-converted).

Renders: an absolutely-positioned div on top of the page canvas with:
- `background: rgba(201, 146, 42, 0.35)` (amber-gold)
- `border: 1.5px solid rgba(201, 146, 42, 0.8)`
- `border-radius: 3px`
- CSS keyframe animation `pulse-border` on mount (box-shadow pulse, same as prototype).
- `pointer-events: none`

---

## Task 6 — BezierConnector Component

Create `components/judgment/BezierConnector.tsx`.

Props: `fromRect: DOMRect | null`, `toRect: DOMRect | null`, `visible: boolean`.

Renders a full-viewport SVG (`position: fixed, top: 0, left: 0, width: 100%, height: 100%, pointer-events: none`).

When `visible` and both rects are set:
- Draw a cubic bezier `<path>` from `(fromRect.right, fromRect.top + fromRect.height/2)` to `(toRect.left, toRect.top + toRect.height/2)`.
- Control points: `cx1 = x1 + (x2-x1)*0.45`, `cx2 = x2 - (x2-x1)*0.45` (same as prototype).
- Stroke: `#b94a2c`, `stroke-width: 1.5`, `stroke-dasharray: 4 3`, `opacity: 0.7`.
- Transition: `opacity 0.3s`.

---

## Task 7 — Web Speech on Notes Panel

In the existing notes content component, add click handling to paragraphs that have the class `notes-text`:

```ts
const handleParagraphClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
  const text = e.currentTarget.innerText
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-IN'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
  // Add a CSS class to the paragraph while speaking
  // Remove it on utterance.onend
}
```

While speaking, the active paragraph gets a left border `3px solid var(--gold)` and a `Speaking...` micro-badge.

---

## Task 8 — Linking Notes Phrases to PDF

In the existing notes content, add `data-link-id` attribute to the tagged anchor spans:

```html
<span 
  class="linked-text" 
  data-link-id="link-ratio"
  onClick={handleLinkClick}
>
  cannot alter the Basic Structure
</span>
```

In `NotesJudgmentLayout`, maintain `activeLinkId` state. `handleLinkClick` sets `activeLinkId`. Pass it down to `JudgmentPanel`.

Also maintain:
- `fromRect: DOMRect | null` — bounding rect of the clicked span.
- `toRect: DOMRect | null` — bounding rect of the highlight box in the PDF (passed back via `onHighlightReady`).

Pass both to `<BezierConnector />`.

Clear both after 4 seconds (same timing as highlight removal).

---

## Task 9 — Admin Tagging Tool

Create `app/admin/tag/[caseId]/page.tsx`.

Protect with existing admin auth middleware.

This page:
1. Loads the case's `pdf_url` and renders the full judgment PDF using the same `pdfjs-dist` setup.
2. All pages rendered at `scale: 1.3` in a scrollable container.
3. Each page canvas has a transparent mouse-event-capturing overlay div on top.
4. Drag interaction on this overlay:
   - `mousedown` → record `startX, startY` relative to the canvas container.
   - `mousemove` → render a live selection rectangle (`position: absolute`, `border: 2px dashed #c9922a`, `background: rgba(201,146,42,0.15)`).
   - `mouseup` → compute `{ mouseX, mouseY, mouseW, mouseH }` → convert to PDF-space:
     ```ts
     const scale = 1.3
     const pdfX = mouseX / scale
     const pdfY = pageHeightPdfUnits - (mouseY / scale) - (mouseH / scale)
     const pdfW = mouseW / scale
     const pdfH = mouseH / scale
     ```
   - Open a modal with: link_id text input (or dropdown of existing note link IDs for this case), label text input (optional), and a Save button.
   - On Save: insert into `note_pdf_links` via Supabase, close modal, reset selection.

5. On load, fetch all existing `note_pdf_links` for this case. Render each as a coloured overlay on the correct page canvas. Hovering shows the `link_id` in a tooltip.

6. A sidebar lists all existing mappings with a Delete button for each.

---

## Style Rules

- Match the existing Gavelogy dark amber-gold legal aesthetic.
- Use Tailwind classes wherever possible.
- The split layout, drag divider, and bezier lines should feel identical to the existing prototype.
- No new fonts — use existing IBM Plex Serif, Playfair Display, IBM Plex Mono already imported.

---

## What to Ask If Unclear

- If you don't know where the existing notes component is: ask for the file path.
- If you don't know how the existing admin auth middleware works: ask before adding auth checks.
- If you need the existing Supabase client setup: ask for the util file path.
- Do not guess at existing component names or import paths — ask.

---

## Deliverables

1. SQL migration file for schema changes.
2. `NotesJudgmentLayout.tsx`
3. `JudgmentPanel.tsx` with `useVirtualPDF.ts` hook
4. `HighlightOverlay.tsx`
5. `BezierConnector.tsx`
6. Updated notes content component (Web Speech added)
7. Admin tagging page: `app/admin/tag/[caseId]/page.tsx` with `TaggingCanvas.tsx` and `TagModal.tsx`
8. Postinstall script update in `package.json`

Build one deliverable at a time and confirm before moving to the next.
```