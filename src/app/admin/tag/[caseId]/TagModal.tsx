'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface TagRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TagModalProps {
  region: TagRegion;
  existingLinkIds: string[];
  onSave: (linkId: string, label: string) => Promise<void>;
  onClose: () => void;
}

export function TagModal({ region, existingLinkIds, onSave, onClose }: TagModalProps) {
  const [linkId, setLinkId] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmed = linkId.trim();
    if (!trimmed) {
      setError('link_id is required');
      return;
    }
    if (existingLinkIds.includes(trimmed)) {
      setError(`link_id "${trimmed}" already mapped for this case`);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed, label.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1a1710] border border-amber-800/50 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-amber-200">Tag Region</h3>
          <button onClick={onClose} className="text-amber-600 hover:text-amber-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-amber-600 mb-4">
          Page {region.page} · ({Math.round(region.x)}, {Math.round(region.y)}) · {Math.round(region.width)}×{Math.round(region.height)} PDF units
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-amber-400 mb-1">
              link_id <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={linkId}
              onChange={(e) => { setLinkId(e.target.value); setError(''); }}
              placeholder="e.g. link-ratio, link-basic-structure"
              className="w-full px-3 py-2 bg-amber-950/30 border border-amber-800/40 rounded text-sm text-amber-100 placeholder-amber-700 focus:outline-none focus:border-amber-500"
            />
            <p className="text-xs text-amber-700 mt-1">
              Must match the data-link-id in the notes content
            </p>
          </div>

          <div>
            <label className="block text-xs text-amber-400 mb-1">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ¶58 — Core Ratio"
              className="w-full px-3 py-2 bg-amber-950/30 border border-amber-800/40 rounded text-sm text-amber-100 placeholder-amber-700 focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {existingLinkIds.length > 0 && (
            <div>
              <p className="text-xs text-amber-600 mb-1">Existing link IDs for this case:</p>
              <div className="flex flex-wrap gap-1">
                {existingLinkIds.map((id) => (
                  <span
                    key={id}
                    onClick={() => setLinkId(id)}
                    className="px-2 py-0.5 bg-amber-900/30 border border-amber-800/30 rounded text-xs text-amber-400 cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-amber-500 hover:text-amber-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
