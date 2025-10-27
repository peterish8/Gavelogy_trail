"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  Zap,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useQuizStore } from "@/lib/stores/quiz";
import { validateQuizAnswer } from "@/lib/validation";

interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  confidence: "confident" | "guess" | "fluke" | null;
  timeSpent: number;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  order_index: number;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addMistake, clearMistakeByQuestionId, getActiveMistakes } =
    useMistakeStore();
  const { addAttempt } = useQuizStore();

  const topicName = searchParams.get("topic") || "";
  const quizId = searchParams.get("quizId") || "";
  const isReviewMode = searchParams.get("review") === "true";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
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
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!quizId) {
          setError("No quiz ID specified");
          return;
        }

        // Debug: Log the quizId being used
        console.log("Fetching questions for quizId:", quizId);

        // Test Supabase connection first
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log(
          "Supabase Key exists:",
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Test with a simple query first
        const { data: testData, error: testError } = await supabase
          .from("questions")
          .select("id")
          .limit(1);

        console.log("Test query result:", { testData, testError });

        if (testError) {
          console.error("Test query failed:", testError);
          setError(`Supabase connection failed: ${testError.message}`);
          return;
        }

        // Fetch questions from Supabase
        const { data: questionsData, error } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index");

        console.log("Supabase response:", { questionsData, error });

        if (error) {
          console.error("Error fetching questions:", error);
          setError(`Failed to load questions from database: ${error.message}`);
          return;
        }

        if (!questionsData || questionsData.length === 0) {
          setError(`No questions found for this quiz`);
          return;
        }

        let filteredQuestions = questionsData;

        if (isReviewMode) {
          // In review mode, only show questions that have mistakes
          const mistakes = getActiveMistakes();
          const wrongQuestionIds = mistakes
            .filter((m) => m.questionId)
            .map((m) => m.questionId);
          filteredQuestions = questionsData.filter((q) =>
            wrongQuestionIds.includes(q.id)
          );

          if (filteredQuestions.length === 0) {
            setError("No mistakes found for this topic to review");
            return;
          }
        }

        setQuestions(filteredQuestions);
        setQuestionStartTime(Date.now());
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("Failed to load questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [quizId, isReviewMode, getActiveMistakes]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback || isSubmitting) return;

    // Validate answer index
    const validation = validateQuizAnswer(answerIndex);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setSelectedAnswer(answerIndex);
  };

  const handleConfidenceSelect = (
    confidence: "confident" | "guess" | "fluke"
  ) => {
    if (!currentQuestion || selectedAnswer === null) return;

    const timeSpent = Date.now() - questionStartTime;
    const correctAnswer = currentQuestion.correct_answer;
    const userChoice = [
      currentQuestion.option_a,
      currentQuestion.option_b,
      currentQuestion.option_c,
      currentQuestion.option_d,
    ][selectedAnswer];

    const isCorrect = userChoice === correctAnswer;

    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      confidence,
      timeSpent,
    };

    setAnswers((prev) => [...prev, answer]);

    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowConfidence(false);
      setQuestionStartTime(Date.now());
    }
  };

  const completeQuiz = async () => {
    try {
      setIsSubmitting(true);

      if (isReviewMode) {
        // In review mode, clear mistakes for correctly answered questions
        const correctAnswers = answers.filter((answer) => answer.isCorrect);
        correctAnswers.forEach((answer) => {
          clearMistakeByQuestionId(answer.questionId);
        });
      } else {
        // In normal mode, add mistakes for wrong answers
        const wrongAnswers = answers.filter((answer) => !answer.isCorrect);
        wrongAnswers.forEach((answer) => {
          const question = questions.find((q) => q.id === answer.questionId);
          if (question) {
            addMistake({
              questionId: question.id,
              subject: "Jurisprudence", // This should be dynamic based on the quiz
              topic: topicName,
              question: question.question_text,
              userAnswer: [
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
              ][answer.selectedAnswer],
              correctAnswer: question.correct_answer,
              explanation: question.explanation || "No explanation provided",
            });
          }
        });
      }

      // Record quiz attempt
      const correctAnswers = answers.filter(
        (answer) => answer.isCorrect
      ).length;
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
      const wrongQuestions = answers
        .filter((answer) => !answer.isCorrect)
        .map((answer) => answer.questionId);

      const confidence: Record<string, "confident" | "guess" | "fluke"> = {};
      answers.forEach((answer) => {
        if (answer.confidence) {
          confidence[answer.questionId] = answer.confidence;
        }
      });

      addAttempt({
        subject: "Jurisprudence",
        topic: topicName,
        questions: questions.map((q) => q.id),
        answers: answers.reduce((acc, answer) => {
          acc[answer.questionId] = [
            questions.find((q) => q.id === answer.questionId)?.option_a || "",
            questions.find((q) => q.id === answer.questionId)?.option_b || "",
            questions.find((q) => q.id === answer.questionId)?.option_c || "",
            questions.find((q) => q.id === answer.questionId)?.option_d || "",
          ][answer.selectedAnswer];
          return acc;
        }, {} as Record<string, string>),
        correctAnswers: questions.reduce((acc, q) => {
          acc[q.id] = q.correct_answer;
          return acc;
        }, {} as Record<string, string>),
        score,
        totalQuestions: totalQuestions,
        timeSpent: timeSpent,
        wrongQuestions: wrongQuestions,
        confidence,
      });

      setIsCompleted(true);
    } catch (err) {
      console.error("Error completing quiz:", err);
      setError("Failed to complete quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      setError("Please select an answer before proceeding");
      return;
    }

    setShowFeedback(true);
    setShowConfidence(true);
  };

  const getAnswerColor = (index: number) => {
    if (!showFeedback) return "border-gray-200 hover:border-gray-300";
    if (index === selectedAnswer) {
      return answers[answers.length - 1]?.isCorrect
        ? "border-green-500 bg-green-50"
        : "border-red-500 bg-red-50";
    }
    if (showFeedback && currentQuestion) {
      const correctAnswer = currentQuestion.correct_answer;
      const options = [
        currentQuestion.option_a,
        currentQuestion.option_b,
        currentQuestion.option_c,
        currentQuestion.option_d,
      ];
      if (options[index] === correctAnswer) {
        return "border-green-500 bg-green-50";
      }
    }
    return "border-gray-200";
  };

  const getAnswerIcon = (index: number) => {
    if (!showFeedback) return null;
    if (index === selectedAnswer) {
      return answers[answers.length - 1]?.isCorrect ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      );
    }
    if (showFeedback && currentQuestion) {
      const correctAnswer = currentQuestion.correct_answer;
      const options = [
        currentQuestion.option_a,
        currentQuestion.option_b,
        currentQuestion.option_c,
        currentQuestion.option_d,
      ];
      if (options[index] === correctAnswer) {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      }
    }
    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading quiz..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/subjects")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion state
  if (isCompleted) {
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">
              Quiz Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-green-600">{score}%</div>
              <div className="text-sm text-gray-600">
                {correctAnswers} out of {totalQuestions} correct
              </div>
              <div className="text-sm text-gray-600">
                Time: {Math.floor(timeSpent / 60)}:
                {(timeSpent % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/subjects")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/subjects")}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {isReviewMode ? `${topicName} Review` : `${topicName} Quiz`}
                </h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{Math.floor((Date.now() - quizStartTime) / 1000)}s</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Answer Options */}
              <div className="space-y-3">
                {[
                  currentQuestion.option_a,
                  currentQuestion.option_b,
                  currentQuestion.option_c,
                  currentQuestion.option_d,
                ].map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback || isSubmitting}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 shadow-lg ${getAnswerColor(
                      index
                    )} ${showFeedback ? "cursor-default" : "hover:shadow-md"}`}
                    style={{
                      backgroundColor: showFeedback
                        ? index === selectedAnswer
                          ? answers[answers.length - 1]?.isCorrect
                            ? '#22c55e'
                            : '#dc2626'
                          : currentQuestion && [
                              currentQuestion.option_a,
                              currentQuestion.option_b,
                              currentQuestion.option_c,
                              currentQuestion.option_d,
                            ][index] === currentQuestion.correct_answer
                          ? '#22c55e'
                          : undefined
                        : selectedAnswer === index
                        ? '#3b82f6'
                        : undefined,
                      color: showFeedback
                        ? (index === selectedAnswer || (currentQuestion && [
                            currentQuestion.option_a,
                            currentQuestion.option_b,
                            currentQuestion.option_c,
                            currentQuestion.option_d,
                          ][index] === currentQuestion.correct_answer))
                          ? 'white'
                          : 'var(--foreground)'
                        : selectedAnswer === index
                        ? 'white'
                        : 'var(--foreground)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                      {getAnswerIcon(index)}
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <div className="flex space-x-2">
                  {showConfidence && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfidenceSelect("confident")}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1"
                      >
                        <Target className="w-4 h-4" />
                        <span>Confident</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfidenceSelect("guess")}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1"
                      >
                        <Brain className="w-4 h-4" />
                        <span>Educated Guess</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfidenceSelect("fluke")}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Fluke</span>
                      </Button>
                    </>
                  )}
                </div>

                {!showFeedback && (
                  <Button
                    onClick={handleNext}
                    disabled={selectedAnswer === null || isSubmitting}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" text="Processing..." />
                    ) : (
                      "Next"
                    )}
                  </Button>
                )}
              </div>

              {/* Feedback Message */}
              {showFeedback && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {answers[answers.length - 1]?.isCorrect
                      ? "Correct! Well done."
                      : "Incorrect. The correct answer is highlighted in green."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading quiz..." />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
