'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { fetchAllCaseItems } from '@/actions/judgment/links';
import { updateItemPdfUrl } from '@/actions/judgment/links';
import { Tag, FileText, Upload, Check, X } from 'lucide-react';

interface CaseItem {
  id: string;
  title: string;
  pdf_url: string | null;
  linkCount?: number;
}

export default function AdminTagListPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<Record<string, string>>({});

  const linkCounts = useQuery(api.content.getNotePdfLinkCounts, {});

  useEffect(() => {
    fetchAllCaseItems().then((items) => {
      setCases(items.map((i) => ({ ...i, linkCount: 0 })));
      setLoading(false);
    });
  }, []);

  // Merge link counts when reactive query resolves
  useEffect(() => {
    if (!linkCounts) return;
    setCases((prev) =>
      prev.map((c) => ({ ...c, linkCount: linkCounts[c.id] ?? 0 }))
    );
  }, [linkCounts]);

  async function handlePdfUpload(caseId: string, file: File) {
    if (!file) return;
    setUploading(caseId);
    setUploadMsg((prev) => ({ ...prev, [caseId]: 'Uploading...' }));
    try {
      // 1. Get Backblaze B2 upload URL
      const uploadUrlRes = await fetch('/api/storage/b2/upload-url', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/pdf' })
      });
      if (!uploadUrlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await uploadUrlRes.json();

      // 2. Upload file to Backblaze B2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Update item pdf_url in Convex DB with the Backblaze public URL
      const result = await updateItemPdfUrl(caseId, publicUrl);
      if (!result.success) throw new Error(result.error);
      
      const pdfUrl = publicUrl;

      setUploadMsg((prev) => ({ ...prev, [caseId]: '✓ Uploaded' }));
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, pdf_url: pdfUrl } : c))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadMsg((prev) => ({ ...prev, [caseId]: `Error: ${msg}` }));
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-amber-200 mb-1 flex items-center gap-2">
        <Tag className="w-5 h-5" />
        Tag Cases
      </h1>
      <p className="text-sm text-amber-600 mb-6">
        Upload judgment PDFs and create note→PDF coordinate mappings.
      </p>

      <div className="space-y-2">
        {cases.length === 0 && (
          <p className="text-amber-600 text-sm">No cases found.</p>
        )}
        {cases.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-amber-950/20 border border-amber-900/30 rounded-lg px-4 py-3 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-100 truncate">{c.title}</p>
                <p className="text-xs text-amber-600">
                  {c.pdf_url ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <Check className="w-3 h-3" /> PDF uploaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600">
                      <X className="w-3 h-3" /> No PDF
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-xs text-amber-500 shrink-0">
              {c.linkCount} link{c.linkCount !== 1 ? 's' : ''}
            </div>

            <div className="shrink-0">
              <label className="cursor-pointer">
                <span className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-amber-700 text-amber-300 hover:bg-amber-900/30 transition-colors">
                  <Upload className="w-3 h-3" />
                  {uploading === c.id ? 'Uploading...' : 'Upload PDF'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploading === c.id}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePdfUpload(c.id, f);
                    e.target.value = '';
                  }}
                />
              </label>
              {uploadMsg[c.id] && (
                <p className="text-xs mt-1 text-amber-400">{uploadMsg[c.id]}</p>
              )}
            </div>

            <Link
              href={c.pdf_url ? `/admin/tag/${c.id}` : '#'}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                c.pdf_url
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-amber-900/20 text-amber-700 cursor-not-allowed pointer-events-none'
              }`}
            >
              <Tag className="w-3 h-3" />
              Tag
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
