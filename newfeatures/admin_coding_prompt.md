# Admin Coding Prompt — Notes + Judgment Mode (Complete)

Copy-paste this entire file into Cursor / Windsurf. It contains everything needed to build
the admin tagging tool + Backblaze B2 PDF storage + signed URL serving for students.

---

## WHAT THIS PROJECT IS

**Gavel** (folder name is "Gavelogy The proto" — ignore that) is a Next.js 15 App Router +
Supabase + TypeScript + Tailwind CSS legal EdTech SaaS for CLAT PG students.
Stack: React 19, pnpm, Zustand, pdfjs-dist 5.5.207.

---

## WHAT HAS ALREADY BEEN BUILT (DO NOT TOUCH OR REBUILD)

### Student-side (already working, leave alone):
- `/src/components/judgment/useVirtualPDF.ts` — hook that loads a PDF via pdfjs-dist v5.
  Key: uses `{ canvas, viewport }` NOT `canvasContext` for `page.render()`.
- `/src/components/judgment/JudgmentPanel.tsx` — PDF viewer panel for students. Virtualized
  with IntersectionObserver. Receives `pdfUrl` as a prop (will be a signed URL).
- `/src/components/judgment/NotesJudgmentLayout.tsx` — Split-panel layout wrapper. Wraps the
  notes page. Shows "Notes Only / Notes + Judgment" toggle. Currently passes `pdfUrl` directly
  from Supabase structure_items. **Needs to be updated to fetch a signed URL via API instead.**
- `/src/components/judgment/HighlightOverlay.tsx` — Amber-gold pulsing highlight on PDF.
- `/src/components/judgment/BezierConnector.tsx` — SVG bezier line from note span to PDF.
- `/src/actions/judgment/links.ts` — All Supabase helpers:
  - `fetchLinksForItem(itemId)` — read note_pdf_links for a case
  - `checkItemHasPdf(itemId)` — returns pdf_url stored in structure_items or null
  - `insertLink(payload)` — admin insert via service role
  - `deleteLink(id)` — admin delete via service role
  - `updateItemPdfUrl(itemId, pdfUrl)` — save B2 object key to structure_items.pdf_url
  - `fetchAllCaseItems()` — returns all structure_items matching CS-/CQ-/CR- title pattern
- `/src/app/cases/[year]/[caseNumber]/notes/page.tsx` — student notes page. Already wraps
  content in `<NotesJudgmentLayout>`. Passes `itemId` (UUID) and `pdfUrl` (from Supabase).

### Admin skeleton (already scaffolded, needs proper implementation):
- `/src/lib/admin-auth.ts` — `isAdmin()` checks email against `NEXT_PUBLIC_ADMIN_EMAILS` env.
- `/src/app/admin/layout.tsx` — Admin layout + sidebar. Auth guard already working.
- `/src/app/admin/tag/page.tsx` — Case list. Scaffolded. Currently uploads to Supabase Storage
  (wrong). **Needs to be rewritten to upload to Backblaze B2 via API route.**
- `/src/app/admin/tag/[caseId]/page.tsx` — Tagging workspace. Scaffolded.
- `/src/app/admin/tag/[caseId]/TaggingCanvas.tsx` — Drag-select on PDF. Scaffolded.
- `/src/app/admin/tag/[caseId]/TagModal.tsx` — Save link modal. Scaffolded.

---

## STORAGE: BACKBLAZE B2 (PRIVATE BUCKET)

PDFs are stored in Backblaze B2 (NOT Supabase Storage). The bucket is **private** so PDFs
cannot be accessed without a signed (pre-signed) URL. Signed URLs expire after 24 hours but
are regenerated automatically on every page load.

### Environment variables (already in .env.local):
```
BACKBLAZE_KEY_ID=0034d70372148900000000001
BACKBLAZE_APP_KEY=K003crfVf8P6uXFUK0gCpXiWdChcbcg
BACKBLAZE_BUCKET_NAME=gavelogy-judgments
BACKBLAZE_BUCKET_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
```

