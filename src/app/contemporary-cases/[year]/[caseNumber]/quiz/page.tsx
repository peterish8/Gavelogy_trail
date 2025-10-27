"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Clock, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuizStore } from "@/lib/stores/quiz";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useStreakStore } from "@/lib/stores/streaks";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { DataLoader } from "@/lib/data-loader";

interface ContemporaryQuizQuestion {
  id: string;
  case_number: string;
  case_name: string;
  passage: string;
  case_question_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  confidence: "confident" | "guess" | "fluke";
  isCorrect: boolean;
  timeSpent: number;
}

export default function ContemporaryQuizPage({
  params,
}: {
  params: Promise<{ year: string; caseNumber: string }>;
}) {
  const router = useRouter();
  const { year, caseNumber } = use(params);
  const { addAttempt } = useQuizStore();
  const { addMistake, clearMistakeByQuestionId } = useMistakeStore();
  const { updateStreak } = useStreakStore();

  // Enable copy protection
  useCopyProtection();

  const [questions, setQuestions] = useState<ContemporaryQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [quizStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuizQuestions();
  }, [caseNumber]);

  const loadQuizQuestions = async () => {
    try {
      // Try to get cached data first
      const { data: cachedData, fromCache } = await DataLoader.loadQuizQuestions(caseNumber);
      
      if (fromCache && cachedData?.length > 0) {
        // Instant load from cache
        setQuestions(cachedData);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      if (cachedData?.length > 0) {
        setQuestions(cachedData);
      } else {
        setError('No quiz questions found for this case.');
      }
    } catch (error: any) {
      console.error("Error loading quiz questions:", error);
      setError('Error loading quiz questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    // Clean the correct answer to remove parentheses and extra characters
    const cleanCorrectAnswer = currentQuestion.correct_answer
      .replace(/[()]/g, "")
      .trim();
    const cleanSelectedAnswer = selectedAnswer.trim();
    const isCorrect = cleanSelectedAnswer === cleanCorrectAnswer;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    console.log("Answer validation:", {
      selectedAnswer: cleanSelectedAnswer,
      correctAnswer: cleanCorrectAnswer,
      isCorrect,
      originalCorrectAnswer: currentQuestion.correct_answer,
    });

    const answer: QuizAnswer = {
      questionId: currentQuestion.case_question_id,
      selectedAnswer,
      confidence: "confident", // Default confidence
      isCorrect,
      timeSpent,
    };

    setAnswers((prev) => [...prev, answer]);

    // Handle mistakes
    if (!isCorrect) {
      // Get full option text
      const options = {
        'A': currentQuestion.option_a,
        'B': currentQuestion.option_b,
        'C': currentQuestion.option_c,
        'D': currentQuestion.option_d
      };
      
      const userAnswerText = `${selectedAnswer}. ${options[selectedAnswer as keyof typeof options]}` || selectedAnswer;
      const correctAnswerText = `${cleanCorrectAnswer}. ${options[cleanCorrectAnswer as keyof typeof options]}` || currentQuestion.correct_answer;
      
      addMistake({
        questionId: currentQuestion.case_question_id,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correct_answer,
        userAnswer: selectedAnswer,
        userAnswerText: userAnswerText,
        correctAnswerText: correctAnswerText,
        explanation: currentQuestion.explanation,
        subject: "Contemporary Cases",
        topic: currentQuestion.case_name,
      });
    } else {
      clearMistakeByQuestionId(currentQuestion.case_question_id);
    }

    setShowFeedback(true);
  };

  const handleConfidenceSelect = (
    confidence: "confident" | "guess" | "fluke"
  ) => {
    const currentAnswer = answers[answers.length - 1];
    if (currentAnswer) {
      currentAnswer.confidence = confidence;
      setAnswers((prev) => [...prev.slice(0, -1), currentAnswer]);
      
      // Add to mistakes if correct but not confident
      if (currentAnswer.isCorrect && (confidence === "guess" || confidence === "fluke")) {
        const currentQuestion = questions[currentQuestionIndex];
        const options = {
          'A': currentQuestion.option_a,
          'B': currentQuestion.option_b,
          'C': currentQuestion.option_c,
          'D': currentQuestion.option_d
        };
        
        const userAnswerText = `${currentAnswer.selectedAnswer}. ${options[currentAnswer.selectedAnswer as keyof typeof options]}` || currentAnswer.selectedAnswer;
        const correctAnswerText = `${currentQuestion.correct_answer.replace(/[()]/g, "").trim()}. ${options[currentQuestion.correct_answer.replace(/[()]/g, "").trim() as keyof typeof options]}` || currentQuestion.correct_answer;
        
        addMistake({
          questionId: currentQuestion.case_question_id,
          question: currentQuestion.question,
          correctAnswer: currentQuestion.correct_answer,
          userAnswer: currentAnswer.selectedAnswer,
          userAnswerText: userAnswerText,
          correctAnswerText: correctAnswerText,
          explanation: currentQuestion.explanation,
          subject: "Contemporary Cases",
          topic: currentQuestion.case_name,
        });
      }
    }
    setShowConfidence(false);
    setShowFeedback(false);
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    try {
      setIsSubmitting(true);

      const totalQuestions = questions.length;
      const correctAnswers = answers.filter((a) => a.isCorrect).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
      const accuracy = score;

      // Add quiz attempt
      const attemptId = await addAttempt({
        subject: "Contemporary Cases",
        topic: currentQuestion.case_name,
        questions: questions.map((q) => q.case_question_id),
        answers: answers.reduce(
          (acc, a) => ({ ...acc, [a.questionId]: a.selectedAnswer }),
          {}
        ),
        correctAnswers: questions.reduce(
          (acc, q) => ({ ...acc, [q.case_question_id]: q.correct_answer }),
          {}
        ),
        score: correctAnswers,
        totalQuestions,
        timeSpent: timeTaken,
        wrongQuestions: answers
          .filter((a) => !a.isCorrect)
          .map((a) => a.questionId),
        confidence: answers.reduce(
          (acc, a) => ({ ...acc, [a.questionId]: a.confidence }),
          {}
        ),
        quizId: `contemporary-${caseNumber}`,
        accuracy,
        detailedAnswers: answers.map((a) => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          confidence: a.confidence,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
        })),
      });

      // Streak functionality disabled

      setIsCompleted(true);
    } catch (error) {
      console.error("Error completing quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowConfidence(false);
    setIsCompleted(false);
    setQuestionStartTime(Date.now());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/subjects?tab=contemporary-cases&year=${year}`)
            }
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contemporary Cases
          </Button>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center no-copy">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Error Loading Quiz
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={loadQuizQuestions}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);

    return (
      <div className="min-h-screen relative">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/subjects?tab=contemporary-cases&year=${year}`)
            }
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contemporary Cases
          </Button>

          {/* Quiz Title */}
          {questions.length > 0 && questions[0].case_name && (
            <div className="max-w-2xl mx-auto mb-6">
              <h1 className="text-2xl font-bold text-gray-900 text-center">
                {questions[0].case_name}
              </h1>
              <p className="text-center text-gray-600 mt-2">{caseNumber}</p>
            </div>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center no-copy">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Quiz Completed!
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {score}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {timeTaken}s
                  </div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>
              <div className="space-y-3">
                <Button onClick={restartQuiz} className="w-full">
                  Retake Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/contemporary-cases/${year}/${caseNumber}/notes`
                    )
                  }
                  className="w-full"
                >
                  View Case Notes
                </Button>
              </div>

              {/* Next Case Navigation */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-3">
                  Continue Learning
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Extract the case number and increment it
                      const caseNum = parseInt(caseNumber.split("-")[2]);
                      const nextCaseNum = caseNum + 1;
                      const nextCase = caseNumber.replace(
                        /\d+$/,
                        String(nextCaseNum).padStart(2, "0")
                      );
                      router.push(
                        `/contemporary-cases/${year}/${nextCase}/notes`
                      );
                    }}
                    className="w-full"
                  >
                    Next Case Notes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Extract the case number and increment it
                      const caseNum = parseInt(caseNumber.split("-")[2]);
                      const nextCaseNum = caseNum + 1;
                      const nextCase = caseNumber.replace(
                        /\d+$/,
                        String(nextCaseNum).padStart(2, "0")
                      );
                      router.push(
                        `/contemporary-cases/${year}/${nextCase}/quiz`
                      );
                    }}
                    className="w-full"
                  >
                    Next Case Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen relative">
      <DottedBackground />
      <Header />

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start gap-4 mb-4">
          {/* Back Button - Left side */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/subjects?tab=contemporary-cases&year=${year}`)
            }
            className="p-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Quiz Header - Right side */}
          <Card className="flex-1">
            <CardContent className="p-4 no-copy">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {currentQuestion.case_name}
                </h1>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Case: {caseNumber} • Year: {year}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="mb-4">
          <CardContent className="p-6 no-copy">
            {/* Passage */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Case Passage:
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {currentQuestion.passage}
              </p>
            </div>

            {/* Question */}
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-stretch">
              {[
                { key: "A", value: currentQuestion.option_a },
                { key: "B", value: currentQuestion.option_b },
                { key: "C", value: currentQuestion.option_c },
                { key: "D", value: currentQuestion.option_d },
              ].map((option) => {
                const isSelected = selectedAnswer === option.key;
                const isCorrectAnswer =
                  option.key ===
                  currentQuestion.correct_answer.replace(/[()]/g, "").trim();
                const isWrongAnswer = isSelected && !isCorrectAnswer;

                let buttonClass =
                  "p-4 text-left rounded-lg border-2 transition-all min-h-[80px] flex items-start h-full shadow-lg ";

                let textColor = "";
                if (showFeedback) {
                  if (isCorrectAnswer) {
                    buttonClass += "!border-black";
                    textColor = "color: white;";
                  } else if (isWrongAnswer) {
                    buttonClass += "!border-black";
                    textColor = "color: white;";
                  } else {
                    buttonClass += "border-gray-200 dark:border-gray-600";
                    textColor = "color: var(--foreground);";
                  }
                } else {
                  if (isSelected) {
                    buttonClass += "border-blue-500 bg-blue-500 dark:bg-blue-800";
                    textColor = "color: white;";
                  } else {
                    buttonClass += "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500";
                    textColor = "color: var(--foreground);";
                  }
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(option.key)}
                    className={buttonClass}
                    disabled={showFeedback}
                    style={{ 
                      backgroundColor: showFeedback 
                        ? isCorrectAnswer ? '#22c55e' : isWrongAnswer ? '#dc2626' : undefined
                        : undefined,
                      color: showFeedback 
                        ? (isCorrectAnswer || isWrongAnswer) ? 'white' : 'var(--foreground)'
                        : isSelected ? 'white' : 'var(--foreground)' 
                    }}
                  >
                    <span className="font-medium">
                      {option.key}. {option.value}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            {selectedAnswer && !showFeedback && (
              <Button onClick={handleSubmitAnswer} className="w-full">
                Submit Answer
              </Button>
            )}

            {/* Feedback */}
            {showFeedback && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg border bg-yellow-200 dark:bg-yellow-300/20 border-yellow-500"
                >
                  <div className="flex items-center mb-2">
                    {answers[answers.length - 1]?.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {answers[answers.length - 1]?.isCorrect
                        ? "Perfect! Correct Answer!"
                        : "Incorrect"}
                    </span>
                  </div>
                  <p style={{ color: 'var(--foreground)' }}>
                    <strong>Correct Answer:</strong>{" "}
                    {currentQuestion.correct_answer}
                  </p>
                  <p style={{ color: 'var(--foreground)' }} className="mt-2">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                </div>

                {!showConfidence && (
                  <div className="text-center">
                    <Button onClick={() => setShowConfidence(true)}>
                      Continue
                    </Button>
                  </div>
                )}

                {showConfidence && (
                  <div className="space-y-3">
                    <h3 className="font-semibold !text-gray-900 dark:!text-white text-center">
                      How confident were you in this answer?
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleConfidenceSelect("confident")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Confident
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleConfidenceSelect("guess")}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        Guess
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleConfidenceSelect("fluke")}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Fluke
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
