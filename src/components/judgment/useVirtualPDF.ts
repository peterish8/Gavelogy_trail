'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type * as PDFJSLib from 'pdfjs-dist';

export interface VirtualPDFHook {
  pdf: PDFJSLib.PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  renderPage: (pageNum: number, canvas: HTMLCanvasElement, scale?: number) => Promise<PDFJSLib.PageViewport | null>;
  getPageText: (pageNum: number) => Promise<string>;
  getPageHeight: (pageNum: number, scale?: number) => Promise<number>;
}

export function useVirtualPDF(pdfUrl: string | null): VirtualPDFHook {
  const [pdf, setPdf] = useState<PDFJSLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<PDFJSLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;

    async function loadPdf() {
      setIsLoading(true);
      setError(null);
      try {
        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(pdfUrl!);
        const doc = await loadingTask.promise;

        if (cancelled) {
          doc.destroy();
          return;
        }

        pdfRef.current = doc;
        setPdf(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError('Failed to load PDF. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Cleanup PDF on unmount
  useEffect(() => {
    return () => {
      pdfRef.current?.destroy();
    };
  }, []);

  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement, scale = 1.3): Promise<PDFJSLib.PageViewport | null> => {
      const doc = pdfRef.current;
      if (!doc) return null;
      try {
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        page.cleanup();
        return viewport;
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
        return null;
      }
    },
    []
  );

  const getPageText = useCallback(async (pageNum: number): Promise<string> => {
    const doc = pdfRef.current;
    if (!doc) return '';
    try {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      page.cleanup();
      return textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
    } catch {
      return '';
    }
  }, []);

  const getPageHeight = useCallback(
    async (pageNum: number, scale = 1.3): Promise<number> => {
      const doc = pdfRef.current;
      if (!doc) return 0;
      try {
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        page.cleanup();
        return viewport.height;
      } catch {
        return 0;
      }
    },
    []
  );

  return { pdf, totalPages, isLoading, error, renderPage, getPageText, getPageHeight };
}