### B2 is S3-compatible — use AWS SDK v3:
```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.BACKBLAZE_BUCKET_ENDPOINT,
  region: 'eu-central-003',   // extract from endpoint: s3.{region}.backblazeb2.com
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APP_KEY!,
  },
  forcePathStyle: true,  // required for B2
})
```

### Object key convention (what gets stored in structure_items.pdf_url):
```
{caseId}/{originalFilename}.pdf
e.g: "abc-uuid-123/CS-25-A-01.pdf"
```

**Important:** `structure_items.pdf_url` stores the **B2 object key** (e.g. `abc-uuid/file.pdf`),
NOT a full URL. The full URL is generated on-demand as a signed URL via API route.

### Install required package:
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## DATABASE SCHEMA (TRUTH — from Supabase)

### `structure_items` table
```
id          uuid  PK
title       text  NOT NULL   -- e.g. "CS-25-A-01", "CQ-24-05", "CR-23-03"
item_type   text  NOT NULL
course_id   uuid
parent_id   uuid  nullable
description text  nullable
icon        text  nullable
order_index integer
is_active   boolean default true
pdf_url     text  nullable   -- stores B2 object key e.g. "{caseId}/CS-25-A-01.pdf"
created_at  timestamptz
updated_at  timestamptz
```

### `note_pdf_links` table
```
id          uuid  PK  default gen_random_uuid()
item_id     uuid  FK → structure_items(id) ON DELETE CASCADE
link_id     text  NOT NULL   -- matches data-link-id on note span e.g. "link-ratio"
pdf_page    integer NOT NULL  -- 1-indexed
x           float NOT NULL    -- PDF user-space units (bottom-left origin)
y           float NOT NULL    -- PDF user-space units (from bottom of page)
width       float NOT NULL
height      float NOT NULL
label       text  nullable
created_at  timestamptz default now()
```
RLS: SELECT open to all. INSERT/DELETE via service_role only (use helpers in links.ts).

### `note_contents` table
```
id           uuid PK
item_id      uuid FK → structure_items(id)
content_html text   -- custom tag format
```

---

## COORDINATE SYSTEM (CRITICAL — must be consistent)

PDF.js v5 uses bottom-left origin. Screen uses top-left origin.

**PDF-space → screen-space (for rendering highlights):**
```ts
const SCALE = 1.3  // Must be 1.3 everywhere
const screenX = link.x * SCALE
const screenY = canvas.height - (link.y + link.height) * SCALE
const screenW = link.width * SCALE
const screenH = link.height * SCALE
```

**Screen-space → PDF-space (for saving admin drag selections):**
```ts
const pageHeightPdf = canvas.height / SCALE
const pdfX = mouseX / SCALE
const pdfH = mouseH / SCALE
const pdfY = pageHeightPdf - (mouseY / SCALE) - pdfH
const pdfW = mouseW / SCALE
```

---

## pdfjs-dist v5 USAGE (API changed from v4 — do not use old syntax)

```ts
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

const pdf = await pdfjsLib.getDocument(pdfUrl).promise
const page = await pdf.getPage(pageNum)  // 1-indexed
const viewport = page.getViewport({ scale: 1.3 })

canvas.width = viewport.width
canvas.height = viewport.height
await page.render({ canvas, viewport }).promise  // ← canvas element, NOT getContext('2d')

const textContent = await page.getTextContent()
const text = textContent.items.map((item: any) => item.str).join(' ')
```

---

## SUPABASE CLIENT

```ts
// Browser reads:
import { supabase } from '@/lib/supabase-client'

// Admin writes (service role):
import { createClient } from '@supabase/supabase-js'
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
// Or just use insertLink / deleteLink / updateItemPdfUrl from /src/actions/judgment/links.ts
```

---

## ADMIN AUTH

```ts
import { isAdmin } from '@/lib/admin-auth'
const ok = await isAdmin()  // true if email is in NEXT_PUBLIC_ADMIN_EMAILS
```
Admin layout already handles redirect. All admin API routes must also verify admin.

---

## WHAT YOU NEED TO BUILD

Build in this exact order:

---

### STEP 1 — Install AWS SDK

Run in terminal:
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

