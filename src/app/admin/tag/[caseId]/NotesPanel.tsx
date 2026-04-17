'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { customToHtml } from '@/lib/content-converter';
import { Save, Eye, Pencil } from 'lucide-react';

interface NotesPanelProps {
  content: string;
  onSave: (newContent: string) => Promise<void>;
  onLinkClick: (linkId: string) => void;
}

export function NotesPanel({ content, onSave, onLinkClick }: NotesPanelProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [rawContent, setRawContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const proseDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRawContent(content);
  }, [content]);

  // Wire up .linked-text click handlers in preview mode
  const attachLinkHandlers = useCallback(() => {
    const div = proseDivRef.current;
    if (!div) return () => {};
    const spans = Array.from(div.querySelectorAll('.linked-text'));
    const cleanup: Array<() => void> = [];
    spans.forEach((span) => {
      const linkId = span.getAttribute('data-link-id');
      if (!linkId) return;
      const handler = () => onLinkClick(linkId);
      span.addEventListener('click', handler);
      // Visual cue that it's clickable
      (span as HTMLElement).style.cursor = 'pointer';
      cleanup.push(() => span.removeEventListener('click', handler));
    });
    return () => cleanup.forEach((fn) => fn());
  }, [onLinkClick]);

  useEffect(() => {
    if (mode !== 'preview') return;
    // Re-attach after render (dangerouslySetInnerHTML replaces DOM)
    const t = setTimeout(attachLinkHandlers, 0);
    return () => clearTimeout(t);
  }, [mode, rawContent, attachLinkHandlers]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(rawContent);
    } finally {
      setSaving(false);
    }
  }

  const renderedHtml = customToHtml(rawContent);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-amber-900/30 shrink-0 bg-[#0f0e0b]">
        <button
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-white text-slate-800'
              : 'text-amber-500 hover:text-amber-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'edit'
              ? 'bg-white text-slate-800'
              : 'text-amber-500 hover:text-amber-200'
          }`}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>

        {mode === 'edit' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* Styled prose — identical to student notes view, always visible */}
      <div
        className={`bg-white overflow-y-auto ${mode === 'edit' ? 'flex-[0_0_55%]' : 'flex-1'}`}
      >
        <div
          ref={proseDivRef}
          className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-slate-700 px-8 py-6"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>

      {/* Edit mode: raw textarea below the preview */}
      {mode === 'edit' && (
        <div className="flex-1 flex flex-col border-t border-amber-900/40 min-h-0">
          <div className="px-3 py-1.5 bg-[#1a1710] shrink-0">
            <span className="text-xs text-amber-700">Raw content (custom tag format) — edits update the preview live</span>
          </div>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            className="flex-1 w-full bg-[#0f0e0b] text-amber-100 text-xs font-mono p-3 resize-none outline-none border-0"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
