"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DottedBackground } from "@/components/DottedBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  useCopyProtection();
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Once we have itemId, check for PDF
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
      }, 300);
    }
  };

  const loadCaseNotes = async () => {
    try {
      const { data: cachedData, fromCache } = await DataLoader.loadCaseNotes(year, caseNumber);

      // Treat returned data as extended type that may include item_id
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
      <div className="min-h-screen relative">
        <DottedBackground />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="ml-4 text-gray-600">Loading notes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <DottedBackground />

      <div className="container mx-auto px-4 py-2">
        <div className="max-w-6xl mx-auto">
          <Card
            className={`bg-white shadow-2xl transition-all duration-300 ease-out ${
              isTransitioning ? "opacity-0" : "opacity-100 animate-in fade-in-0"
            }`}
          >
            <CardContent className="p-8 max-h-[calc(100vh-40px)] overflow-y-auto no-copy relative">
              {/* Header */}
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (document.fullscreenElement) {
                          try {
                            await document.exitFullscreen();
                            setIsFullscreen(false);
                          } catch (error) {
                            console.error("Error exiting fullscreen:", error);
                          }
                        }
                        router.push(`/subjects?tab=contemporary-cases&year=${year}`);
                      }}
                      className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white animate-in fade-in-0 slide-in-from-left-4 duration-500"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white animate-in fade-in-0 slide-in-from-left-4 duration-700"
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToCase("prev")}
                      disabled={caseNumberInt <= 1}
                      className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white disabled:opacity-50 animate-in fade-in-0 slide-in-from-right-4 duration-500"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToCase("next")}
                      disabled={caseNumberInt >= 50}
                      className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white disabled:opacity-50 animate-in fade-in-0 slide-in-from-right-4 duration-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes content — wrapped in NotesJudgmentLayout */}
              <NotesJudgmentLayout itemId={itemId} pdfUrl={pdfUrl}>
                <div
                  className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-slate-700 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 relative z-0"
                  dangerouslySetInnerHTML={{ __html: customToHtml(caseNotes) }}
                />
              </NotesJudgmentLayout>

              {/* Take Quiz Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
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
                  className="w-full bg-linear-to-br from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300"
                >
                  Take Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
