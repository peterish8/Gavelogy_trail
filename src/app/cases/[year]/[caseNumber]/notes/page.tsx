"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { DataLoader } from "@/lib/data-loader";
import { customToHtml } from "@/lib/content-converter";
import { NotesJudgmentLayout } from "@/components/judgment/NotesJudgmentLayout";
import { checkItemHasPdf } from "@/actions/judgment/links";

export default function CaseNotesPage({
  params,
}: {
  params: Promise<{ year: string; caseNumber: string }>;
}) {
  const router = useRouter();
  const { year, caseNumber } = use(params);

  const [caseNotes, setCaseNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [caseNumberInt, setCaseNumberInt] = useState<number>(0);
  const [itemId, setItemId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useCopyProtection();

  useEffect(() => {
    loadCaseNotes();
    let match = caseNumber.match(/CQ-\d+-(\d+)/);
    if (!match) match = caseNumber.match(/CS-\d+-[A-Z]-(\d+)/);
    if (!match) match = caseNumber.match(/CR-\d+-(\d+)/);
    if (match) setCaseNumberInt(parseInt(match[1]));
    setIsTransitioning(false);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseNumber]);

  useEffect(() => {
    if (!itemId) return;
    checkItemHasPdf(itemId).then(setPdfUrl);
  }, [itemId]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const navigateToCase = (direction: "prev" | "next") => {
    const newCaseNumber =
      direction === "prev" ? caseNumberInt - 1 : caseNumberInt + 1;
    if (newCaseNumber >= 1 && newCaseNumber <= 50) {
      setIsTransitioning(true);
      let newCaseId: string;

      if (caseNumber.startsWith("CQ-")) {
        newCaseId = `CQ-${year.slice(-2)}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else if (caseNumber.startsWith("CS-")) {
        const parts = caseNumber.split("-");
        const subjectLetter = parts[2];
        newCaseId = `CS-${year.slice(-2)}-${subjectLetter}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else if (caseNumber.startsWith("CR-")) {
        newCaseId = `CR-${year.slice(-2)}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else {
        newCaseId = caseNumber;
      }

      DataLoader.preloadCaseData(year, newCaseId).catch(() => null);
      setTimeout(() => {
        router.push(`/cases/${year}/${newCaseId}/notes`);
      }, 200);
    }
  };

  const loadCaseNotes = async () => {
    try {
      const { data: cachedData, fromCache } = await DataLoader.loadCaseNotes(year, caseNumber);
      const data = cachedData as (typeof cachedData & { item_id?: string }) | null;

      if (fromCache) {
        setCaseNotes(data?.overall_content || "No notes available");
        if (data?.item_id) setItemId(data.item_id);
        setLoading(false);
        return;
      }

      setLoading(true);
      if (data?.overall_content) {
        setCaseNotes(data.overall_content);
        if (data.item_id) setItemId(data.item_id);
      } else {
        setCaseNotes(`Case notes for ${caseNumber} are not available yet. This case will be added soon.`);
      }
    } catch (error: unknown) {
      console.error("Error loading case notes:", error);
      setCaseNotes("Error loading case notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!caseNumber || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-500" />
          <span className="text-sm">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-white no-copy transition-opacity duration-200 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Floating nav — top left */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={async () => {
            if (document.fullscreenElement) {
              try { await document.exitFullscreen(); } catch {}
            }
            router.push(`/subjects?tab=contemporary-cases&year=${year}`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 text-gray-600 hover:text-gray-900 hover:shadow-lg text-sm font-medium transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Floating nav — top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => navigateToCase("prev")}
          disabled={caseNumberInt <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 text-gray-600 hover:text-gray-900 hover:shadow-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <span className="text-xs text-gray-400 font-mono px-1">{caseNumber}</span>
        <button
          onClick={() => navigateToCase("next")}
          disabled={caseNumberInt >= 50}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 text-gray-600 hover:text-gray-900 hover:shadow-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content — full continuous flow */}
      <div className="max-w-3xl mx-auto px-6 pt-20 pb-24">
        <NotesJudgmentLayout itemId={itemId} pdfUrl={pdfUrl}>
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-slate-700"
            dangerouslySetInnerHTML={{ __html: customToHtml(caseNotes) }}
          />
        </NotesJudgmentLayout>

        {/* Take Quiz — bottom of content */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <Button
            onClick={async () => {
              try {
                const { data } = await DataLoader.loadQuizQuestions(caseNumber);
                const hasQuiz =
                  data &&
                  data.length > 0 &&
                  !data[0].id?.toString().startsWith("placeholder-");
                if (!hasQuiz) {
                  alert(`No quiz available for case ${caseNumber} yet.`);
                  return;
                }
                router.push(`/cases/${year}/${caseNumber}/quiz`);
              } catch (err) {
                console.error("Quiz check failed:", err);
                router.push(`/cases/${year}/${caseNumber}/quiz`);
              }
            }}
            className="w-full bg-linear-to-br from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
          >
            Take Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
