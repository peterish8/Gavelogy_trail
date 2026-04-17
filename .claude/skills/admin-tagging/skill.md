---
name: Admin Tagging Tool
description: Load when working on the admin content tagging UI, judgment mode admin panel, case annotation workflows, or admin-only routes
---

# Purpose
Gavelogy's admin content creation tool — a specialized interface for tagging PDF case documents with highlights and linking them to structured notes. Used to prepare judgment case content for students.

# When to Use
- Adding features to the admin tagging interface
- Debugging annotation save/load issues
- Building new admin content workflows
- Adding access control to admin routes
- Extending the tag data model

# Setup
Routes:
```
/admin/tag                     → Case listing (choose a case to tag)
/admin/tag/[caseId]            → Full tagging interface for a case
```

Key files:
| File | Purpose |
|------|---------|
| `src/app/admin/tag/[caseId]/page.tsx` | Admin tagging page (layout + data loading) |
| `src/app/admin/tag/[caseId]/TaggingCanvas.tsx` | Interactive PDF with annotation drawing |
| `src/app/admin/tag/[caseId]/NotesPanel.tsx` | Notes editor and management panel |
| `src/app/admin/tag/[caseId]/TagModal.tsx` | Create/edit individual tags |
| `src/app/admin/layout.tsx` | Admin layout with auth guard |
| `src/actions/judgment/links.ts` | Server actions for saving tag-note links |
| `src/components/judgment/` | Shared judgment components (viewer, connectors) |

# Core Concepts

## Data Model
```ts
interface CaseTag {
  id: string;
  case_id: string;
  page_number: number;
  // Coordinates as percentages (0–100)
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;           // rgba string for highlight color
  label: string;           // admin-defined label
  linked_note_id: string | null; // links to a note
  created_at: string;
  created_by: string;      // admin user_id
}

interface NoteTag {
  id: string;
  note_id: string;
  case_tag_id: string;     // paired with CaseTag
  text_selection: string;  // the text in the note that's linked
  created_at: string;
}
```

## Admin Role Check
```ts
// All admin routes must verify admin role
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}
```

## Tagging Workflow
```
1. Admin navigates to /admin/tag
2. Selects a case from the list
3. Full-screen split view loads:
   - Left: PDF viewer with existing highlights
   - Right: Notes panel with linked note sections
4. Admin clicks + drags on PDF to create new tag region
5. TagModal opens to assign color, label, link to note
6. Tag saved to Supabase → highlight appears on PDF
7. Admin selects text in notes → links to existing tag
8. Bezier connector drawn between note text and PDF highlight
```

# Best Practices

## Admin Route Protection
```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase';

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  return <AdminShell>{children}</AdminShell>;
}
```

