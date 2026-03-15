'use client';

import { useEffect, useState, use } from 'react';
import { TaggingCanvas } from './TaggingCanvas';
import { TagModal } from './TagModal';
import { fetchLinksForItem, insertLink, deleteLink } from '@/actions/judgment/links';
import { supabase } from '@/lib/supabase-client';
import type { NotePdfLink } from '@/types';
import { Trash2, ArrowLeft } from 'lucide-react';
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
  const [links, setLinks] = useState<NotePdfLink[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<TagRegion | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function loadCaseData() {
    setLoading(true);
    const { data } = await supabase
      .from('structure_items')
      .select('title, pdf_url')
      .eq('id', caseId)
      .single();

    if (data) {
      setCaseTitle((data as { title: string; pdf_url: string | null }).title);
      setPdfUrl((data as { title: string; pdf_url: string | null }).pdf_url);
    }

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
    // Refresh links
    const updated = await fetchLinksForItem(caseId);
    setLinks(updated);
  }

  async function handleDeleteLink(id: string) {
    setDeletingId(id);
    await deleteLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
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
        <Link href="/admin/tag" className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-400 mb-4">
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
      {/* Left: PDF tagging canvas (70%) */}
      <div className="flex-1 min-w-0 border-r border-amber-900/30">
        <div className="px-4 py-3 border-b border-amber-900/30 flex items-center gap-3">
          <Link href="/admin/tag" className="text-amber-600 hover:text-amber-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-semibold text-amber-200">{caseTitle}</h2>
            <p className="text-xs text-amber-600">Drag to tag regions</p>
          </div>
        </div>
        <TaggingCanvas
          pdfUrl={pdfUrl}
          existingLinks={links}
          onRegionSelected={setSelectedRegion}
        />
      </div>

      {/* Right: Sidebar (30%) */}
      <div className="w-72 shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-amber-900/30">
          <h3 className="text-sm font-semibold text-amber-200">Mappings</h3>
          <p className="text-xs text-amber-600">{links.length} link{links.length !== 1 ? 's' : ''} tagged</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {links.length === 0 && (
            <p className="text-xs text-amber-700 text-center mt-4">
              No links yet. Drag a region on the PDF.
            </p>
          )}
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-200 truncate">{link.link_id}</p>
                {link.label && (
                  <p className="text-xs text-amber-600 truncate">{link.label}</p>
                )}
                <p className="text-xs text-amber-700">
                  Page {link.pdf_page} · ({Math.round(link.x)}, {Math.round(link.y)}) · {Math.round(link.width)}×{Math.round(link.height)}
                </p>
              </div>
              <button
                onClick={() => handleDeleteLink(link.id)}
                disabled={deletingId === link.id}
                className="shrink-0 text-amber-700 hover:text-red-400 transition-colors disabled:opacity-50 mt-0.5"
                title="Delete mapping"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
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
