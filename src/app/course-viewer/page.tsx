"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { DataLoader } from "@/lib/data-loader";
import { CourseStructureList } from "@/components/course-structure-list";
import { DottedBackground } from "@/components/DottedBackground";
import { AppHeader } from "@/components/app-header";
import { customToHtml } from "@/lib/content-converter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, Download, ChevronDown, ScrollText, FileStack, Trash2, X, BookOpen, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyTimer, FloatingTimer } from "@/components/study-timer";
import { HighlightToolbar } from "@/components/highlight-toolbar";
import { applyHighlightsToHtml, removeHighlight, hideText, getHighlights } from "@/lib/highlight-storage";
import { CourseNotes } from "@/components/course-notes";
import { useAuthStore } from "@/lib/stores/auth";
import { useHighlightHistory, HighlightAction } from "@/hooks/use-highlight-history";
import { processContentForTTS } from "@/lib/tts-processor";
import { useTTS } from "@/hooks/use-tts";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";

export default function GenericCourseViewer() {
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("courseId");
  const itemId = searchParams?.get("itemId");
  const router = useRouter(); 
  
  const [structure, setStructure] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [viewState, setViewState] = useState<"list" | "content">("list");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [highlightVersion, setHighlightVersion] = useState(0);
  const [isReadingMode, setIsReadingMode] = useState(false);

  // History Hook
  const { addToHistory, undo, redo, canUndo, canRedo } = useHighlightHistory(
    courseId, 
    selectedItemId,
    () => setHighlightVersion(v => v + 1)
  );

  // TTS State
  const [processedHtml, setProcessedHtml] = useState<string>("");
  const [sentences, setSentences] = useState<string[]>([]);
  const tts = useTTS(sentences);

  // Scrubber State & Handlers
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const handleScrubStart = (e: React.PointerEvent) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setIsScrubbing(true);
      setScrubValue(percent);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleScrubMove = (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setScrubValue(percent);
  };

  const handleScrubEnd = (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      
      setIsScrubbing(false);
      tts.scrub(percent);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const displayProgress = isScrubbing ? scrubValue : tts.progress;

  // Process content for TTS when it loads or when highlights change
  useEffect(() => {
    if (!content) return;

      // 1. Convert Markdown to HTML
      let html = "";
      try {
        html = customToHtml(content);
        if (html.includes('[p]')) console.warn("Raw tags detected after conversion");
      } catch (e) {
        console.error("HTML Conversion failed:", e);
        return; // Can't proceed
      }

      // 2. Apply highlights locally (Independent Try/Catch)
      try {
        if (courseId && selectedItemId) {
           html = applyHighlightsToHtml(html, courseId, selectedItemId);
        }
      } catch (e) {
        console.error("Highlight application failed:", e);
        // Continue with un-highlighted HTML so TTS still works
      }
      
      // 3. Process for TTS (this wraps text in spans)
      try {
        const result = processContentForTTS(html);
        setProcessedHtml(result.processedHtml);
        setSentences(result.sentences);
      } catch (e) {
        console.error("TTS processing failed:", e);
        // Fallback to basic HTML
        setProcessedHtml(html); 
      }

  }, [content, courseId, selectedItemId, highlightVersion]);

  // Handle sentence clicks for TTS navigation
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (!isReadingMode) return;
    const target = e.target as HTMLElement;
    const sentenceSpan = target.closest('.tts-sentence') as HTMLElement;
    if (sentenceSpan) {
      const index = parseInt(sentenceSpan.dataset.sentenceIndex || '0', 10);
      tts.jumpToSentence(index);
    }
  }, [tts, isReadingMode]);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (tts.isPlaying || tts.isPaused) {
      const activeSpan = document.querySelector(`span[data-sentence-index="${tts.currentSentenceIndex}"]`);
      if (activeSpan) {
        activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add active class manually since we replaced HTML string
        // Add active class manually since we replaced HTML string
        document.querySelectorAll('.tts-sentence').forEach(el => el.classList.remove('active-sentence'));
        activeSpan.classList.add('active-sentence');
      }
    } else {
        // Clear highlights when stopped
        document.querySelectorAll('.tts-sentence').forEach(el => el.classList.remove('active-sentence'));
    }
  }, [tts.currentSentenceIndex, tts.isPlaying, tts.isPaused]);

  // Highlighting interaction state
  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    text: string;
    color?: string;
    rect: DOMRect;
    isAdmin?: boolean;
  } | null>(null);
  
  // F11 Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      // Attempt browser fullscreen (optional enhancement)
      document.documentElement.requestFullscreen().catch((err) => {
         // Ignore errors (e.g. if user gesture is missing or on mobile)
         // We still want the UI to switch to "Fullscreen" mode
      });
    } else {
      setIsFullscreen(false);
      // Exit browser fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFullscreen]);

  // Speed Menu State
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [speedMenuPos, setSpeedMenuPos] = useState({ top: 0, left: 0 });
  
  // Listen for fullscreen change (e.g., user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Ensure auth state is checked/restored on mount
  useEffect(() => {
    // Force a check to ensure header updates
    useAuthStore.getState().checkAuth();

    // Default to Fullscreen (Paper Mode) on Mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
       setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      loadStructure(courseId);
    }
  }, [courseId]);

  // Handle direct navigation to item
  useEffect(() => {
     if (itemId && !selectedItemId) {
        handleFileSelect(itemId, false); 
     }
  }, [itemId]);

  // Handle HOVER on highlights to show actions
  const hasContent = !!content;
  useEffect(() => {
    if (!courseId || !selectedItemId || !hasContent) return;
    
    // We listen on document to handle moving between mark and floating button
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if hovering ANY mark element (user or admin highlight)
      // Use closest() because TTS spans might be inside marks
      const mark = target.closest('mark');
      if (mark) {
        const rect = mark.getBoundingClientRect();
        const isUserHighlight = mark.classList.contains('user-highlight');
        const id = isUserHighlight ? (mark.dataset.highlightId || '') : `admin_${mark.textContent}`;
        const text = mark.textContent || '';
        
        // Only update if changed to avoid jitter
        setActiveHighlight(prev => {
            if (prev?.id === id) return prev;
            return { id, text, rect, isAdmin: !isUserHighlight };
        });
      }
      // Check if hovering the action button (or its container)
      else if (target.closest('[data-highlight-action]')) {
         // Keep active
      }
      // Otherwise hide
      else {
         setActiveHighlight(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [courseId, selectedItemId, hasContent]);

  const handleManualRemove = (id: string, text: string, isAdmin?: boolean) => {
    if (!courseId || !selectedItemId) return;

    if (isAdmin) {
      // Admin highlight: hide it (use trimmed text for consistent matching)
      hideText(courseId, selectedItemId, text.trim());
    } else {
      // User highlight: remove it
      const hl = getHighlights(courseId, selectedItemId).find(h => h.id === id);
      const color = hl?.color || '#fef08a';

      removeHighlight(courseId, selectedItemId, id);

      // Add to history for undo
      addToHistory({
          type: 'REMOVE',
          courseId,
          itemId: selectedItemId,
          data: { id, text, color }
      });
    }

    setHighlightVersion(v => v + 1);
    setActiveHighlight(null);
  };

  // Close download dropdown when clicking outside
  useEffect(() => {
    if (!showDownloadMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is on the dropdown or download button
      if (!target.closest('[data-download-dropdown]') && !target.closest('[data-download-button]')) {
        setShowDownloadMenu(false);
      }
    };

    // Small delay to avoid closing immediately on open
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDownloadMenu]);

  const loadStructure = async (id: string) => {
    setLoading(true);
    const [structData, completedData] = await Promise.all([
       DataLoader.getCourseStructure(id),
       DataLoader.getUserCompletedItems(id)
    ]);
    
    setStructure(structData);
    setCompletedItems(new Set(completedData));
    setLoading(false);
  };

  const flattenFiles = (items: any[]): any[] => {
    let files: any[] = [];
    items.forEach(item => {
      if (item.item_type === 'file') {
        files.push(item);
      } else if (item.children) {
        files = [...files, ...flattenFiles(item.children)];
      }
    });
    return files;
  };

  const handleToggleComplete = async (itemId: string) => {
     const isCompleted = completedItems.has(itemId);
     setCompletedItems(prev => {
        const next = new Set(prev);
        if (isCompleted) next.delete(itemId);
        else next.add(itemId);
        return next;
     });
     await DataLoader.toggleItemCompletion(itemId, isCompleted);
  };

  const handleFileSelect = async (itemId: string, updateUrl = true) => {
    setSelectedItemId(itemId);
    setViewState("content");
    setLoadingContent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (updateUrl && courseId && typeof window !== 'undefined') {
       const params = new URLSearchParams(searchParams?.toString());
       params.set("itemId", itemId);
       router.push(`?${params.toString()}`, { scroll: false });
    }

    const html = await DataLoader.getNoteContent(itemId);
    setContent(html);
    setLoadingContent(false);
  };

  const handleBackToList = () => {
    setViewState("list");
    setContent(null);
    setSelectedItemId(null);
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Clear itemId from URL
    if (courseId && typeof window !== 'undefined') {
        const params = new URLSearchParams(searchParams?.toString());
        params.delete("itemId");
        router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
      const allFiles = flattenFiles(structure);
      const currentIndex = allFiles.findIndex(f => f.id === selectedItemId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < allFiles.length) {
          handleFileSelect(allFiles[newIndex].id);
      }
  };

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;
    const container = document.getElementById('note-content-area');
    if (!container) return;

    // ==================== TUNEABLE PARAMS ====================
    // Adjust these values to fine-tune pagination behavior
    const marginMm = 10;           // Page margins in mm
    const bottomReserveMm = 18;    // Bottom safety buffer to avoid cling-to-bottom (18mm ≈ 68px)
    const minPullUpHeightPx = 64;  // Paragraphs shorter than this can be pulled up with following container

    // Debug mode via data attribute
    const debugMode = container.getAttribute('data-pdf-debug') === '1';
    const log = (...args: unknown[]) => debugMode && console.log('[PDF Debug]', ...args);
    
    log('=== PDF Generation Started ===');
    log('Params:', { marginMm, bottomReserveMm, minPullUpHeightPx });

    /**
     * 1) ROBUST FONT LOADING
     */
    const waitForResources = async () => {
      log('Waiting for resources...');
      
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch (e) {
        console.warn('fonts.ready error', e);
      }

      // Explicitly load critical webfonts
      const criticalFonts = [
        '1em "Newsreader"', '1em "Inter"', '1em "Open Sans"',
        'bold 1em "Newsreader"', 'italic 1em "Newsreader"'
      ];
      
      await Promise.all(
        criticalFonts.map(f => document.fonts.load(f).catch(() => {}))
      );

      // Wait for images
      const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(img => 
        img.complete ? Promise.resolve() : new Promise<void>(r => {
          img.onload = img.onerror = () => r();
        })
      ));

      // Stabilization delay
      await new Promise(r => setTimeout(r, 100));
      log('Resources loaded');
    };

    /**
     * 2) LAYOUT FREEZE
     */
    const freezeLayout = () => container.classList.add('render-snapshot');
    const unfreezeLayout = () => container.classList.remove('render-snapshot');

    /**
     * 3) UTILITIES
     * CRITICAL: getBoundingClientRect() returns CSS pixels, NOT device pixels.
     * So we convert mm to CSS pixels (96 DPI standard), without DPR multiplication.
     */
    const mmToPx = (mm: number) => mm * (96 / 25.4); // CSS pixels only, no DPR!
    
    const getEffectiveHeight = (el: HTMLElement): number => {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const marginTop = parseFloat(cs.marginTop || '0');
      const marginBottom = parseFloat(cs.marginBottom || '0');
      return rect.height + marginTop + marginBottom;
    };

    /**
     * 4) BUILD CANDIDATE BLOCKS (document order, deduplicated)
     */
    const getCandidateBlocks = (root: HTMLElement): HTMLElement[] => {
      const seen = new Set<HTMLElement>();
      const result: HTMLElement[] = [];
      
      // Get all potential candidates
      const selectors = '.note-box, .card, .highlight-card, .prose-section, .prose, :scope > *';
      const nodes = Array.from(root.querySelectorAll(selectors)) as HTMLElement[];
      
      // Also include direct children
      Array.from(root.children).forEach(child => {
        if (child instanceof HTMLElement) nodes.push(child);
      });
      
      // Sort by document position, dedupe
      nodes.sort((a, b) => {
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });
      
      nodes.forEach(n => {
        if (!seen.has(n) && root.contains(n) && getComputedStyle(n).display !== 'none') {
          seen.add(n);
          result.push(n);
        }
      });
      
      return result;
    };

    /**
     * 5) SMART PAGINATION ALGORITHM
     * 
     * RULE 1: Never split a container across pages
     * RULE 2: If container fits on current page (with bottom buffer), PLACE IT THERE
     * RULE 3: Small preceding paragraphs merge with containers
     * RULE 4: Large containers start on new page
     */
    const computePageBreaks = (root: HTMLElement): Set<HTMLElement> => {
      // All measurements in CSS pixels (no DPR)
      const pageHeightPx = mmToPx(297 - marginMm * 2); // A4 minus margins
      const bottomReservePx = mmToPx(bottomReserveMm);  // Safety buffer
      const usableHeight = pageHeightPx - bottomReservePx;
      
      log('=== PAGE METRICS (CSS pixels) ===');
      log(`  A4 page height: ${mmToPx(297).toFixed(0)}px`);
      log(`  Margins: ${mmToPx(marginMm).toFixed(0)}px each`);
      log(`  Page height after margins: ${pageHeightPx.toFixed(0)}px`);
      log(`  Bottom reserve: ${bottomReservePx.toFixed(0)}px`);
      log(`  USABLE HEIGHT: ${usableHeight.toFixed(0)}px`);

      const blocks = getCandidateBlocks(root);
      log('Candidate blocks:', blocks.length);

      // Measure all blocks (read-only pass)
      const infos = blocks.map((el, idx) => ({
        el,
        idx,
        height: getEffectiveHeight(el),
        isNoteBox: el.classList.contains('note-box') || el.classList.contains('card'),
        isHeading: /^H[1-6]$/.test(el.tagName),
        tag: el.tagName,
        text: el.textContent?.slice(0, 40)?.trim() || ''
      }));

      /**
       * PAGINATION LOOP - EVALUATE EACH BLOCK INDEPENDENTLY
       * 
       * RULE A: Paragraphs are placed based ONLY on their own height
       * RULE B: Containers don't evict previous content
       * RULE C: Orphan protection only after container must move
       */
      const breakElements = new Set<HTMLElement>();
      let cursor = 0;
      let currentPage = 1;

      for (let i = 0; i < infos.length; i++) {
        const info = infos[i];
        const remainingSpace = usableHeight - cursor;
        const fitsOnCurrentPage = info.height <= remainingSpace;
        
        log(`\n[Block ${i}] ${info.tag} ${info.isNoteBox ? '🟢 CONTAINER' : ''} ${info.isHeading ? '📌 HEADING' : ''}`);
        log(`  Height: ${info.height.toFixed(0)}px`);
        log(`  Cursor: ${cursor.toFixed(0)}px / ${usableHeight.toFixed(0)}px`);
        log(`  Remaining: ${remainingSpace.toFixed(0)}px`);
        log(`  CHECK: ${info.height.toFixed(0)} <= ${remainingSpace.toFixed(0)} ? ${fitsOnCurrentPage}`);
        
        // RULE A: Evaluate THIS block independently
        if (info.height > pageHeightPx) {
          // Oversized block: force to new page, allow overflow
          if (cursor > 0) {
            breakElements.add(info.el);
            currentPage++;
          }
          cursor = info.height % usableHeight;
          log(`  ⚠️ DECISION: OVERFLOW → page ${currentPage}`);
          
        } else if (!fitsOnCurrentPage) {
          // Block doesn't fit: move to next page
          
          // RULE C: Check if previous block was a tiny orphan that should come along
          if (i > 0) {
            const prev = infos[i - 1];
            const prevWasPlacedThisPage = !breakElements.has(prev.el);
            const prevIsTiny = prev.height < minPullUpHeightPx;
            const prevIsHeading = prev.isHeading;
            const combinedFitsOnNewPage = (prev.height + info.height) <= usableHeight;
            
            if (prevWasPlacedThisPage && (prevIsTiny || prevIsHeading) && combinedFitsOnNewPage && info.isNoteBox) {
              // Pull up the tiny orphan with this container
              breakElements.add(prev.el);
              log(`  ↩️ ORPHAN PROTECTION: Pulling block ${i-1} (${prev.tag}) to next page with container`);
            }
          }
          
          breakElements.add(info.el);
          currentPage++;
          cursor = info.height;
          log(`  🔴 DECISION: MOVE → page ${currentPage}`);
          
        } else {
          // RULE A: Block fits → PLACE IT HERE (regardless of what comes next)
          cursor += info.height;
          log(`  ✅ DECISION: PLACE → page ${currentPage}`);
        }
      }

      log('\n=== SUMMARY ===');
      log(`Total pages: ${currentPage}`);
      log(`Page breaks applied to: ${breakElements.size} elements`);
      
      // Debug summary table
      if (debugMode) {
        console.table(infos.map((info, i) => ({
          idx: i,
          tag: info.tag,
          height: Math.round(info.height),
          type: info.isNoteBox ? 'CONTAINER' : info.isHeading ? 'HEADING' : 'CONTENT',
          pageBreak: breakElements.has(info.el) ? '🔴 MOVE' : '✅ PLACE',
          text: info.text.slice(0, 25)
        })));
      }

      return breakElements;
    };

    // Helper to inject temporary print styles
    const injectPrintStyles = (targetContainer: HTMLElement) => {
      const style = document.createElement('style');
      style.id = 'print-overrides';
      style.innerHTML = `
        mark, .user-highlight, [data-highlight-id] {
          background-color: transparent !important;
          color: inherit !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `;
      targetContainer.appendChild(style);
      return style;
    };

    // ==================== MAIN EXECUTION ====================
    let printStyle: HTMLStyleElement | null = null;

    try {
      await waitForResources();
      freezeLayout();

      // Inject styles to hide highlights
      printStyle = injectPrintStyles(container);

      // No page breaks needed for continuous PDF
      container.querySelectorAll('.page-break-before').forEach(el => {
        el.classList.remove('page-break-before');
      });

      // Wait for layout stabilization
      await new Promise(requestAnimationFrame);
      await new Promise(r => setTimeout(r, 80));

      // Measure content dimensions
      const contentWidth = container.scrollWidth;
      const contentHeight = container.scrollHeight;
      
      // Convert px to mm (96 DPI standard) with extra padding to prevent overflow
      const pxToMm = (px: number) => px * 25.4 / 96;
      const widthMm = pxToMm(contentWidth) + marginMm * 2;
      const heightMm = pxToMm(contentHeight) + marginMm * 2 + 50; // Extra 50mm buffer
      
      log('Content dimensions:', { contentWidth, contentHeight });
      log('PDF dimensions (mm):', { widthMm: widthMm.toFixed(0), heightMm: heightMm.toFixed(0) });

      // Generate single continuous PDF (no page breaks)
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: marginMm,
        filename: 'course-note.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: Math.max(1.5, window.devicePixelRatio || 2),
          useCORS: true,
          allowTaint: false,
          logging: false,
          scrollY: 0,
          windowHeight: contentHeight,
        },
        pagebreak: { mode: [] as string[] }, // Disable page breaks
        jsPDF: { 
          unit: 'mm', 
          format: [widthMm, heightMm] as [number, number], // Custom page size to fit content
          orientation: 'portrait' as const 
        }
      };

      log('Generating continuous PDF...');
      await html2pdf().set(opt).from(container).save();
      log('=== PDF Generation Complete ===');

    } finally {
      if (printStyle) {
        (printStyle as HTMLStyleElement).remove();
      }
      container.querySelectorAll('.page-break-before').forEach(el => {
        el.classList.remove('page-break-before');
      });
      unfreezeLayout();
    }
  };

  /**
   * PAGE-BY-PAGE DOWNLOAD (A4 sheets)
   * - No colored containers, just clean text
   * - Prevents sentences from splitting across pages
   */
  const handlePageByPageDownload = async () => {
    if (typeof window === 'undefined') return;
    const container = document.getElementById('note-content-area');
    if (!container) return;

    setShowDownloadMenu(false);

    // Add special class for page-by-page mode (strips container styling)
    container.classList.add('render-snapshot', 'pdf-page-mode');

    // Inject styles to hide highlights
    const style = document.createElement('style');
    style.id = 'print-overrides-pbp';
    style.innerHTML = `
      mark, .user-highlight, [data-highlight-id] {
        background-color: transparent !important;
        color: inherit !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    `;
    container.appendChild(style);

    // Wait for resources
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {}
    await new Promise(r => setTimeout(r, 100));

    // Wait for layout
    await new Promise(requestAnimationFrame);
    await new Promise(r => setTimeout(r, 80));

    // Generate A4 PDF with clean styling
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 15, // Slightly larger margins for readability
      filename: 'course-note-pages.pdf',
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      },
      pagebreak: { mode: ['avoid-all'] }, // Avoid breaking inside elements
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(container).save();
    } finally {
      style.remove();
      container.classList.remove('render-snapshot', 'pdf-page-mode');
    }
  };

  const allFiles = flattenFiles(structure);
  const currentIndex = allFiles.findIndex(f => f.id === selectedItemId);
  const hasNext = currentIndex < allFiles.length - 1;
  const hasPrev = currentIndex > 0;

  if (loading) {
    return (
       <div className="min-h-screen">
        <DottedBackground />
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">Loading course content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-0 overflow-x-hidden">
      {/* Background always rendered (z-index handles visibility) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <DottedBackground />
      </div>

      {/* Header: Visible in Normal Mode OR Mobile Fullscreen Mode */}
      <div className={cn("relative z-20", isFullscreen ? "hidden md:hidden max-md:block" : "block")}>
         <AppHeader />
      </div>
      
      <div className={cn(
          "flex-1 container mx-auto transition-all duration-300",
          // Base styles
          "flex flex-col",
          
          isFullscreen 
            ? [
                // DESKTOP: Immersive Fullscreen (Fixed, White, Edge-to-Edge)
                "md:fixed md:inset-0 md:z-50 md:bg-white md:h-screen md:w-screen md:max-w-none md:m-0 md:p-0 md:overflow-auto",
              ]
            : [
                // DESKTOP: Normal Mode (Paper-like, Transparent BG)
                "md:max-w-5xl md:py-8 md:bg-transparent md:px-4",
            ],
           // MOBILE: Universal Card Look (Independent of isFullscreen)
           "max-md:relative max-md:z-10 max-md:max-w-[95%] max-md:mx-auto max-md:bg-white max-md:py-4 max-md:shadow-md max-md:rounded-xl md:flex md:flex-col"
      )}>
         {viewState === "list" ? (
            <div className="animate-fadeIn">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">Course Content</h1>
                  <p className="text-gray-500">Pick a topic to start learning</p>
               </div>
               
               <CourseStructureList 
                  items={structure} 
                  onFileSelect={handleFileSelect} 
                  completedItems={completedItems}
                  onToggleComplete={handleToggleComplete}
               />
               
               {structure.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                     <p>No content available for this course yet.</p>
                  </div>
               )}
            </div>
         ) : (
            <div className={cn(isFullscreen ? "max-w-7xl mx-auto w-full" : "py-8")}>
               {/* Navigation Bar */}
               <div className={cn("sticky z-50 transition-all duration-300", isFullscreen ? "top-[63px] md:top-0" : "top-[63px]")}>
                  <div className={cn(
                     "flex items-center justify-between mb-6 shrink-0 bg-white/80 backdrop-blur-md p-2 border-b border-gray-100 shadow-sm overflow-x-auto gap-2 no-scrollbar",
                     isFullscreen ? "rounded-b-2xl px-4 mx-4 shadow-md bg-white/95" : "px-4 rounded-none md:rounded-xl md:mx-0"
                  )}>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleBackToList}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3"
                    >
                        <ArrowLeft className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                     {/* Download Dropdown (Moved to Left) */}
                     <div className="relative">
                        <Button 
                           data-download-button
                           variant="ghost" 
                           size="sm"
                           onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                           disabled={!content}
                           className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 flex items-center gap-1"
                        >
                           <Download className="w-4 h-4" />
                           <ChevronDown className="w-3 h-3" />
                        </Button>
                        
                        {showDownloadMenu && typeof document !== 'undefined' && createPortal(
                           <div 
                              data-download-dropdown
                              className="fixed bg-white! rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
                              style={{ 
                                top: '80px', 
                                left: '20px',
                                zIndex: 9999 
                              }}
                           >
                              <button
                                 onClick={() => { setShowDownloadMenu(false); handleDownload(); }}
                                 className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                 <ScrollText className="w-4 h-4 text-blue-600" />
                                 <div>
                                    <div className="font-medium">Continuous Flow</div>
                                    <div className="text-xs text-gray-500">Single long page</div>
                                 </div>
                              </button>
                              <button
                                 onClick={handlePageByPageDownload}
                                 className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                 <FileStack className="w-4 h-4 text-green-600" />
                                 <div>
                                    <div className="font-medium">Page by Page</div>
                                    <div className="text-xs text-gray-500">A4 sheets, clean text</div>
                                 </div>
                              </button>
                           </div>,
                           document.body
                        )}
                     </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-4 w-px bg-gray-200 mx-2" />

                  {/* TTS Controls (Inline) */}
                  <div className="flex items-center gap-2 animate-fadeIn">
                     {/* Play Button */}
                     <button 
                        onClick={() => {
                           if (tts.isPlaying) {
                              tts.pause();
                              setIsReadingMode(false);
                           } else {
                              setIsReadingMode(true);
                              tts.play();
                           }
                        }}
                        className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none p-1 rounded-full hover:bg-gray-100"
                        title={tts.isPlaying ? "Pause Reading" : "Read Aloud"}
                     >
                        {tts.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                     </button>
                     
                     {/* Scrubber (Visible if sentences exist) */}
                     {sentences.length > 0 && (
                        <>
                           <div className="w-24 md:w-48 flex items-center gap-2">  
                              <div 
                                 className="relative flex-1 h-3 flex items-center cursor-pointer group select-none touch-none"
                                 onPointerDown={handleScrubStart}
                                 onPointerMove={handleScrubMove}
                                 onPointerUp={handleScrubEnd}
                                 onPointerCancel={handleScrubEnd}
                              >
                                 {/* Track Background */}
                                 <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
                                 
                                 {/* Active Progress Line */}
                                 <div 
                                    className={cn(
                                       "absolute left-0 h-1 bg-blue-500 rounded-full",
                                       !isScrubbing && "transition-all duration-300 ease-out"
                                    )}
                                    style={{ width: `${displayProgress}%` }}
                                 />
                                 
                                 {/* Thumb */}
                                 <div 
                                    className={cn(
                                       "absolute h-3 w-3 bg-blue-600 rounded-full shadow-md z-10",
                                       !isScrubbing && "transition-all duration-300 ease-out",
                                       isScrubbing ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100 scale-100"
                                    )}
                                    style={{ 
                                        left: `${displayProgress}%`, 
                                        transform: 'translateX(-50%)' 
                                    }}
                                 />
                              </div>
                           </div>
                           
                           {/* Speed Control Button */}
                           <div className="relative">
                               <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setSpeedMenuPos({ top: rect.bottom + 8, left: rect.left });
                                      setShowSpeedMenu(!showSpeedMenu);
                                  }}
                                  className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none p-1 rounded-full hover:bg-gray-100"
                                  title="Playback Speed"
                               >
                                  <MoreVertical className="w-4 h-4" />
                               </button>

                               {/* Speed Menu Portal */}
                               {showSpeedMenu && typeof document !== 'undefined' && createPortal(
                                  <>
                                      <div 
                                          className="fixed inset-0 z-9999" 
                                          onClick={() => setShowSpeedMenu(false)}
                                      />
                                      <div 
                                          className="fixed z-10000 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
                                          style={{ 
                                              top: speedMenuPos.top, 
                                              left: speedMenuPos.left,
                                              transform: 'translateX(-50%)' 
                                          }}
                                      >
                                          <div className="px-3 py-2 border-b border-gray-50 text-xs font-medium text-gray-500 mb-1">
                                              Playback Speed
                                          </div>
                                          {[0.75, 1, 1.05, 1.15, 1.25].map((speed) => (
                                              <button
                                                  key={speed}
                                                  onClick={() => {
                                                      tts.setRate(speed);
                                                      setShowSpeedMenu(false);
                                                  }}
                                                  className={cn(
                                                      "w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between",
                                                      (tts.rate || 1) === speed ? "text-blue-600 font-medium" : "text-gray-700"
                                                  )}
                                              >
                                                  <span>{speed}x</span>
                                                  {(tts.rate || 1) === speed && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                              </button>
                                          ))}
                                      </div>
                                  </>,
                                  document.body
                               )}
                           </div>
                           
                           {/* Undo / Redo Controls */}
                           <div className="flex items-center gap-1 border-l border-gray-200 pl-1 ml-1">
                              <button
                                onClick={undo}
                                disabled={!canUndo}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors p-1 rounded-full hover:bg-gray-100"
                                title="Undo Highlight"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={redo}
                                disabled={!canRedo}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors p-1 rounded-full hover:bg-gray-100"
                                title="Redo Highlight"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                           </div>
                        </>
                     )}
                  </div>
                  
                  {/* Spacer to push Right Section to end */}
                  <div className="flex-1" />





                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                     {/* Top Next/Prev - Hidden on mobile, visible on desktop */}
                     <div className="hidden md:flex items-center gap-1 sm:gap-2">
                         {/* Timer moved here */}
                         <div id="study-timer-container">
                            <StudyTimer />
                         </div>
                         <div className="h-4 w-px bg-gray-300 mx-1" />
                         
                         <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigate('prev')}
                            disabled={!hasPrev}
                            className="text-gray-600 px-2 sm:px-3"
                         >
                            <ChevronLeft className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Previous</span>
                         </Button>
                         <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigate('next')}
                            disabled={!hasNext}
                            className="text-gray-600 px-2 sm:px-3"
                         >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4 sm:ml-1" />
                         </Button>










                         <div className="h-4 w-px bg-gray-300 mx-1" />
                     </div>
                     
                     {/* Reading Mode Button (Desktop Only) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsReadingMode(!isReadingMode)}
                        className={cn(
                          "hidden md:flex items-center gap-1.5 px-3 transition-all",
                          isReadingMode 
                            ? "text-amber-600 bg-amber-50 hover:bg-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
                            : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        )}
                        title={isReadingMode ? "Exit Reading Mode" : "Focus Mode"}
                      >
                        <BookOpen className={cn("w-4 h-4 transition-all", isReadingMode && "text-amber-500")} />
                        <span className="text-xs font-medium">{isReadingMode ? "Read" : "Edit"}</span>
                      </Button>
                      
                      {/* Fullscreen Button (Moved to Right) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-gray-500 hover:text-gray-900 w-8 h-8 sm:w-10 sm:h-10"
                        title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                  </div>
               </div>
               
               {/* Content Area - Clean Layout without Container Box */}
                <div className={cn(
                  "animate-slideIn w-full max-w-5xl mx-auto pb-20 bg-white! relative z-30 rounded-2xl shadow-xl border border-gray-100 p-4 md:p-12",
                  isReadingMode ? "reading-mode" : ""
               )}>
                  {loadingContent ? (
                      <div className="flex flex-col items-center justify-center py-20">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-500 font-medium">Loading content...</p>
                      </div>
                  ) : content ? (
                     <div 
                        className="max-w-4xl mx-auto px-2 md:px-6" 
                        style={{
                           '--tw-prose-body': '#334155',
                           '--tw-prose-headings': '#0f172a',
                           '--tw-prose-lead': '#475569',
                           '--tw-prose-links': '#2563eb',
                           '--tw-prose-bold': '#0f172a',
                           '--tw-prose-counters': '#64748b',
                           '--tw-prose-bullets': '#000000',
                           '--tw-prose-hr': '#e2e8f0',
                           '--tw-prose-quotes': '#0f172a',
                           '--tw-prose-quote-borders': '#e2e8f0',
                           '--tw-prose-captions': '#64748b',
                           '--tw-prose-code': '#0f172a',
                           '--tw-prose-pre-code': '#e2e8f0',
                           '--tw-prose-pre-bg': '#1e293b',
                           '--tw-prose-th-borders': '#d1d5db',
                           '--tw-prose-td-borders': '#e2e8f0',
                        } as React.CSSProperties}
                     >

                        <div 
                           id="note-content-area"
                           key={`content-${highlightVersion}`}
                           onClick={handleContentClick}
                           className="prose prose-base md:prose-lg max-w-none font-sans prose-headings:font-bold prose-p:text-[#334155] prose-headings:text-[#0f172a] dark:prose-invert prose-li:text-black prose-li:marker:text-black text-left md:text-justify"
                           dangerouslySetInnerHTML={{ 
                             __html: processedHtml || customToHtml(content)
                           }} 
                        />
                        
                        {/* Personal Notes Section */}
                        {courseId && selectedItemId && (
                           <>
                              <CourseNotes courseId={courseId} itemId={selectedItemId} />
                              
                              {/* Bottom Navigation Bar */}
                              <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-100">
                                 {/* Left: Previous */}
                                 <Button 
                                    variant="ghost" 
                                    onClick={() => handleNavigate('prev')}
                                    disabled={!hasPrev}
                                    className="text-gray-600 hover:text-gray-900 group"
                                 >
                                    <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                                    <div className="text-left">
                                       <span className="text-xs text-gray-400 block">Previous</span>
                                       <span className="font-medium">Lesson</span>
                                    </div>
                                 </Button>

                                 {/* Center: Take Quiz (Hidden on mobile) */}
                                 <Button
                                    size="lg"
                                    className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground px-12 min-w-[200px] rounded-full shadow-lg hover:shadow-xl transition-all font-semibold"
                                 >
                                    Take Quiz
                                 </Button>

                                 {/* Right: Next */}
                                 <Button 
                                    variant="ghost" 
                                    onClick={() => handleNavigate('next')}
                                    disabled={!hasNext}
                                    className="text-gray-600 hover:text-gray-900 group"
                                 >
                                    <div className="text-right">
                                       <span className="text-xs text-gray-400 block">Next</span>
                                       <span className="font-medium">Lesson</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                 </Button>
                              </div>
                           </>
                        )}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center text-slate-400 py-20">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Content not available</p>
                     </div>
                  )}
                  
                  {/* Highlight Toolbar - appears on text selection */}
                  {courseId && selectedItemId && content && !isReadingMode && (
                     <HighlightToolbar
                        courseId={courseId}
                        itemId={selectedItemId}
                        contentContainerId="note-content-area"
                        onHighlightApplied={() => setHighlightVersion(v => v + 1)}
                        onHighlightAdd={(hl) => {
                            addToHistory({
                                type: 'ADD',
                                courseId,
                                itemId: selectedItemId,
                                data: { ...hl }
                            });
                        }}
                     />
                  )}

                  {/* Hover Delete Button */}
                  {activeHighlight && !isReadingMode && typeof document !== 'undefined' && createPortal(
                    <div 
                        data-highlight-action
                        className="fixed z-9999"
                        style={{ 
                          top: `${activeHighlight.rect.top - 12}px`, 
                          left: `${activeHighlight.rect.right - 12}px`,
                        }}
                    >
                        <button
                          className="bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors w-5 h-5 flex items-center justify-center transform hover:scale-110"
                          onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleManualRemove(activeHighlight.id, activeHighlight.text, activeHighlight.isAdmin);
                          }}
                        >
                          <X className="w-3 h-3 stroke-[3px]" />
                        </button>
                    </div>,
                    document.body
                  )}
               </div>
            </div>
         )}
         
         {/* Floating Timer - appears when scrolled past main timer (desktop only) */}
         {viewState === "content" && <FloatingTimer timerContainerId="study-timer-container" />}
      </div>
    </div>
  );
}