## Saving a New Tag
```ts
// actions/judgment/links.ts
'use server';

export async function createCaseTag(tagData: Omit<CaseTag, 'id' | 'created_at' | 'created_by'>) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Validate coordinates
  if (tagData.x < 0 || tagData.x > 100 || tagData.y < 0 || tagData.y > 100) {
    throw new Error('Invalid tag coordinates');
  }

  const { data, error } = await supabase
    .from('case_tags')
    .insert({ ...tagData, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

## Tag Color Palette
```ts
// Consistent colors across admins
export const TAG_COLORS = [
  { label: 'Issue', value: 'rgba(239, 68, 68, 0.3)', solid: '#ef4444' },    // Red
  { label: 'Rule', value: 'rgba(59, 130, 246, 0.3)', solid: '#3b82f6' },    // Blue
  { label: 'Analysis', value: 'rgba(234, 179, 8, 0.3)', solid: '#eab308' }, // Yellow
  { label: 'Conclusion', value: 'rgba(34, 197, 94, 0.3)', solid: '#22c55e' }, // Green
  { label: 'Note', value: 'rgba(168, 85, 247, 0.3)', solid: '#a855f7' },    // Purple
];
```

## Linking Note Text to PDF Tag
```tsx
function NotesPanel({ caseId, tags }: NotesPanelProps) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectedTagId) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Save note-tag link
    createNoteTagLink({ case_tag_id: selectedTagId, text_selection: selectedText });
  };

  return (
    <div onMouseUp={handleTextSelection} className="relative">
      {/* Notes content */}
      <NoteRenderer content={noteContent} highlightedTags={tags} />
    </div>
  );
}
```

# Code Examples

## Tag Modal
```tsx
function TagModal({ region, onSave, onClose }: TagModalProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0].value);
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);

  const handleSave = async () => {
    await createCaseTag({ ...region, label, color, linked_note_id: linkedNoteId });
    onSave();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Annotation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Key Issue" />
          </div>

          <div>
            <Label>Category</Label>
            <div className="flex gap-2 mt-1">
              {TAG_COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn('w-8 h-8 rounded-full border-2 transition', color === c.value ? 'border-white' : 'border-transparent')}
                  style={{ backgroundColor: c.solid }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Link to Note (optional)</Label>
            <NoteSelector caseId={region.case_id} value={linkedNoteId} onChange={setLinkedNoteId} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!label}>Save Annotation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Admin Case List Page
```tsx
// app/admin/tag/page.tsx
async function AdminCaseListPage() {
  const supabase = await createSupabaseServer();
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, year, case_number, tag_count')
    .order('year', { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Case Tagging</h1>
      <div className="grid gap-4">
        {cases?.map((c) => (
          <Link key={c.id} href={`/admin/tag/${c.id}`}>
            <CaseCard case={c} />
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## Draft Content Cache
```ts
// Save admin draft before finalizing
async function saveDraft(caseId: string, content: object) {
  await supabase.from('draft_content_cache').upsert(
    {
      case_id: caseId,
      content: JSON.stringify(content),
      saved_at: new Date().toISOString(),
    },
    { onConflict: 'case_id' }
  );
}

// Auto-save every 30 seconds
useEffect(() => {
  const interval = setInterval(() => saveDraft(caseId, currentContent), 30000);
  return () => clearInterval(interval);
}, [caseId, currentContent]);
```

# Common Pitfalls

1. **No admin role check** → any logged-in user can access /admin routes
2. **Not validating coordinate ranges** → negative or >100 values break overlay rendering
3. **Overwriting other admin's tags** → use `created_by` filtering to show only own tags in edit mode
4. **Draft not saved on navigation** → add `beforeunload` warning if unsaved changes
5. **Tag modal state not reset** → old tag data persists in modal when creating new tag

# Performance Notes
- Admin page load can be slow with large PDFs — show page-by-page loading indicator
- Draft auto-save: debounce to avoid excessive DB writes
- Tag list re-fetch on every save — consider optimistic updates instead
- Use `tag_count` denormalized column on cases table to avoid expensive COUNT queries

# Security Notes
- Admin routes MUST use server-side role check (not client-side)
- Tag coordinates validated server-side before insert
- Draft cache may contain unpublished content — RLS should restrict to admin role only
- Admin actions are logged for audit trail

# Testing Strategy
```ts
// Test admin route protection
it('redirects non-admin to dashboard', async () => {
  mockUser({ role: 'student' });
  const response = await GET('/admin/tag');
  expect(response).toRedirectTo('/dashboard');
});

// Test coordinate validation
it('rejects out-of-range coordinates', async () => {
  await expect(createCaseTag({ x: 150, y: 50, /* ... */ })).rejects.toThrow('Invalid tag coordinates');
});
```

# Upgrade / Versioning Notes
- If PDF viewer library changes, coordinate system may need recalibration
- If case data model changes (e.g., adding subjects), update TagModal dropdowns
- Consider migrating to a dedicated annotation library (e.g., `@recogito/annotorious`) for richer features

# Related Skills
- `pdf-annotation` — PDF rendering and highlight overlay implementation
- `supabase-integration` — Tag data persistence and RLS
- `nextjs-app-router` — Server-side role checking in layouts