### STEP 2 — `/src/lib/b2-client.ts` (NEW FILE)

Shared B2/S3 client used by API routes:

```ts
import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.BACKBLAZE_BUCKET_ENDPOINT!  // https://s3.eu-central-003.backblazeb2.com
// Extract region from endpoint: "eu-central-003"
const region = endpoint.replace('https://s3.', '').replace('.backblazeb2.com', '')

export const b2Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APP_KEY!,
  },
  forcePathStyle: true,
})

export const BUCKET = process.env.BACKBLAZE_BUCKET_NAME!
```

---

### STEP 3 — `/src/app/api/judgment/upload/route.ts` (NEW FILE)

Upload a PDF to Backblaze B2. Called from the admin tag list page.

**Method:** POST (multipart/form-data)
**Body fields:**
- `file` — the PDF File
- `caseId` — UUID of the structure_item

**Logic:**
1. Verify admin: get Supabase user from Authorization header, check email against `NEXT_PUBLIC_ADMIN_EMAILS`. Return 401 if not admin.
2. Parse `formData`, get `file` and `caseId`
3. Read file as ArrayBuffer
4. Build object key: `{caseId}/{file.name}` (sanitize filename — replace spaces with `-`)
5. Upload to B2 using `PutObjectCommand`:
   ```ts
   import { PutObjectCommand } from '@aws-sdk/client-s3'
   await b2Client.send(new PutObjectCommand({
     Bucket: BUCKET,
     Key: objectKey,
     Body: Buffer.from(await file.arrayBuffer()),
     ContentType: 'application/pdf',
   }))
   ```
6. Save the object key to `structure_items.pdf_url` using `updateItemPdfUrl(caseId, objectKey)`
   (Note: we store just the key, not a full URL — signed URLs are generated separately)
7. Return `{ success: true, objectKey }`

**Error handling:** return proper JSON error responses with status codes.

---

### STEP 4 — `/src/app/api/judgment/signed-url/route.ts` (NEW FILE)

Generate a 24-hour signed URL for a PDF. Called by student viewer and admin.

**Method:** GET
**Query params:** `?itemId={uuid}`

**Logic:**
1. Get `itemId` from query params
2. Fetch `pdf_url` (object key) from `structure_items` via Supabase:
   ```ts
   const { data } = await supabase.from('structure_items').select('pdf_url').eq('id', itemId).single()
   ```
3. If no `pdf_url`, return `{ url: null }`
4. Generate signed URL using `@aws-sdk/s3-request-presigner`:
   ```ts
   import { GetObjectCommand } from '@aws-sdk/client-s3'
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

   const command = new GetObjectCommand({ Bucket: BUCKET, Key: data.pdf_url })
   const url = await getSignedUrl(b2Client, command, { expiresIn: 86400 }) // 24 hours
   ```
5. Return `{ url }`

**No auth required** — the signed URL itself is the access control (expires in 24h, random token).

---

### STEP 5 — Update `/src/components/judgment/NotesJudgmentLayout.tsx`

**Current behaviour:** receives `pdfUrl` (raw from structure_items) and passes it directly to JudgmentPanel.

**Change needed:** When `pdfUrl` (object key) is not null, fetch a signed URL via the API before passing to JudgmentPanel.

**Change only these parts:**
1. Add state: `const [signedUrl, setSignedUrl] = useState<string | null>(null)`
2. Add effect: when `itemId` changes and `pdfUrl` is not null, fetch signed URL:
   ```ts
   useEffect(() => {
     if (!itemId || !pdfUrl) return
     fetch(`/api/judgment/signed-url?itemId=${itemId}`)
       .then(r => r.json())
       .then(d => setSignedUrl(d.url ?? null))
   }, [itemId, pdfUrl])
   ```
3. Pass `signedUrl` to JudgmentPanel instead of `pdfUrl`
4. Show nothing (return children only) if `signedUrl` is null even when `pdfUrl` exists (still loading)

**Do NOT change anything else in this file.**

---

### STEP 6 — Rewrite `/src/app/admin/tag/page.tsx`

