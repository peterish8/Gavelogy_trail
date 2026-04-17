'use client';

import { useEffect, useState, use } from 'react';
import { TaggingCanvas } from './TaggingCanvas';
import { TagModal } from './TagModal';
import { NotesPanel } from './NotesPanel';
import {
  fetchLinksForItem,
  insertLink,
  deleteLink,
  updateNoteContent,
} from '@/actions/judgment/links';
import { supabase } from '@/lib/supabase-client';
import type { NotePdfLink } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TagRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AdminTaggingPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const [caseTitle, setCaseTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [links, setLinks] = useState<NotePdfLink[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<TagRegion | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function loadCaseData() {
    setLoading(true);

    // Load case item (title + pdf_url)
    const { data: item } = await supabase
      .from('structure_items')
      .select('title, pdf_url')
      .eq('id', caseId)
      .single();

    if (item) {
      setCaseTitle((item as { title: string; pdf_url: string | null }).title);
      setPdfUrl((item as { title: string; pdf_url: string | null }).pdf_url);
    }

    // Load notes content
    const { data: noteData } = await supabase
      .from('note_contents')
      .select('content_html')
      .eq('item_id', caseId)
      .single();

    if (noteData) {
      setNoteContent((noteData as { content_html: string }).content_html ?? '');
    }

    // Load existing links
    const existingLinks = await fetchLinksForItem(caseId);
    setLinks(existingLinks);

    setLoading(false);
  }

  async function handleSaveLink(linkId: string, label: string) {
    if (!selectedRegion) return;
    const result = await insertLink({
      item_id: caseId,
      link_id: linkId,
      pdf_page: selectedRegion.page,
      x: selectedRegion.x,
      y: selectedRegion.y,
      width: selectedRegion.width,
      height: selectedRegion.height,
      label: label || undefined,
    });
    if (!result.success) throw new Error(result.error);
    setSelectedRegion(null);
    const updated = await fetchLinksForItem(caseId);
    setLinks(updated);
  }

  async function handleDeleteLink(id: string) {
    await deleteLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSaveNotes(newContent: string) {
    const result = await updateNoteContent(caseId, newContent);
    if (!result.success) throw new Error(result.error);
    setNoteContent(newContent);
  }

  // When a linked-text span is clicked in preview mode — clear after 3 s so pulse restarts on re-click
  function handleLinkClick(linkId: string) {
    setHighlightedLinkId(null);
    setTimeout(() => setHighlightedLinkId(linkId), 0);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="p-8">
        <Link
          href="/admin/tag"
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-400 mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <p className="text-amber-400 text-sm">
          No PDF uploaded for <strong>{caseTitle}</strong>. Go back and upload one first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: PDF tagging canvas (55%) */}
      <div className="flex-[0_0_55%] min-w-0 border-r border-amber-900/30 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-amber-900/30 flex items-center gap-3 shrink-0">
          <Link href="/admin/tag" className="text-amber-600 hover:text-amber-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-semibold text-amber-200">{caseTitle}</h2>
            <p className="text-xs text-amber-600">Drag to tag regions on the PDF</p>
          </div>
        </div>

        <TaggingCanvas
          pdfUrl={pdfUrl}
          existingLinks={links}
          onRegionSelected={setSelectedRegion}
          highlightedLinkId={highlightedLinkId}
        />
      </div>

      {/* Right: Notes panel (45%) — same styling as student view */}
      <div className="flex-[0_0_45%] min-w-0 flex flex-col overflow-hidden">
        {/* Mini header showing link count */}
        <div className="px-4 py-2 border-b border-amber-900/30 shrink-0 bg-[#0f0e0b] flex items-center justify-between">
          <span className="text-xs text-amber-600">
            {links.length} connection{links.length !== 1 ? 's' : ''} tagged
          </span>
          <span className="text-xs text-amber-800">
            Click a connection span in Preview to highlight PDF region
          </span>
        </div>

        <NotesPanel
          content={noteContent}
          onSave={handleSaveNotes}
          onLinkClick={handleLinkClick}
        />
      </div>

      {/* Tag modal */}
      {selectedRegion && (
        <TagModal
          region={selectedRegion}
          existingLinkIds={links.map((l) => l.link_id)}
          onSave={handleSaveLink}
          onClose={() => setSelectedRegion(null)}
        />
      )}
    </div>
  );
}
