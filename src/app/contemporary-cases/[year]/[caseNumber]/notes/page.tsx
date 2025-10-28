"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
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
import { supabase } from "@/lib/supabase";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { DataLoader } from "@/lib/data-loader";

// Function to format case notes with proper styling
function formatCaseNotes(content: string, caseNumberInt: number) {
  if (!content) return "";

  const lines = content.split("\n");
  const formattedLines: React.ReactElement[] = [];
  let key = 0;

  let firstNonEmptyLine = true;
  let isInSection = false;
  let lastWasHeading = false;
  let isInKeyStatutes = false;
  let isInSignificanceSection = false;
  let significanceContent: React.ReactElement[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    


    // Check if this line contains "Key Statutes / Provisions:" anywhere
    if (trimmedLine.match(/Key Statutes\s*\/\s*Provisions:/i)) {
      isInKeyStatutes = true;
      formattedLines.push(
        <div key={key++} className="mb-3 mt-4">
          <span
            className="text-base lg:text-xl font-bold px-3 py-1.5 rounded inline-block"
            style={{ backgroundColor: "#FEF3C7", color: "#78350F" }}
          >
            Key Statutes / Provisions:
          </span>
        </div>
      );
      return;
    }

    // Also check for "Key Constitutional Articles:"
    if (trimmedLine.match(/Key Constitutional Articles:/i)) {
      formattedLines.push(
        <div key={key++} className="mb-2 font-bold text-gray-900">
          <span className="text-sm lg:text-lg">{trimmedLine}</span>
        </div>
      );
      return;
    }

    // Check for "Statutes Involved:"
    if (trimmedLine.match(/Statutes Involved:/i)) {
      formattedLines.push(
        <div key={key++} className="mb-2 font-bold text-gray-900">
          <span className="text-sm lg:text-lg">{trimmedLine}</span>
        </div>
      );
      return;
    }

    // If we're in Key Statutes section, handle as sub-item
    if (isInKeyStatutes) {
      // Skip empty lines
      if (!trimmedLine) {
        return;
      }
      // Check if this is still a bullet point in the Key Statutes section
      if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-")) {
        // Remove bullet points and display as indented sub-item
        const content = trimmedLine.replace(/^[•\-]\s*/, "");
        // Skip if content is empty after removing bullet
        if (!content.trim()) {
          return;
        }
        formattedLines.push(
          <div key={key++} className="mb-2 ml-6 text-gray-900">
            <span className="text-sm lg:text-lg">• {content}</span>
          </div>
        );
        return;
      } else {
        // Not a bullet point, exit Key Statutes section
        isInKeyStatutes = false;
        // Continue to process this line normally
      }
    }

    // Skip empty lines
    if (!trimmedLine) {
      if (lastWasHeading) {
        // Add spacing after headings
        formattedLines.push(<div key={key++} className="mb-4"></div>);
      }
      return;
    }

    // First non-empty line is the case title - responsive font size
    if (firstNonEmptyLine) {
      formattedLines.push(
        <div key={key++} className="mb-8 pb-4 border-b">
          <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold text-gray-900">
            {caseNumberInt}. {trimmedLine}
          </h2>
        </div>
      );
      firstNonEmptyLine = false;
      return;
    }

    // Exit Key Statutes section if we encounter a new heading
    if (
      trimmedLine.match(/^[🧩⚙️🧠💬✅🌟🔗]/) ||
      trimmedLine.match(
        /^(Bench|Date of Judgment|Constitutional Provisions|Background|Relevant Provisions|Key Issue|Facts.*|Issues.*|Judgment.*|Outcome.*|Significance.*|Related Cases.*):?$/i
      )
    ) {
      isInKeyStatutes = false;
    }

    // Check if line is a main heading (starts with emoji or specific patterns)
    if (
      trimmedLine.match(/^[🧩⚙️🧠💬✅🌟🔗]/) ||
      trimmedLine.match(
        /^(Bench|Date of Judgment|Constitutional Provisions|Background|Relevant Provisions|Key Issue|Facts.*|Issues.*|Judgment.*|Outcome.*|Significance.*|Related Cases.*):?$/i
      )
    ) {
      // If we're already in a significance section, close it
      if (isInSignificanceSection) {
        formattedLines.push(
          <div
            key={key++}
            className="mb-4 p-4 border border-yellow-300 rounded-lg"
            style={{ backgroundColor: "#FEF5D3" }}
          >
            {significanceContent}
          </div>
        );
        significanceContent = [];
        isInSignificanceSection = false;
      }

      // Add a separator line before new major sections
      if (isInSection) {
        formattedLines.push(
          <div key={key++} className="my-6 border-t border-gray-200"></div>
        );
      }

      if (trimmedLine.includes('🌟 Significance / Key Takeaways')) {
        isInSignificanceSection = true;
        significanceContent.push(
          <div key={key++} className="mb-2">
            <h3 className="text-base lg:text-xl font-bold text-gray-900">
              {trimmedLine}
            </h3>
          </div>
        );
        isInSection = true;
        lastWasHeading = true;
        return;
      } else {
        formattedLines.push(
          <div key={key++} className="mb-3">
            <h3 className="text-base lg:text-xl font-bold text-gray-900">
              {trimmedLine}
            </h3>
          </div>
        );
      }
      isInSection = true;
      lastWasHeading = true;
      return;
    }

    // Reset lastWasHeading flag
    lastWasHeading = false;

    // If we're in significance section, add content to significanceContent
    if (isInSignificanceSection) {
      // Check if line is a numbered item (e.g., "1️⃣", "2️⃣")
      if (trimmedLine.match(/^[\d\s]*[1️⃣2️⃣3️⃣4️⃣]/)) {
        significanceContent.push(
          <div key={key++} className="mb-2 ml-4">
            <span className="text-sm lg:text-lg font-semibold text-gray-900">
              {trimmedLine}
            </span>
          </div>
        );
      }
      // Regular content - add bullet point
      else {
        significanceContent.push(
          <div key={key++} className="mb-2 ml-4 text-gray-900">
            <span className="mr-2">•</span>
            <span className="text-sm lg:text-lg">{trimmedLine}</span>
          </div>
        );
      }
      return;
    }

    // Special handling for Ratio: display in green translucent box
    if (trimmedLine.match(/^Ratio:/i)) {
      formattedLines.push(
        <div
          key={key++}
          className="mb-4 mt-3 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <span className="text-sm lg:text-lg font-semibold text-green-800">
            {trimmedLine}
          </span>
        </div>
      );
      return;
    }
    // Special handling for Significance / Key Takeaways: display in yellow translucent box
    if (trimmedLine.includes('🌟 Significance / Key Takeaways')) {
      formattedLines.push(
        <div
          key={key++}
          className="mb-4 mt-3 p-4 border border-yellow-200 rounded-lg"
          style={{ backgroundColor: "#fef3c7" }}
        >
          <span className="text-sm lg:text-lg font-semibold text-yellow-800">
            {trimmedLine}
          </span>
        </div>
      );
      return;
    }
    // Check if line is a numbered item (e.g., "1️⃣", "2️⃣")
    if (trimmedLine.match(/^[\d\s]*[1️⃣2️⃣3️⃣4️⃣]/)) {
      formattedLines.push(
        <div key={key++} className="mb-2 ml-4">
          <span className="text-sm lg:text-lg font-semibold text-gray-900">
            {trimmedLine}
          </span>
        </div>
      );
      return;
    }
    // Check if line is a subheading (starts with "Held:", etc., but not "Significance / Key Takeaways" which we handled above)
    if (trimmedLine.match(/^(Held|Referred|Related Cases):/i)) {
      formattedLines.push(
        <div key={key++} className="mb-2 mt-3">
          <span className="text-sm lg:text-lg font-semibold text-gray-900">
            {trimmedLine}
          </span>
        </div>
      );
      return;
    }
    // Regular content - add bullet point
    formattedLines.push(
      <div key={key++} className="mb-2 ml-4 text-gray-900">
        <span className="mr-2">•</span>
        <span className="text-sm lg:text-lg">{trimmedLine}</span>
      </div>
    );
  });

  return <>{formattedLines}</>;
}

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

  // Enable copy protection
  useCopyProtection();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "left" | "right"
  >("right");

  useEffect(() => {

    loadCaseNotes();
    // Extract case number from caseNumber string
    let match = caseNumber.match(/CQ-\d+-(\d+)/); // 2024 format: CQ-24-01
    if (!match) {
      match = caseNumber.match(/CS-\d+-[A-Z]-(\d+)/); // 2025 format: CS-25-A-01
    }
    if (!match) {
      match = caseNumber.match(/CR-\d+-(\d+)/); // 2023 format: CR-23-01
    }
    if (match) {
      setCaseNumberInt(parseInt(match[1]));
    }
    // Reset transition state when component loads
    setIsTransitioning(false);

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [caseNumber]);

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
      // Start fade out
      setIsTransitioning(true);

      let newCaseId: string;
      
      // Handle different case number formats
      if (caseNumber.startsWith('CQ-')) {
        // 2024 format: CQ-24-XX
        newCaseId = `CQ-${year.slice(-2)}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else if (caseNumber.startsWith('CS-')) {
        // 2025 format: CS-25-X-XX (extract subject letter)
        const parts = caseNumber.split('-');
        const subjectLetter = parts[2]; // A, B, C, etc.
        newCaseId = `CS-${year.slice(-2)}-${subjectLetter}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else if (caseNumber.startsWith('CR-')) {
        // 2023 format: CR-23-XX
        newCaseId = `CR-${year.slice(-2)}-${newCaseNumber.toString().padStart(2, "0")}`;
      } else {
        // Fallback
        newCaseId = caseNumber;
      }
      
      // Start preloading immediately
      DataLoader.preloadCaseData(year, newCaseId).catch(() => null);
      
      setTimeout(() => {
        router.push(`/contemporary-cases/${year}/${newCaseId}/notes`);
      }, 300); // Faster fade animation
    }
  };

  const loadCaseNotes = async () => {
    try {
      // Try to get cached data first
      const { data: cachedData, fromCache } = await DataLoader.loadCaseNotes(year, caseNumber);
      
      if (fromCache) {
        // Instant load from cache
        setCaseNotes(cachedData?.overall_content || 'No notes available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      if (cachedData?.overall_content) {
        setCaseNotes(cachedData.overall_content);
      } else {
        setCaseNotes(`Case notes for ${caseNumber} are not available yet. This case will be added soon.`);
      }




    } catch (error: any) {
      console.error("Error loading case notes:", error);
      setCaseNotes('Error loading case notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Wait for params to be ready
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
      {/* Dotted Background */}
      <DottedBackground />

      <div className="container mx-auto px-4 py-2">
        {/* Case Notes Card with White Background */}
        <div className="max-w-6xl mx-auto">
          <Card
            className={`bg-white shadow-2xl transition-all duration-300 ease-out ${
              isTransitioning
                ? 'opacity-0'
                : 'opacity-100 animate-in fade-in-0'
            }`}
          >
            <CardContent className="p-8 max-h-[calc(100vh-40px)] overflow-y-auto no-copy">
              {/* Case Header */}
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Exit fullscreen if currently in fullscreen
                        if (document.fullscreenElement) {
                          try {
                            await document.exitFullscreen();
                            setIsFullscreen(false);
                          } catch (error) {
                            console.error("Error exiting fullscreen:", error);
                          }
                        }
                        // Navigate back
                        router.push(
                          `/subjects?tab=contemporary-cases&year=${year}`
                        );
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
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
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

              {/* Case Content */}
              <div className="prose max-w-none animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                <div
                  className="text-sm lg:text-lg leading-relaxed"
                  style={{ wordBreak: "break-word" }}
                >
                  {formatCaseNotes(caseNotes, caseNumberInt)}
                </div>
              </div>

              {/* Take Quiz Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={() =>
                    router.push(
                      `/contemporary-cases/${year}/${caseNumber}/quiz`
                    )
                  }
                  className="w-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300"
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
