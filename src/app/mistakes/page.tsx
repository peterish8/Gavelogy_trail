"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
// AppHeader import removed
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Check, BookOpen } from "lucide-react";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { DottedBackground } from "@/components/DottedBackground";

export default function MistakesPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const router = useRouter();
  const { mistakes, loading, loadMistakes, markAsMastered } = useMistakeStore();
  const [activeTab, setActiveTab] = useState("static-subjects");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [selectedMistakes, setSelectedMistakes] = useState<Set<string>>(new Set());

  useCopyProtection();

  useEffect(() => {
    loadMistakes();
  }, []);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };



  const toggleCase = (caseId: string) => {
    setExpandedCases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  const toggleMistakeSelection = (mistakeId: string) => {
    setSelectedMistakes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mistakeId)) {
        newSet.delete(mistakeId);
      } else {
        newSet.add(mistakeId);
      }
      return newSet;
    });
  };

  const startRetakeQuiz = (mistakeIds: string[]) => {
    const selectedIds = mistakeIds.join(',');
    router.push(`/quiz/retake?mistakes=${selectedIds}`);
  };

  // Group mistakes by quiz type and subject
  const mistakesByType = {
    "static-subjects": mistakes.filter(m => m.subject && m.subject !== 'Contemporary Cases'),
    "contemporary-cases": mistakes.filter(m => m.subject === 'Contemporary Cases'),
    "pyqs": mistakes.filter(m => m.quiz_type === 'pyq'),
    "mock": mistakes.filter(m => m.quiz_type === 'mock')
  };

  // Group contemporary cases by year
  const contemporaryMistakesByYear = {
    "2023": mistakesByType["contemporary-cases"].filter(m => m.question_id.includes('-23-')),
    "2024": mistakesByType["contemporary-cases"].filter(m => m.question_id.includes('-24-')),
    "2025": mistakesByType["contemporary-cases"].filter(m => m.question_id.includes('-25-'))
  };





  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "white" }}>
        {/* AppHeader removed */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      {/* AppHeader removed */}
      
      <motion.div 
        className="container mx-auto px-4 py-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={item}>
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/subjects")}
              className="mr-3 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold">Mistake Tracking</h1>
          </div>
          <p className="text-muted-foreground ml-11">
            Review and retake your mistakes by subject and case
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          {/* Tab Pills */}
          <div className="grid grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            <motion.button
              onClick={() => setActiveTab("static-subjects")}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "static-subjects"
                  ? "bg-linear-to-r from-pink-200 to-purple-200 text-purple-800 shadow-lg border border-pink-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Static Subjects</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab("contemporary-cases")}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "contemporary-cases"
                  ? "bg-linear-to-r from-emerald-200 to-teal-200 text-emerald-800 shadow-lg border border-emerald-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Contemporary Cases</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab("pyqs")}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "pyqs"
                  ? "bg-linear-to-r from-purple-200 to-pink-200 text-purple-800 shadow-lg border border-purple-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">PYQ&apos;s</span>
            </motion.button>

            <button
              onClick={() => setActiveTab("mock")}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "mock"
                  ? "bg-linear-to-r from-orange-200 to-red-200 text-orange-800 shadow-lg border border-orange-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Mock</span>
            </button>
          </div>

          {/* Tab Contents */}
          <TabsContent value="static-subjects" className="mt-0">
            <div className="space-y-6">
              {mistakesByType["static-subjects"].length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Static Subject Mistakes</h3>
                    <p className="text-muted-foreground">Great job! No mistakes in static subjects yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Group by subject */}
                  {Object.entries(
                    mistakesByType["static-subjects"].reduce((acc, mistake) => {
                      const subject = mistake.subject || "Other";
                      if (!acc[subject]) acc[subject] = [];
                      acc[subject].push(mistake);
                      return acc;
                    }, {} as Record<string, typeof mistakes>)
                  ).map(([subject, subjectMistakes]) => {
                    const isExpanded = expandedSubjects.has(subject);
                    const selectedCount = subjectMistakes.filter(m => selectedMistakes.has(m.id)).length;
                    
                    return (
                      <Card key={subject} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4" onClick={() => toggleSubject(subject)}>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <h2 className="text-2xl font-bold text-gray-900">{subject}</h2>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                                {subjectMistakes.length} mistakes
                              </span>
                              {selectedCount > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                  {selectedCount} selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedCount > 0 && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRetakeQuiz(subjectMistakes.filter(m => selectedMistakes.has(m.id)).map(m => m.id));
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  Retake Selected ({selectedCount})
                                </Button>
                              )}
                              <div className="h-5 w-5 text-gray-600">
                                {isExpanded ? "▼" : "▶"}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3">
                              {subjectMistakes.map((mistake) => (
                                <Card key={mistake.id} className="border-l-4 border-l-red-300">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                      <button
                                        onClick={() => toggleMistakeSelection(mistake.id)}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                          selectedMistakes.has(mistake.id)
                                            ? "bg-blue-500 border-blue-500"
                                            : "border-gray-300 hover:border-blue-400"
                                        }`}
                                      >
                                        {selectedMistakes.has(mistake.id) && (
                                          <Check className="w-4 h-4 text-white" />
                                        )}
                                      </button>
                                      <h4 className="text-lg font-semibold">{mistake.question_text}</h4>
                                    </div>
                                    <div className="space-y-2 text-sm mb-2">
                                      <div>
                                        <div>Your Answer: <span className="text-red-600 font-medium">{mistake.user_answer.replace(/[()]/g, "")}</span></div>
                                        {mistake.user_answer_text && (
                                          <div className="text-red-600 ml-4">{mistake.user_answer_text.replace(/^[A-D][).]?\s*/, "")}</div>
                                        )}
                                      </div>
                                      <div>
                                        <div>Correct: <span className="text-green-600 font-medium">{mistake.correct_answer.replace(/[()]/g, "")}</span></div>
                                        {mistake.correct_answer_text && (
                                          <div className="text-green-600 ml-4">{mistake.correct_answer_text.replace(/^[A-D][).]?\s*/, "")}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                      Confidence: <span className={`px-2 py-1 rounded-full ${
                                        mistake.confidence_level === "confident" ? "bg-red-100 text-red-800" :
                                        mistake.confidence_level === "educated_guess" ? "bg-yellow-100 text-yellow-800" :
                                        "bg-orange-100 text-orange-800"
                                      }`}>
                                        {mistake.confidence_level === "confident" ? "Confident" :
                                         mistake.confidence_level === "educated_guess" ? "Educated Guess" : "Fluke"}
                                      </span>
                                    </div>
                                    {mistake.explanation && (
                                      <div className="text-sm text-gray-900 bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                                        <strong className="text-blue-800">Explanation:</strong> <span className="font-semibold">{mistake.explanation}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => markAsMastered(mistake.id)}
                                        disabled={mistake.is_mastered}
                                      >
                                        {mistake.is_mastered ? "Mastered" : "Mark Mastered"}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contemporary-cases" className="mt-0">
            <div className="space-y-6">

              {/* Year Cards */}
              {Object.entries(contemporaryMistakesByYear).map(([year, yearMistakes]) => {
                // Always show year cards even if empty
                const wrongAnswers = yearMistakes.filter(m => m.user_answer !== m.correct_answer.replace(/[()]/g, "").trim());
                const unsureAnswers = yearMistakes.filter(m => m.user_answer === m.correct_answer.replace(/[()]/g, "").trim());
                
                return (
                  <Card
                    key={year}
                    className={`overflow-hidden relative border-0 shadow-lg rounded-2xl bg-linear-to-br ${
                      year === "2023"
                        ? "from-blue-100 to-blue-200"
                        : year === "2024"
                        ? "from-emerald-100 to-emerald-200"
                        : "from-purple-100 to-purple-200"
                    } transition-all duration-300 backdrop-blur-sm ${
                      yearMistakes.length > 0 
                        ? "hover:shadow-xl cursor-pointer" 
                        : "opacity-60 cursor-default"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div 
                        className="mb-4 cursor-pointer"
                        onClick={() => toggleSubject(`year-${year}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-gray-900 ml-2">
                            {year}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {yearMistakes.length > 0 ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/mistakes/retake/${year}`);
                                  }}
                                  className="w-12 h-12 bg-linear-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                                >
                                  <span className="text-white font-bold text-lg">
                                    Q
                                  </span>
                                </button>
                                <div className="h-5 w-5 text-gray-600">
                                  {expandedSubjects.has(`year-${year}`) ? "▼" : "▶"}
                                </div>
                              </>
                            ) : (
                              <div className="h-5 w-5 text-gray-400">
                                ○
                              </div>
                            )}
                          </div>
                        </div>
                        {yearMistakes.length > 0 ? (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {wrongAnswers.length > 0 && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                {wrongAnswers.length} Mistakes
                              </span>
                            )}
                            {unsureAnswers.length > 0 && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                {unsureAnswers.length} Unsure
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm mt-2">
                            No mistakes yet
                          </div>
                        )}
                      </div>

                      {expandedSubjects.has(`year-${year}`) && yearMistakes.length > 0 && (
                        <div className="space-y-4">
                          {/* Group mistakes by case number */}
                          {Object.entries(
                            yearMistakes.reduce((acc, mistake) => {
                              const caseNumber = mistake.question_id.split('-')[2] || 'Unknown';
                              if (!acc[caseNumber]) acc[caseNumber] = [];
                              acc[caseNumber].push(mistake);
                              return acc;
                            }, {} as Record<string, typeof mistakes>)
                          )
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([caseNumber, caseMistakes]) => {
                            const caseId = `${year}-${caseNumber}`;
                            const isExpanded = expandedCases.has(caseId);
                            const wrongAnswers = caseMistakes.filter(m => m.user_answer !== m.correct_answer.replace(/[()]/g, "").trim());
                            const unsureAnswers = caseMistakes.filter(m => m.user_answer === m.correct_answer.replace(/[()]/g, "").trim());
                            
                            return (
                                <div key={caseNumber} className={`overflow-hidden relative border shadow-md rounded-xl transition-all duration-300 hover:shadow-lg p-4 ${
                                  year === "2023"
                                    ? "bg-linear-to-br from-blue-50 to-blue-100 border-blue-200"
                                    : year === "2024"
                                    ? "bg-linear-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                                    : "bg-linear-to-br from-purple-50 to-purple-100 border-purple-200"
                                }`}>
                                <div 
                                  className="flex items-center justify-between mb-4 cursor-pointer"
                                  onClick={() => toggleCase(caseId)}
                                >
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      Case {caseNumber}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      {wrongAnswers.length > 0 && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          {wrongAnswers.length} Mistakes
                                        </span>
                                      )}
                                      {unsureAnswers.length > 0 && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          {unsureAnswers.length} Unsure
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const caseQuestionIds = caseMistakes.map(m => m.id).join(',');
                                        router.push(`/quiz/retake?mistakes=${caseQuestionIds}`);
                                      }}
                                      className="w-8 h-8 bg-linear-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                                    >
                                      <span className="text-white font-bold text-xs">
                                        Q
                                      </span>
                                    </button>
                                    <div className="h-5 w-5 text-gray-600">
                                      {isExpanded ? "▼" : "▶"}
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="space-y-3">
                                    {caseMistakes
                                      .sort((a, b) => {
                                        if (!a.is_mastered && b.is_mastered) return -1;
                                        if (a.is_mastered && !b.is_mastered) return 1;
                                        const aIsWrong = a.user_answer !== a.correct_answer.replace(/[()]/g, "").trim();
                                        const bIsWrong = b.user_answer !== b.correct_answer.replace(/[()]/g, "").trim();
                                        if (aIsWrong && !bIsWrong) return -1;
                                        if (!aIsWrong && bIsWrong) return 1;
                                        return 0;
                                      })
                                      .map((mistake) => {
                                        const isWrongAnswer = mistake.user_answer !== mistake.correct_answer.replace(/[()]/g, "").trim();
                                        
                                        return (
                                          <Card key={mistake.id} className={`border-l-4 ${
                                            isWrongAnswer ? "border-l-red-300" : "border-l-yellow-300"
                                          } ${mistake.is_mastered ? 'opacity-60 bg-gray-100' : 'bg-white'}`}>
                                            <CardContent className="p-4">
                                              <h4 className={`text-lg font-semibold mb-2 ${
                                                mistake.is_mastered ? 'line-through text-gray-500' : ''
                                              }`}>{mistake.question_text}</h4>
                                              <div className="space-y-2 text-sm mb-2">
                                                <div>
                                                  <div>Your Answer: <span className={`${isWrongAnswer ? "text-red-600" : "text-green-600"} font-medium`}>{mistake.user_answer.replace(/[()]/g, "")}</span></div>
                                                  {mistake.user_answer_text && (
                                                    <div className={`${isWrongAnswer ? "text-red-600" : "text-green-600"} ml-4`}>{mistake.user_answer_text.replace(/^[A-D][).]?\s*/, "")}</div>
                                                  )}
                                                </div>
                                                <div>
                                                  <div>Correct Answer: <span className="text-green-600 font-medium">{mistake.correct_answer.replace(/[()]/g, "")}</span></div>
                                                  {mistake.correct_answer_text && (
                                                    <div className="text-green-600 ml-4">{mistake.correct_answer_text.replace(/^[A-D][).]?\s*/, "")}</div>
                                                  )}
                                                </div>
                                              </div>
                                              {!isWrongAnswer && (
                                                <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-2">
                                                  <strong>Note:</strong> Correct answer but marked as {mistake.confidence_level} - review for confidence
                                                </div>
                                              )}
                                              {mistake.explanation && (
                                                <div className="text-sm text-gray-900 bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                                                  <strong className="text-blue-800">Explanation:</strong> <span className="font-semibold">{mistake.explanation}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-end">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => markAsMastered(mistake.id)}
                                                >
                                                  {mistake.is_mastered ? "Unmark" : "Mark Mastered"}
                                                </Button>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pyqs" className="mt-0">
            <div className="space-y-6">
              {mistakesByType["pyqs"].length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No PYQ Mistakes</h3>
                    <p className="text-muted-foreground">Great job! No mistakes in previous year questions yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div>PYQ mistakes content here</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mock" className="mt-0">
            <div className="space-y-6">
              {mistakesByType["mock"].length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Mock Test Mistakes</h3>
                    <p className="text-muted-foreground">Great job! No mistakes in mock tests yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div>Mock test mistakes content here</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}