**Purpose:** Case list with Backblaze PDF upload (replacing old Supabase Storage upload).

**Key change:** The upload button now POSTs to `/api/judgment/upload` with `FormData` instead
of using the Supabase storage client.

```ts
async function handlePdfUpload(caseId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('caseId', caseId)

  // Get auth token for admin verification
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch('/api/judgment/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: formData,
  })
  const result = await res.json()
  if (!result.success) throw new Error(result.error)

  // Update local state — pdf_url is now set
  setCases(prev => prev.map(c => c.id === caseId ? { ...c, pdf_url: result.objectKey } : c))
}
```

**Full layout:**
- Dark amber theme (`bg-[#0f0e0b]`, amber accents)
- Page header: "Tag Cases" + subtitle
- Search/filter input (filter by case title)
- List of cases, each row:
  - Case title (bold)
  - PDF status badge: green "✓ PDF" or grey "No PDF"
  - Link count badge: "N links"
  - Upload button (file input, `.pdf` only, calls `handlePdfUpload`)
  - "Tag →" button — disabled + muted if no pdf_url, active amber if pdf_url exists, links to `/admin/tag/{caseId}`
- Loading skeleton while fetching
- Error state

---

### STEP 7 — Rewrite `/src/app/admin/tag/[caseId]/TaggingCanvas.tsx`

**Purpose:** Render full PDF + drag-select rectangular regions.

**Props:**
```ts
interface TaggingCanvasProps {
  pdfUrl: string                    // signed URL (24h) for the PDF
  existingLinks: NotePdfLink[]
  onRegionSelected: (region: { page: number; x: number; y: number; width: number; height: number }) => void
}
```

**pdfUrl here is a signed URL** — fetched by the parent page via `/api/judgment/signed-url`.

**Behaviour:**
1. Load PDF using `useVirtualPDF` hook from `/src/components/judgment/useVirtualPDF.ts`
2. Render all pages at `SCALE = 1.3` with IntersectionObserver virtualisation
3. Each page wrapper: `position: relative`
   - `<canvas>` element for rendering
   - Existing link overlays: coloured semi-transparent divs at correct screen coords (use coordinate conversion above)
   - Interaction overlay: `position: absolute, inset: 0, cursor: crosshair, z-index: 10`
4. Drag-select:
   - `mousedown` → save `startX/Y` relative to page container
   - `mousemove` → show live dashed selection rect (`border: 2px dashed #c9922a`)
   - `mouseup` → convert to PDF coords → call `onRegionSelected()` → clear drag state
   - Minimum drag size: 8px in both dimensions (ignore tiny accidental clicks)
5. Existing overlays: hover shows tooltip with `link_id` and `label`
6. Page label "Page N" above each canvas

**Coordinate conversion (screen → PDF-space) on mouseup:**
```ts
const canvas = canvasRefs.get(pageNum)
const pageHeightPdf = canvas.height / 1.3
const pdfX = mouseX / 1.3
const pdfH = mouseH / 1.3
const pdfY = pageHeightPdf - (mouseY / 1.3) - pdfH
const pdfW = mouseW / 1.3
onRegionSelected({ page: pageNum, x: pdfX, y: pdfY, width: pdfW, height: pdfH })
```

---

### STEP 8 — Rewrite `/src/app/admin/tag/[caseId]/TagModal.tsx`

**Props:**
```ts
interface TagModalProps {
  region: { page: number; x: number; y: number; width: number; height: number }
  existingLinkIds: string[]        // already saved for this case
  noteContentLinkIds: string[]     // parsed from note content data-link-id attrs (suggestions)
  onSave: (linkId: string, label: string) => Promise<void>
  onClose: () => void
}
```

**UI:**
- Fixed overlay, dark backdrop, centered card
- Region info line: "Page N · (x, y) · WxH PDF units"
- `link_id` text input (required)
- Suggestion chips below input: show `noteContentLinkIds` as clickable chips — clicking fills input
- Warning if typed value already exists in `existingLinkIds`
- `label` text input (optional), placeholder: `e.g. ¶58 — Core Ratio`
- Save button (disabled while saving), Cancel button
- On Save: validate not empty, not duplicate → `await onSave(linkId, label)` → modal closes

