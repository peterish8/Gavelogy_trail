"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DottedBackground } from "@/components/DottedBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useStreakStore } from "@/lib/stores/streaks";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { useAuthStore } from "@/lib/stores/auth";
import { supabase } from "@/lib/supabase";

interface PYQQuestion {
  id: number;
  passage_number: number;
  passage?: string;
  question_no: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export default function PYQMockExamPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateStreak } = useStreakStore();

  // Enable copy protection
  useCopyProtection();

  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(
    new Set()
  );
  const [timeRemaining, setTimeRemaining] = useState(180 * 60); // 3 hours in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>(
    {}
  );
  const [currentQuestionTime, setCurrentQuestionTime] =
    useState<string>("00:00");
  const [warningCount, setWarningCount] = useState<number>(0);
  const [isTabFocused, setIsTabFocused] = useState<boolean>(true);

  const resolvedParams = React.use(params);
  const year = resolvedParams.year;

  // Define currentQuestion early to avoid initialization error
  const currentQuestion = questions[currentQuestionIndex];
  const currentPassage = currentQuestion?.passage;

  useEffect(() => {
    fetchQuestions();

    // Try to enter fullscreen when exam starts (may fail due to permissions)
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (error) {
        console.log("Fullscreen request failed:", error);
        // Continue without fullscreen
        setIsFullscreen(false);
      }
    };

    requestFullscreen();

    // Anti-cheating measures
    const preventCheating = () => {
      // COMPLETELY DISABLE anti-cheating for development
      console.log("PYQ Mock - Current hostname:", window.location.hostname);
      const isDevelopment = true; // Force disable for now

      if (isDevelopment) {
        console.log(
          "Anti-cheating COMPLETELY DISABLED for development:",
          window.location.hostname
        );
        return;
      }

      // Disable right-click context menu
      document.addEventListener("contextmenu", (e) => e.preventDefault());

      // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P
      document.addEventListener("keydown", (e) => {
        // Disable F12 (Developer Tools)
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === "u") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+S (Save Page)
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+A (Select All)
        if (e.ctrlKey && e.key === "a") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+P (Print)
        if (e.ctrlKey && e.key === "p") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+N (New Window)
        if (e.ctrlKey && e.key === "n") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+T (New Tab)
        if (e.ctrlKey && e.key === "t") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+W (Close Tab)
        if (e.ctrlKey && e.key === "w") {
          e.preventDefault();
          return false;
        }

        // Disable Alt+Tab (Switch Windows)
        if (e.altKey && e.key === "Tab") {
          e.preventDefault();
          return false;
        }

        // Disable Ctrl+Tab (Switch Tabs)
        if (e.ctrlKey && e.key === "Tab") {
          e.preventDefault();
          return false;
        }

        // Handle ESC key (Exit Fullscreen) - Add to warning count
        if (e.key === "Escape") {
          e.preventDefault();
          setWarningCount((prev) => {
            const newCount = prev + 1;

            if (newCount === 1) {
              alert(
                "⚠️ FIRST WARNING (1/3)\n\nYou pressed ESC to exit fullscreen.\nThis is not allowed during the exam.\n\nNext violation will result in your second warning."
              );
            } else if (newCount === 2) {
              alert(
                "⚠️ SECOND WARNING (2/3)\n\nYou pressed ESC AGAIN to exit fullscreen.\nThis is your second violation.\n\nOne more violation will result in automatic exam submission."
              );
            } else if (newCount >= 3) {
              alert(
                "🚨 FINAL WARNING - EXAM TERMINATED\n\nYou have violated exam rules multiple times.\nYour exam is being submitted automatically.\n\nThis is your final warning - exam will now end."
              );
              setTimeout(() => {
                handleSubmit();
              }, 2000);
            }

            return newCount;
          });
          return false;
        }
      });

      // Disable text selection
      document.addEventListener("selectstart", (e) => e.preventDefault());

      // Disable drag and drop
      document.addEventListener("dragstart", (e) => e.preventDefault());

      // Disable copy/paste
      document.addEventListener("copy", (e) => e.preventDefault());
      document.addEventListener("paste", (e) => e.preventDefault());
      document.addEventListener("cut", (e) => e.preventDefault());
    };

    preventCheating();

    // Enhanced focus detection and warning system
    const handleFocusChange = () => {
      if (document.hidden || !document.hasFocus()) {
        setIsTabFocused(false);
        setWarningCount((prev) => {
          const newCount = prev + 1;

          if (newCount === 1) {
            alert(
              "⚠️ FIRST WARNING (1/3)\n\nYou have switched tabs or opened another application.\nThis is not allowed during the exam.\n\nNext violation will result in your second warning."
            );
          } else if (newCount === 2) {
            alert(
              "⚠️ SECOND WARNING (2/3)\n\nYou have switched tabs or opened another application AGAIN.\nThis is your second violation.\n\nOne more violation will result in automatic exam submission."
            );
          } else if (newCount >= 3) {
            alert(
              "🚨 FINAL WARNING - EXAM TERMINATED\n\nYou have violated exam rules multiple times.\nYour exam is being submitted automatically.\n\nThis is your final warning - exam will now end."
            );
            setTimeout(() => {
              handleSubmit();
            }, 2000);
          }

          return newCount;
        });
      } else {
        setIsTabFocused(true);
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleFocusChange);
    window.addEventListener("blur", handleFocusChange);
    window.addEventListener("focus", handleFocusChange);

    // Get battery level
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));

        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [year]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });

      // Update current question time
      setCurrentQuestionTime(getCurrentQuestionTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [questionStartTime, questionTimes, currentQuestionIndex]);

  // Track time spent on each question
  useEffect(() => {
    const currentQuestionNo = currentQuestion?.question_no;
    if (!currentQuestionNo) return;

    // Save time spent on previous question
    if (questionStartTime) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes((prev) => ({
        ...prev,
        [currentQuestionNo]: (prev[currentQuestionNo] || 0) + timeSpent,
      }));
    }

    // Start timer for current question
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("pyq_2020_questions")
        .select("*")
        .order("question_no");

      if (error) {
        console.error("Error fetching questions:", error);
        return;
      }

      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")} : ${minutes
      .toString()
      .padStart(2, "0")} : ${secs.toString().padStart(2, "0")}`;
  };

  const toggleMarkForReview = () => {
    const currentQuestionNo = currentQuestion.question_no;
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionNo)) {
        newSet.delete(currentQuestionNo);
      } else {
        newSet.add(currentQuestionNo);
      }
      return newSet;
    });
  };

  const getCurrentQuestionTime = () => {
    const currentQuestionNo = currentQuestion?.question_no;
    if (!currentQuestionNo) return "00:00";

    const previousTime = questionTimes[currentQuestionNo] || 0;
    const currentTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const totalTime = previousTime + currentTime;

    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    setIsSubmitted(true);

    // Calculate score
    let correct = 0;
    let total = questions.length;

    questions.forEach((question) => {
      const userAnswer = answers[question.question_no];
      if (userAnswer === question.correct_answer) {
        correct++;
      }
    });

    const score = correct;
    const percentage = (correct / total) * 100;

    // Store results in localStorage for results page
    const results = {
      score,
      total,
      percentage,
      correct,
      incorrect: total - correct,
      unanswered: total - Object.keys(answers).length,
      answers,
      questions,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem("pyq-mock-results", JSON.stringify(results));
    }

    // Update user streak
    await updateStreak("pyq", correct * 5); // 5 points per correct PYQ answer

    // Redirect to results page
    router.push(`/pyq/${year}/results`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DottedBackground />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DottedBackground />
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            No questions found for PYQ {year}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      {/* Top Header Bar - AILET Style */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
            <h1 className="text-xl font-bold">PYQ {year} Mock Exam</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Test Instructions</div>
            <div className="text-sm font-medium text-red-600">
              Time Left: {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-600">{batteryLevel}% 🔋</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* Left Panel - Question Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {/* Navigation Bar */}
          <div className="border-b px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="text-blue-600 font-medium">Questions</span>
            </div>
          </div>

          {/* Question Details Bar */}
          <div className="border-b px-6 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  Question-{currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-600">
                  Marking Scheme: +1 -0.25
                </span>
                <span className="text-sm text-gray-600">
                  {currentQuestionTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMarkForReview}
                  className={`px-3 py-1 text-sm border rounded hover:bg-gray-50 ${
                    markedForReview.has(currentQuestion.question_no)
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300"
                  }`}
                >
                  {markedForReview.has(currentQuestion.question_no)
                    ? "Marked for Review"
                    : "Mark for review"}
                </button>
                <button className="px-2 py-1 text-gray-600">⋯</button>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6 no-copy">
            {/* Passage */}
            {currentPassage && currentPassage.trim() !== "" && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold mb-2">
                  Passage {currentQuestion.passage_number}
                </h3>
                <p className="whitespace-pre-wrap text-sm">{currentPassage}</p>
              </div>
            )}

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-lg leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {["A", "B", "C", "D"].map((option) => {
                const optionKey =
                  `option_${option.toLowerCase()}` as keyof PYQQuestion;
                const optionText = currentQuestion[optionKey] as string;
                const isSelected =
                  answers[currentQuestion.question_no] === option;

                return (
                  <label
                    key={option}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.question_no}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => {
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.question_no]: option,
                        }));
                      }}
                      className="mt-1"
                    />
                    <span className="font-medium">{option}.</span>
                    <span className="flex-1">{optionText}</span>
                  </label>
                );
              })}
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    prev > 0 ? prev - 1 : prev
                  )
                }
                disabled={currentQuestionIndex === 0}
                className="px-6"
              >
                ← Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    prev < questions.length - 1 ? prev + 1 : prev
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-6"
              >
                Save & Next →
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow-sm">
          <div className="p-4 no-copy">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
              <span className="font-medium">User</span>
            </div>

            {/* Test Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">
                  Questions: {questions.length}
                </span>
                <button className="text-sm text-blue-600 hover:underline">
                  Section Instructions
                </button>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>
                    {questions.filter((q) => !answers[q.question_no]).length}{" "}
                    Not Answered
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>
                    {questions.filter((q) => answers[q.question_no]).length}{" "}
                    Answered
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                  <span>{markedForReview.size} Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>
                    {questions.length -
                      questions.filter((q) => answers[q.question_no])
                        .length}{" "}
                    Not Visited
                  </span>
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Questions</h3>
              <div className="max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const questionNo = q.question_no || q.question_number || 0;
                    const isAnswered = answers[questionNo];
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={`question-${questionNo}-${index}`}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          w-10 h-10 rounded text-sm font-medium transition-all border-2
                          ${
                            isCurrent
                              ? "bg-blue-600 text-white border-blue-600"
                              : ""
                          }
                          ${
                            isAnswered && !isCurrent
                              ? "bg-green-100 text-green-700 border-green-300"
                              : ""
                          }
                          ${
                            !isAnswered && !isCurrent
                              ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                              : ""
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
