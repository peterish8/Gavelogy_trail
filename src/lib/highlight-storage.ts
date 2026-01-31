'use client';

/**
 * SIMPLE LOCAL HIGHLIGHT STORAGE
 * Stores highlighted text keywords in localStorage
 * Key format: highlights_${courseId}_${itemId}
 */

export interface TextHighlight {
  id: string;
  text: string;      // The exact text that was highlighted
  color: string;     // Background color (hex)
  createdAt: number;
}

const STORAGE_PREFIX = 'highlights_';

function getStorageKey(courseId: string, itemId: string): string {
  return `${STORAGE_PREFIX}${courseId}_${itemId}`;
}

/**
 * Get all highlights for a note
 */
export function getHighlights(courseId: string, itemId: string): TextHighlight[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(getStorageKey(courseId, itemId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new highlight OR remove if already exists (toggle behavior)
 * Returns the highlight if added, null if removed
 * 
 * @param forceId - Optional ID to force (for Undo/Redo)
 * @param forceCreatedAt - Optional timestamp to force (for Undo/Redo)
 */
export function saveHighlight(courseId: string, itemId: string, text: string, color: string, forceId?: string, forceCreatedAt?: number): TextHighlight | null {
  const highlights = getHighlights(courseId, itemId);
  
  // Check if this text is already highlighted - TOGGLE: remove it
  // But ONLY if we are not forcing an ID (forcing ID implies we want to restore specifically)
  if (!forceId) {
    const existingIndex = highlights.findIndex(h => h.text === text);
    if (existingIndex !== -1) {
      highlights.splice(existingIndex, 1);
      localStorage.setItem(getStorageKey(courseId, itemId), JSON.stringify(highlights));
      return null; // Indicates removal
    }
  }
  
  const newHighlight: TextHighlight = {
    id: forceId || `hl_${Date.now()}`,
    text,
    color,
    createdAt: forceCreatedAt || Date.now(),
  };
  
  highlights.push(newHighlight);
  localStorage.setItem(getStorageKey(courseId, itemId), JSON.stringify(highlights));
  
  return newHighlight;
}

/**
 * Add text to "hidden" list (for hiding admin highlights locally)
 */
export function hideText(courseId: string, itemId: string, text: string): void {
  const key = `hidden_${courseId}_${itemId}`;
  const hidden = getHiddenTexts(courseId, itemId);
  
  if (!hidden.includes(text)) {
    hidden.push(text);
    localStorage.setItem(key, JSON.stringify(hidden));
  }
}

/**
 * Get list of hidden texts (admin highlights user wants to hide)
 */
export function getHiddenTexts(courseId: string, itemId: string): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(`hidden_${courseId}_${itemId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Unhide text
 */
export function unhideText(courseId: string, itemId: string, text: string): void {
  const key = `hidden_${courseId}_${itemId}`;
  const hidden = getHiddenTexts(courseId, itemId);
  const filtered = hidden.filter(t => t !== text);
  localStorage.setItem(key, JSON.stringify(filtered));
}

/**
 * Remove a highlight by ID
 */
export function removeHighlight(courseId: string, itemId: string, highlightId: string): void {
  const highlights = getHighlights(courseId, itemId);
  const filtered = highlights.filter(h => String(h.id) !== String(highlightId));
  localStorage.setItem(getStorageKey(courseId, itemId), JSON.stringify(filtered));
}

/**
 * Apply highlights to HTML content:
 * 1. Remove admin highlights that user has hidden locally
 * 2. Add user's own highlights
 */
export function applyHighlightsToHtml(html: string, courseId: string, itemId: string): string {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Step 1: Remove hidden admin highlights
  const hiddenTexts = getHiddenTexts(courseId, itemId);
  if (hiddenTexts.length > 0) {
    const marks = Array.from(body.querySelectorAll('mark'));
    for (const mark of marks) {
       // Check if this mark (or specific user/admin mark) should be hidden
       // For admin marks (no data-highlight-id), we match by text content
       if (!mark.hasAttribute('data-highlight-id')) {
          const text = (mark.textContent || '').trim();
          if (hiddenTexts.includes(text)) {
             // Unwrap the mark: replace mark with its children
             const parent = mark.parentNode;
             if (parent) {
                while (mark.firstChild) {
                   parent.insertBefore(mark.firstChild, mark);
                }
                parent.removeChild(mark);
             }
          }
       }
    }
  }

  // Step 2: Apply user's own highlights
  // Logic: Concatenate all text to find matches, then map back to nodes to wrap
  const highlights = getHighlights(courseId, itemId);
  // Sort by text length (longest first)
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);

  // We process highlights one by one.
  for (const h of sorted) {
      if (!h.text || !h.text.trim()) continue;

      // Normalize query: remove whitespace and convert to lowercase for matching
      const query = h.text.replace(/\s+/g, '').toLowerCase();
      if (!query) continue;

      // Keep looking for this highlight until no more matches are found in the *unhighlighted* text
      while (true) {
          // 1. Build virtual string from current DOM state
          // We must rebuild this every time because wrapping modifies the DOM
          const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
          const nodes: { node: Text, start: number, end: number }[] = [];
          let totalText = "";
          
          while(walker.nextNode()) {
              const node = walker.currentNode as Text;
              // Skip text inside existing user highlights
              if (node.parentElement && node.parentElement.tagName === 'MARK' && node.parentElement.classList.contains('user-highlight')) {
                 continue;
              }
              const val = node.nodeValue || "";
              nodes.push({
                  node,
                  start: totalText.length,
                  end: totalText.length + val.length
              });
              totalText += val;
          }
          
          // Build stripped text map (lowercase for matching)
          let strippedText = "";
          const mapping: number[] = [];
          for (let i = 0; i < totalText.length; i++) {
              if (!/\s/.test(totalText[i])) {
                  mapping.push(i);
                  strippedText += totalText[i].toLowerCase();
              }
          }
          
          // 2. Find FIRST match (case-insensitive)
          // Since we rebuild the walker and ignore existing marks, the first match found is always new.
          const matchIndex = strippedText.indexOf(query);
          
          if (matchIndex === -1) {
              // No more matches for this text
              break;
          }
          
          const matchEnd = matchIndex + query.length;

          const originalStart = mapping[matchIndex];
          const originalEndCursor = mapping[matchEnd - 1]; 
          const originalEnd = originalEndCursor + 1;

          // 3. Identify nodes to wrap
          const nodesToWrap: { node: Text, from: number, to: number }[] = [];
          
          for (const item of nodes) {
              const overlapStart = Math.max(item.start, originalStart);
              const overlapEnd = Math.min(item.end, originalEnd);
              
              if (overlapStart < overlapEnd) {
                  nodesToWrap.push({
                      node: item.node,
                      from: overlapStart - item.start,
                      to: overlapEnd - item.start
                  });
              }
          }
          
          // 4. Wrap them
           for (let i = nodesToWrap.length - 1; i >= 0; i--) {
              const { node, from, to } = nodesToWrap[i];
              const nodeText = node.nodeValue || "";
              let targetNode = node;
              
              if (to < nodeText.length) targetNode.splitText(to);
              if (from > 0) targetNode = targetNode.splitText(from);
              
              const mark = document.createElement('mark');
              mark.className = 'user-highlight';
              mark.setAttribute('data-highlight-id', h.id);
              mark.style.backgroundColor = h.color;
              mark.textContent = targetNode.textContent;
              
              node.parentNode?.replaceChild(mark, targetNode);
           }
           
           // Loop continues to find next occurrence...
      }
  }

  return body.innerHTML;
}

/**
 * Default highlight colors
 */
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
];