---

### STEP 9 — Rewrite `/src/app/admin/tag/[caseId]/page.tsx`

**Purpose:** Full tagging workspace for one case.

**Data to load on mount:**
1. `structure_items` row for `caseId` → get `title` and `pdf_url` (object key)
2. If `pdf_url` exists: fetch signed URL from `/api/judgment/signed-url?itemId={caseId}`
3. `fetchLinksForItem(caseId)` → existing mappings
4. `note_contents` for this case → parse `data-link-id="([^"]+)"` regex → `noteContentLinkIds[]`

```ts
// Fetch note content for link ID suggestions
const { data: noteContent } = await supabase
  .from('note_contents')
  .select('content_html')
  .eq('item_id', caseId)
  .single()

const noteContentLinkIds = noteContent?.content_html
  ? [...noteContent.content_html.matchAll(/data-link-id="([^"]+)"/g)].map(m => m[1])
  : []
```

**Layout (full height, two-column):**
```
┌──────────────────────────┬──────────────────┐
│ ← Back  |  CS-25-A-01   │  Mappings (3)    │
├──────────────────────────┤  ──────────────  │
│                          │  link-ratio      │
│   <TaggingCanvas />      │  ¶58 Core Ratio  │
│                          │  Page 12   🗑    │
│   (shows signed URL PDF) │  ──────────────  │
│                          │  link-basic      │
│                          │  Page 45   🗑    │
└──────────────────────────┴──────────────────┘
```

- Left 70%: `<TaggingCanvas pdfUrl={signedUrl} existingLinks={links} onRegionSelected={...} />`
- Right 30%: Mappings sidebar — scrollable list, each entry has link_id, label, page, delete button
- Delete: `await deleteLink(id)` → remove from state
- When `onRegionSelected` fires → show `<TagModal>` with `noteContentLinkIds`
- When TagModal saves → `await insertLink(payload)` → refresh links → close modal

**If no PDF:** show message "No PDF uploaded. Go back and upload one."
**If loading signed URL:** show spinner.

---

## STYLE GUIDE

- Background: `#0f0e0b`
- Text: `text-amber-50`, `text-amber-200`, `text-amber-400`
- Muted: `text-amber-600`, `text-amber-700`
- Borders: `border-amber-900/30`, `border-amber-800/40`
- Accent: `bg-amber-600 hover:bg-amber-500 text-white`
- Cards: `bg-amber-950/20 border border-amber-900/30 rounded-lg`
- Danger: `text-red-400 hover:text-red-300`
- Success: `text-green-400`
- Tailwind only, no new fonts, no new UI libraries.

---

## DO NOT TOUCH

- `/src/components/judgment/useVirtualPDF.ts`
- `/src/components/judgment/JudgmentPanel.tsx`
- `/src/components/judgment/HighlightOverlay.tsx`
- `/src/components/judgment/BezierConnector.tsx`
- `/src/actions/judgment/links.ts`
- `/src/app/cases/[year]/[caseNumber]/notes/page.tsx`
- `/src/lib/admin-auth.ts`
- `/src/app/admin/layout.tsx`
- Any Supabase migration files

---

## COMPLETE FILE LIST TO BUILD (in order)

```
1. pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

2. src/lib/b2-client.ts                                    ← NEW
3. src/app/api/judgment/upload/route.ts                    ← NEW
4. src/app/api/judgment/signed-url/route.ts                ← NEW
5. src/components/judgment/NotesJudgmentLayout.tsx         ← MODIFY (signed URL fetch)
6. src/app/admin/tag/page.tsx                              ← REWRITE (B2 upload)
7. src/app/admin/tag/[caseId]/TaggingCanvas.tsx            ← REWRITE (full implementation)
8. src/app/admin/tag/[caseId]/TagModal.tsx                 ← REWRITE (full implementation)
9. src/app/admin/tag/[caseId]/page.tsx                     ← REWRITE (full implementation)
```

Build one file at a time. After each file confirm it compiles before moving to the next.
