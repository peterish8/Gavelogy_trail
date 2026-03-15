"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { DataLoader } from "@/lib/data-loader";
import { usePaymentStore } from "@/lib/payment";
import { CourseStructureList } from "@/components/course-structure-list";
import { DottedBackground } from "@/components/DottedBackground";
import { customToHtml } from "@/lib/content-converter";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, Download, ChevronDown, ScrollText, FileStack, X, BookOpen, MoreVertical, Moon, Sun, Menu, ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyTimer } from "@/components/study-timer";
import { HighlightToolbar } from "@/components/highlight-toolbar";
import { applyHighlightsToHtml, removeHighlight, hideText, getHighlights } from "@/lib/highlight-storage";
import { CourseNotes } from "@/components/course-notes";
import { useAuthStore } from "@/lib/stores/auth";
import { useHighlightHistory } from "@/hooks/use-highlight-history";
import { processContentForTTS } from "@/lib/tts-processor";
import { useTTS } from "@/hooks/use-tts";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { TranslateWidget } from "@/components/translate-widget";
import { useThemeStore } from "@/lib/stores/theme";
import { SidebarNav } from "@/components/navigation/sidebar-nav";

import { Suspense } from "react";

interface CourseStructureItem {
  id: string;
  title: string;
  item_type: "folder" | "file";
  children?: CourseStructureItem[];
  description?: string;
  is_active: boolean;
  order_index: number;
  [key: string]: unknown;
}

function CourseViewerContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("courseId");
  const itemId = searchParams?.get("itemId");
  const readerQuizId = searchParams?.get("quizId"); // For Reader Mode quiz navigation
  const router = useRouter(); 
  
  const [structure, setStructure] = useState<CourseStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  
  // Compute selected item from structure
  const flatten = useCallback((items: CourseStructureItem[]): CourseStructureItem[] => {
    return items.reduce((acc: CourseStructureItem[], item: CourseStructureItem) => {
      return [...acc, item, ...(item.children ? flatten(item.children) : [])];
    }, []);
  }, []);
  
  const selectedItem = useMemo(() => {
    const flat = flatten(structure);
    return flat.find(i => i.id === selectedItemId);
  }, [selectedItemId, structure, flatten]);
  
  const [loadingContent, setLoadingContent] = useState(false);
  const [viewState, setViewState] = useState<"list" | "content">("list");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [highlightVersion, setHighlightVersion] = useState(0);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [courseName, setCourseName] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [itemsWithNotes, setItemsWithNotes] = useState<Set<string>>(new Set());
  const [itemsWithQuizzes, setItemsWithQuizzes] = useState<Set<string>>(new Set());

  // Reader Mode State
  const [isReaderMode, setIsReaderMode] = useState(false);
  
  // Sidebar Collapsed State (for course-viewer's left panel)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Navigation Drawer State (Main App Navigation)
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [isClosingDrawer, setIsClosingDrawer] = useState(false);

  const handleCloseNav = () => {
    setIsClosingDrawer(true);
    setTimeout(() => {
      setShowNavDrawer(false);
      setIsClosingDrawer(false);
    }, 300); // Match animation duration
  };
  
  // Global Dark Mode Detection
  const { isDarkMode } = useThemeStore();
  
  // Sheet Dark Mode Toggle (independent of global dark mode, but only available in global dark mode)
  const [isSheetDark, setIsSheetDark] = useState(false);
  
  // Sync sheet dark mode with global dark mode - when global light mode, always use light sheet
  useEffect(() => {
    if (!isDarkMode) {
      setIsSheetDark(false);
    }
  }, [isDarkMode]);

  useEffect(() => {
     if (searchParams?.get("view") === "reader") {
         setIsReaderMode(true);
     }
  }, [searchParams]);

  // Handle explicit reader mode exit
  const exitReaderMode = () => {
      setIsReaderMode(false);
      // Update URL to remove view=reader but keep other params
      if (courseId && typeof window !== 'undefined') {
         const params = new URLSearchParams(searchParams?.toString());
         params.delete("view");
         router.push(`?${params.toString()}`, { scroll: false });
      }
  };

  // 📐 Resizable Sidebar State
  const SIDEBAR_MIN_WIDTH = 280;
  const SIDEBAR_MAX_WIDTH = 600;
  const SIDEBAR_DEFAULT_WIDTH = 400;
  
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('course-viewer-sidebar-width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return SIDEBAR_DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('course-viewer-sidebar-width', String(sidebarWidth));
    }
  }, [sidebarWidth]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartXRef.current;
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, dragStartWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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

  // Restore TTS Highlighting using data-sentence-index
  useEffect(() => {
    // 1. Clear active state from all elements
    const prevActive = document.querySelectorAll('.tts-active');
    prevActive.forEach(el => el.classList.remove('tts-active'));

    // 2. Add active state to current sentence elements
    if (tts.isPlaying || tts.isPaused) {
      const currentEls = document.querySelectorAll(`[data-sentence-index="${tts.currentSentenceIndex}"]`);
      currentEls.forEach(el => el.classList.add('tts-active'));

      // 3. Scroll into view if playing
      if (tts.isPlaying && currentEls.length > 0) {
        currentEls[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [tts.currentSentenceIndex, tts.isPlaying, tts.isPaused]);

  // Scrubber State & Handlers
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const wasPlayingRef = useRef(false); // Track play state during scrub

  const handleScrubStart = (e: React.PointerEvent) => {
      e.preventDefault();
      wasPlayingRef.current = tts.isPlaying; // Capture state
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
      
      // If we weren't playing before, pause immediately after seeking
      if (!wasPlayingRef.current) {
         setTimeout(() => tts.pause(), 50);
      }
      
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
      // Attempt browser fullscreen ONLY on Desktop
      if (window.innerWidth >= 768) {
         document.documentElement.requestFullscreen().catch(() => {
            // Ignore errors
         });
      }
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
      // Track as recent course
      usePaymentStore.getState().markCourseAsVisited(courseId);
    }
  }, [courseId]);

  // Handle direct navigation to item
  useEffect(() => {
     if (itemId && !selectedItemId) {
        handleFileSelect(itemId, false); 
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const [structData, completedData, courseData] = await Promise.all([
       DataLoader.getCourseStructure(id),
       DataLoader.getUserCompletedItems(),
       DataLoader.getCourseById(id)
    ]);
    
    setStructure(structData as CourseStructureItem[]);
    setCompletedItems(new Set(completedData));
    if (courseData) {
      setCourseName(courseData.name || "Course Content");
    }
    
    // Load content availability
    const flattenFiles = (items: CourseStructureItem[]): CourseStructureItem[] => {
      return items.reduce((acc: CourseStructureItem[], item: CourseStructureItem) => {
        if (item.item_type === 'file') {
          return [...acc, item];
        }
        if (item.children) {
          return [...acc, ...flattenFiles(item.children)];
        }
        return acc;
      }, []);
    };
    
    const fileIds = flattenFiles(structData as CourseStructureItem[]).map(f => f.id);
    if (fileIds.length > 0) {
      const { itemsWithNotes: notes, itemsWithQuizzes: quizzes } = await DataLoader.getContentAvailability(fileIds);
      setItemsWithNotes(notes);
      setItemsWithQuizzes(quizzes);
    }
    
    setLoading(false);
  };

  const flattenFiles = (items: CourseStructureItem[]): CourseStructureItem[] => {
    let files: CourseStructureItem[] = [];
    items.forEach((item: CourseStructureItem) => {
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

  const handleExpand = (itemId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
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
    
    // Exit fullscreen (both UI state and browser state)
    setIsFullscreen(false);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {/* AppHeader removed */}
        <div className="container mx-auto px-4 py-16 text-center">Loading course content...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen flex flex-col relative z-0">
      {/* Background always rendered (z-index handles visibility) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <DottedBackground />
      </div>

      {/* Header: Visible in Normal Mode OR Mobile Fullscreen Mode */}
      {/* READER MODE: Hide Header on Desktop too if requested, or keep it? User image shows header. */}
      {/* User image shows "Gavelogy" header at top. So we KEEP header. */}
      {/* AppHeader removed - Sidebar handles navigation now */}
      <div className={cn("relative z-20", isFullscreen ? "hidden md:hidden max-md:block" : "block")}>
         {/* Replaced by Sidebar */}
      </div>

      {/* DESKTOP SPLIT VIEW */}
      <div className={cn(
        "hidden lg:flex fixed inset-0 z-40 overflow-hidden",
        isFullscreen && "hidden"
      )}>
        <div className={cn("w-full h-full flex bg-gray-50 dark:bg-[#1a1a1a]", isDragging && "cursor-col-resize select-none")}>

          {/* Left Sidebar - Resizable (HIDDEN IN READER MODE) */}
          {!isReaderMode && (
            <>
              {isSidebarCollapsed ? (
                /* Collapsed Sidebar - Just a slim bar with expand button */
                <div className="h-full w-[60px] flex flex-col items-center py-4 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] shrink-0">
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => setShowNavDrawer(true)}
                    title="Open Navigation"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  {/* Logo */}
                  <div className="w-10 h-10 mt-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                    G
                  </div>
                  
                  <div className="mt-auto pb-4">
                     <button 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => setIsSidebarCollapsed(false)}
                        title="Expand Course List"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                  </div>
                </div>
              ) : (
                /* Expanded Sidebar */
                <div 
                  className="h-full flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden shrink-0"
                  style={{ width: sidebarWidth }}
                >
                  {/* Header - Navbar Icon, Logo and Course Name - NO TRANSLATE */}
                  <div className="px-4 py-4 shrink-0 flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 notranslate">
                    {/* Navbar Icon - Opens Navigation Drawer */}
                    <button 
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors shrink-0 mt-0.5"
                      onClick={() => setShowNavDrawer(true)}
                      title="Open Navigation"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    
                    {/* Logo & Info */}
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0 mt-0.5">
                      G
                    </div>
                    {/* Course Info - Dynamic height */}
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{courseName || "Course"}</h1>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                        {structure.length > 0 
                          ? `${structure.length} ${structure.length === 1 ? 'chapter' : 'chapters'}`
                          : "Select a topic"}
                      </p>
                    </div>

                    {/* Collapse Button */}
                    <button 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
                      onClick={() => setIsSidebarCollapsed(true)}
                      title="Collapse Course List"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List - Scrollable - NO TRANSLATE */}
                  <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar notranslate">
                  <CourseStructureList 
                    items={structure} 
                    onFileSelect={handleFileSelect} 
                    completedItems={completedItems}
                    onToggleComplete={handleToggleComplete}
                    expandedIds={expandedIds}
                    onExpand={handleExpand}
                    itemsWithNotes={itemsWithNotes}
                    itemsWithQuizzes={itemsWithQuizzes}
                    onQuizSelect={(itemId) => {
                      const courseIdQuery = courseId ? `?courseId=${courseId}` : '';
                      router.push(`/course-quiz/${itemId}${courseIdQuery}`);
                    }}
                  />
                </div>
              </div>
              )}
              
              {/* Resize Handle - only show when sidebar is expanded */}
              {!isSidebarCollapsed && (
              <div 
                className="w-1 h-full bg-gray-200 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors group relative"
                onMouseDown={handleDragStart}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-6 bg-blue-500 rounded-full" />
                </div>
              </div>
              )}
            </>
          )}
          
          {/* Right Content Area */}
          {/* If Reader Mode, center content with max-width like the mobile view but full height */}
          <div className={cn(
              "flex-1 h-full bg-transparent overflow-hidden relative z-10", 
              isReaderMode && "flex justify-center"
          )}>
            {selectedItemId ? (
              <div className={cn(
                  "h-full overflow-y-auto custom-scrollbar relative w-full rounded-2xl transition-all duration-300",
                  isSheetDark 
                    ? "bg-zinc-900 border border-zinc-800 shadow-sm" 
                    : "bg-white border border-gray-200 shadow-sm",
                  isReaderMode && "max-w-5xl mx-auto"
              )}>
                {/* Solid Toolbar - NO TRANSLATE */}
                <div className={cn(
                  "sticky top-0 z-50 px-4 py-3 mb-4 border-b transition-all duration-300 notranslate",
                  isSheetDark 
                    ? "bg-zinc-900 border-zinc-800" 
                    : "bg-white border-gray-100"
                )}>
                  <div className="flex items-center justify-between w-full">
                    {/* Back Button */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                          if (isReaderMode) {
                              exitReaderMode();
                          } else {
                              setSelectedItemId(null);
                          }
                      }}
                      className={cn(
                        "rounded-full h-8 px-3 text-xs transition-all duration-300",
                        isSheetDark 
                          ? "text-gray-300 hover:text-white hover:bg-zinc-800" 
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                      )}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    
                    <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                    
                    {/* Note Title */}
                    <span className={cn(
                      "text-sm font-medium max-w-[300px] truncate px-2",
                      isSheetDark ? "text-gray-100" : "text-gray-800"
                    )}>
                      {selectedItem?.title || "Notes"}
                    </span>
                    
                    <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                    
                    {/* Translate Widget */}
                    <TranslateWidget resetKey={selectedItemId} />
                    
                    <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                    
                    {/* Download Button */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={!content}
                        className={cn(
                          "rounded-full h-8 px-3 text-xs transition-all duration-300",
                          isSheetDark 
                            ? "text-gray-300 hover:text-white hover:bg-zinc-800" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      
                      {showDownloadMenu && typeof document !== 'undefined' && createPortal(
                        <div 
                          data-download-dropdown
                          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[200px] z-9999"
                          style={{ 
                            top: '100px', 
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        >
                          <button
                            onClick={() => { setShowDownloadMenu(false); /* handleDownload() */ }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                          >
                            <ScrollText className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Continuous Flow</div>
                              <div className="text-xs text-gray-500">Single long page</div>
                            </div>
                          </button>
                          <button
                            onClick={() => { setShowDownloadMenu(false); /* handlePageByPageDownload() */ }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
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
                    
                    {/* TTS Controls */}
                    {sentences.length > 0 && (
                      <>
                        <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                        
                        {/* Speed Button */}
                        <button
                           onClick={(e) => {
                               e.stopPropagation();
                               const rect = e.currentTarget.getBoundingClientRect();
                               setSpeedMenuPos({ top: rect.bottom + 8, left: rect.left });
                               setShowSpeedMenu(!showSpeedMenu);
                           }}
                           className={cn(
                             "focus:outline-none p-1.5 rounded-full transition-all duration-300",
                             isSheetDark 
                               ? "text-gray-300 hover:text-blue-400 hover:bg-zinc-800" 
                               : "text-gray-600 hover:text-blue-600 hover:bg-gray-100/80"
                           )}
                           title="Playback Speed"
                        >
                           <span className="text-xs font-bold w-6 text-center block">{tts.rate}x</span>
                        </button>
                        
                        {/* Play/Pause */}
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
                           className={cn(
                             "focus:outline-none p-1.5 rounded-full transition-all duration-300",
                             isSheetDark 
                               ? "text-gray-200 hover:text-blue-400 hover:bg-zinc-800" 
                               : "text-gray-700 hover:text-blue-600 hover:bg-gray-100/80"
                           )}
                           title={tts.isPlaying ? "Pause Reading" : "Read Aloud"}
                        >
                           {tts.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                        
                        {/* Mini Scrubber */}
                        <div className="w-24 flex items-center gap-2">
                           <div 
                              className="relative flex-1 h-1.5 flex items-center cursor-pointer group select-none touch-none"
                              onPointerDown={handleScrubStart}
                              onPointerMove={handleScrubMove}
                              onPointerUp={handleScrubEnd}
                              onPointerCancel={handleScrubEnd}
                           >
                              {/* Track */}
                              <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
                              {/* Progress */}
                              <div 
                                 className={cn("absolute left-0 h-1 bg-blue-500 rounded-full", !isScrubbing && "transition-all duration-300 ease-out")}
                                 style={{ width: `${displayProgress}%` }}
                              />
                           </div>
                        </div>

                        {/* Speed Menu Portal */}
                        {showSpeedMenu && typeof document !== 'undefined' && createPortal(
                           <>
                               <div className="fixed inset-0 z-9999" onClick={() => setShowSpeedMenu(false)} />
                               <div 
                                   className="fixed z-10000 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
                                   style={{ 
                                       top: `${speedMenuPos.top}px`, 
                                       left: `${speedMenuPos.left}px` 
                                   }}
                               >
                                   {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                       <button
                                           key={rate}
                                           onClick={() => {
                                               tts.setRate(rate);
                                               setShowSpeedMenu(false);
                                           }}
                                           className={cn(
                                               "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between",
                                               tts.rate === rate ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"
                                           )}
                                       >
                                           <span>{rate}x Speed</span>
                                           {tts.rate === rate && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                       </button>
                                   ))}
                               </div>
                           </>,
                           document.body
                        )}
                      </>
                    )}

                    {/* Sheet Dark Mode Toggle - Only visible in global dark mode */}
                    {isDarkMode && (
                      <>
                        <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsSheetDark(!isSheetDark)}
                          className={cn(
                            "rounded-full h-8 px-3 text-xs transition-all duration-300",
                            isSheetDark 
                              ? "text-yellow-400 hover:text-yellow-300 hover:bg-zinc-800" 
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                          )}
                          title={isSheetDark ? "Switch to Light" : "Switch to Dark"}
                        >
                          {isSheetDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        </Button>
                      </>
                    )}

                    <div className={cn("w-px h-5", isSheetDark ? "bg-zinc-700" : "bg-gray-300")} />
                    
                    {/* Focus Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={cn(
                        "rounded-full h-8 px-3 text-xs transition-all duration-300",
                        isSheetDark 
                          ? "text-gray-300 hover:text-white hover:bg-zinc-800" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                      )}
                    >
                      <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                      Focus
                    </Button>
                    </div>
                  </div>
                
                {/* Content */}
                <div className={cn(
                  "px-12 pb-20",
                  isSheetDark && "sheet-dark-mode"
                )}>
                  {loadingContent ? (
                    <div className="space-y-4 animate-pulse pt-8">
                      <div className={cn("h-8 rounded w-1/3", isSheetDark ? "bg-zinc-700" : "bg-gray-200")}></div>
                      <div className={cn("h-4 rounded w-full", isSheetDark ? "bg-zinc-700" : "bg-gray-200")}></div>
                      <div className={cn("h-4 rounded w-full", isSheetDark ? "bg-zinc-700" : "bg-gray-200")}></div>
                    </div>
                  ) : (
                    <>
                      <div 
                        dangerouslySetInnerHTML={{ __html: processedHtml }}
                        className={cn(
                          "prose prose-lg max-w-none",
                          isSheetDark && "prose-invert sheet-dark-mode"
                        )}
                      />
                      
                      {/* Take Quiz Button - Only in Reader Mode with quizId */}
                      {isReaderMode && readerQuizId && (
                        <div className="mt-12 pt-8 border-t border-gray-200">
                          <div className="flex flex-col items-center gap-4 py-8 px-6 bg-linear-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100/50">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">Ready to Test Your Knowledge?</h3>
                              <p className="text-sm text-gray-500">Complete the spaced repetition quiz for this topic</p>
                            </div>
                            <Button 
                              onClick={() => router.push(`/course-quiz/${readerQuizId}?mode=spaced-repetition`)}
                              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                              🎯 Take Quiz
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-600">Select a topic</h3>
                  <p className="text-sm mt-2">Pick a folder from the left to view notes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* MOBILE/ORIGINAL LAYOUT - shown on mobile or when in fullscreen */}
      <div className={cn(
        // Hide on desktop when split pane is showing, UNLESS in fullscreen mode
        !isFullscreen && "lg:hidden", 
        "flex-1 container mx-auto",
          // Base styles
          "flex flex-col",
          
          isFullscreen 
            ? [
                // DESKTOP: Immersive Fullscreen
                "md:fixed md:inset-0 md:z-50 md:bg-white md:h-screen md:w-screen md:max-w-none md:m-0 md:p-0",
                // MOBILE: Print Mode (Document Style) - Pure white, full width, no roundness
                "max-md:fixed max-md:inset-0 max-md:z-50 max-md:bg-white max-md:h-screen max-md:w-screen max-md:max-w-none max-md:m-0 max-md:p-0 max-md:rounded-none max-md:shadow-none max-md:border-none",
              ]
            : [
                // DESKTOP: Normal Mode
                "md:max-w-5xl md:py-8 md:bg-transparent md:px-4",
                // MOBILE: Card Mode (App UI) - Floating card
                "max-md:relative max-md:z-10 max-md:max-w-[95%] max-md:mx-auto max-md:bg-white max-md:py-4 max-md:shadow-md max-md:rounded-xl"
            ],
           // Shared structural
           "md:flex md:flex-col"
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
            <div className={cn(
               isFullscreen ? "max-w-7xl mx-auto w-full h-full overflow-y-auto" : ""
            )}>
                {/* Navigation Bar - Sticky Toolbar */}
                <div 
                  className="sticky z-50 w-full max-w-5xl mx-auto"
                  style={{ top: 0 }}
                >
                   {/* Toolbar Container relative for centering */}
                   <div className={cn(
                      "relative flex items-center justify-between mb-6 shrink-0 bg-white p-1.5 md:p-2 border-b border-gray-100 shadow-md overflow-x-auto gap-1 no-scrollbar rounded-2xl mx-auto w-full",
                      isFullscreen 
                         ? [
                              // DESKTOP: Floating Card Toolbar
                              "md:px-4",
                              // MOBILE: Flat Header (Print Mode)
                              "max-md:rounded-none max-md:mx-0 max-md:px-4 max-md:py-3 max-md:bg-white max-md:shadow-none max-md:border-b max-md:border-gray-200"
                           ]
                         : "px-4" 
                   )}>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleBackToList}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-1 sm:px-3"
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
                           className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-1 sm:px-3 flex items-center gap-0.5"
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
                  {/* Divider - Hidden on mobile to save space */}{/* <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" /> */}

                  {/* TTS Controls (Inline) */}
                  <div className="flex items-center gap-1 animate-fadeIn">
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
                           
                        </>
                     )}
                  </div>
                  
                  {/* Center Timer - Absolute Positioned */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                     <div id="study-timer-container">
                        <StudyTimer />
                     </div>
                  </div>
                  
                  {/* Spacer to push Right Section to end */}
                  <div className="flex-1" />





                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                     {/* Top Next/Prev - Hidden on mobile, visible on desktop */}
                     <div className="hidden md:flex items-center gap-1 sm:gap-2">
                         
                         {/* Undo / Redo Controls (Moved here) */}
                         <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-2">
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
                  "animate-slideIn w-full max-w-5xl mx-auto py-8 pb-20 bg-white! relative z-30",
                  // Card styling - disabled in full screen on mobile
                  isFullscreen 
                    ? "max-md:rounded-none max-md:shadow-none max-md:border-none max-md:p-6" // Print Mode padding
                    : "rounded-2xl shadow-xl border border-gray-100 p-4 md:p-12", // Card Mode padding
                  
                  // Desktop overrides (always keeps card look unless we want desktop to change too, but user said keep desktop unchanged)
                  // Actually user said "Desktop layout that looks correct and print-like... Desktop layout must remain unchanged"
                  // So we leave desktop as is. The conditional above mainly targets mobile via max-md vs base.
                  // Let's refine:
                  "md:rounded-2xl md:shadow-xl md:border md:border-gray-100 md:p-12",

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
                           className={cn(
                              "prose max-w-none font-sans prose-headings:font-bold prose-p:text-[#334155] prose-headings:text-[#0f172a] dark:prose-invert prose-li:text-black prose-li:marker:text-black text-left md:text-justify",
                              isFullscreen ? "prose-lg leading-relaxed" : "prose-base", // Larger font in print mode
                              "md:prose-lg" // Always large on desktop
                           )}
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
         
         {/* FloatingTimer removed as per user request */}
      </div>
      
      {/* Navigation Drawer Portal */}
      {showNavDrawer && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-100 flex">
           {/* Backdrop */}
           <div 
             className={cn(
               "absolute inset-0 bg-black/20 backdrop-blur-sm",
               isClosingDrawer ? "animate-out fade-out" : "animate-in fade-in"
             )}
             onClick={handleCloseNav}
           />
           
           {/* Drawer */}
           <div className={cn(
             "relative w-[280px] h-full bg-sidebar border-r border-sidebar-border shadow-2xl flex flex-col",
             isClosingDrawer ? "animate-out slide-out-to-left duration-300" : "animate-in slide-in-from-left duration-300"
           )}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                  <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm">G</div>
                    <span>Gavelogy</span>
                  </div>
                  <button 
                    onClick={handleCloseNav}
                    className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    title="Collapse Navigation"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto py-4">
                 <SidebarNav />
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Sheet Dark Mode - Global Override (Only if Sheet is Dark) */}
      <style jsx global>{`
        ${isSheetDark ? `
          /* Scrollbar styling for dark sheet */
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #27272a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #52525b;
            border: 3px solid #27272a;
          }
        ` : ''}
      `}</style>
    </div>
  );
}

export default function CourseViewerPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
       </div>
    }>
      <CourseViewerContent />
    </Suspense>
  );
}
