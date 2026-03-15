# PRD — Gavelogy: Notes + Judgment Mode

## Overview

An optional reading mode added to Gavelogy's existing notes system. When a case has a judgment PDF attached and tagged by admin, students can switch into "Notes + Judgment" mode — a split-panel view where the left shows the existing notes and the right shows the real PDF rendered via PDF.js. Tagged phrases in the notes are clickable and jump the PDF to the exact paragraph with a highlight. Both panels support Web Speech (click any sentence/page to hear it read aloud). Cases without a judgment PDF simply stay in the existing notes-only view.

## Problem Statement

The existing notes page is already built and works well. But for cases where students need to cross-reference the actual judicial language (especially for CLAT PG assertion-reasoning and passage-based questions), flipping between a notes tab and a separate PDF is friction. A side-by-side linked view eliminates that context-switching.

## Goals

- Add a "Notes + Judgment" mode toggle to the existing notes page UI.
- Render the real judgment PDF on the right panel.
- Link tagged note phrases to exact PDF coordinates (page + bounding box).
- Add Web Speech to both panels so any click reads the content aloud.
- Give admins a tagging tool to create note→PDF mappings for any case.

## Non-Goals

- Does not replace or modify the existing notes-only view.
- No student-side PDF annotation or highlighting.
- No AI tagging or auto-linking.
- No mobile layout in MVP — desktop only.
- Courses without a PDF stay exactly as they are today.

## Target Users

**Students:** CLAT PG aspirants who already use Gavelogy notes. This mode is opt-in — they only see the toggle if the case has a judgment PDF mapped.

**Admin / Content Team:** Gavelogy internal team who uploads judgment PDFs and creates the note→PDF coordinate mappings via the admin tagging tool.

## Core Features

### MVP

- **Mode Toggle:** A button on the existing notes page — "Notes Only" / "Notes + Judgment". Visible only if the case has a `pdf_url` in DB. Defaults to Notes Only.
- **Split Layout:** When mode switches, page becomes a 50/50 draggable split. Left = existing notes content. Right = PDF viewer panel. All existing notes functionality (sticky notes, confidence tags, highlights) unchanged.
- **PDF Viewer (Right Panel):** `pdfjs-dist` renders judgment PDF as canvas pages. Virtualized — renders only ±2 pages from current scroll position. Scroll is independent of left panel.
- **Note→PDF Linking:** Tagged phrases in notes carry `data-link-id`. Admin maps each `link_id` to `{ page, x, y, width, height }` in Supabase. On click: scroll PDF to page → amber-gold highlight overlay box (pulse animation) → bezier SVG line from note span to highlight box.
- **Web Speech — Notes Panel:** Click inside any paragraph → reads that paragraph aloud via `window.speechSynthesis`. Active paragraph gets a subtle left-border indicator while speaking. Click again to stop.
- **Web Speech — PDF Panel:** Click anywhere on PDF canvas → reads that page's text aloud using `pdfjs getTextContent()` + `speechSynthesis`. Page-level in MVP (canvas renders as image, not selectable text).
- **Admin Tagging Tool:** A `/admin/tag/[case-id]` page. Shows the judgment PDF. Admin drag-selects a region → modal prompts for `link_id` → saves `{ case_id, link_id, page, x, y, width, height }` to `note_pdf_links` in Supabase. Existing mappings shown as coloured overlays.

### V2 / Nice to Have

- Sentence-level speech on PDF (requires text layer overlay)
- Bidirectional: clicking a PDF highlight also highlights the corresponding note
- Paragraph number overlay on PDF (¶58, ¶91 clickable)
- Mobile stacked/swipeable layout

## User Flow

1. Student opens an existing case notes page on Gavelogy.
2. If case has a PDF mapped → a "Notes + Judgment" toggle appears in the header.
3. Student clicks it → layout splits. PDF loads on right.
4. Student reads notes. Tagged phrase (e.g. "cannot alter the Basic Structure") has dashed underline.
5. Student clicks it → PDF scrolls to ¶58 → highlight box appears → bezier line connects both sides.
6. Student clicks any paragraph in notes → reads aloud.
7. Student clicks anywhere on PDF canvas → that page reads aloud.

## Success Metrics

- Admin can tag a full case (10–15 links) in under 20 minutes.
- PDF first page loads in under 2s for a typical 100-page judgment.
- Zero breakage to the existing notes-only view.

## Constraints

- Next.js + Supabase (existing Gavelogy stack).
- `pdfjs-dist` for PDF rendering — no paid services.
- `window.speechSynthesis` — browser native, free.
- Judgment PDFs stored in Supabase Storage.
- PDF highlight is a visual overlay div, not native PDF annotation.

## Open Questions

- Should Notes + Judgment mode be Pro-plan gated or available to all students?
- Should the admin tagging tool live inside the existing admin dashboard or as a standalone route?