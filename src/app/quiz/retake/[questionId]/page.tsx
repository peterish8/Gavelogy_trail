"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Target,
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  subject: string;
  quiz_title: string;
}

export default function RetakeQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const router = useRouter();
  const { questionId } = use(params);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState<
    "confident" | "guess" | "fluke" | null
  >(null);
  const [showResult, setShowResult] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Demo question data
  const loadQuestion = async () => {
    try {
      // Demo mode - use mock data
      if (process.env.NODE_ENV === "development") {
        const mockQuestion: Question = {
          id: questionId,
          question_text:
            "Which Article of the Indian Constitution deals with the Right to Equality?",
          option_a: "Article 14",
          option_b: "Article 19",
          option_c: "Article 21",
          option_d: "Article 32",
          correct_answer: "A",
          explanation:
            "Article 14 guarantees equality before law and equal protection of laws to all persons within the territory of India.",
          subject: "Constitutional Law",
          quiz_title: "Fundamental Rights - Part 1",
        };

        setQuestion(mockQuestion);
        setStartTime(Date.now());
        setLoading(false);
        return;
      }

      // TODO: Implement actual Supabase fetch
      // const { data, error } = await supabase
      //   .from('questions')
      //   .select('*')
      //   .eq('id', params.questionId)
      //   .single();
    } catch (error) {
      console.error("Error loading question:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  useEffect(() => {
    if (startTime > 0) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime]);

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleRetake = () => {
    setSelectedAnswer("");
    setConfidence(null);
    setShowResult(false);
    setTimeSpent(0);
    setStartTime(Date.now());
  };

  const handleBackToMistakes = () => {
    router.push("/mistakes");
  };

  const isCorrect = selectedAnswer === question?.correct_answer;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Question Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The question you&apos;re looking for doesn&apos;t exist or has
                been removed.
              </p>
              <Button onClick={handleBackToMistakes}>Back to Mistakes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleBackToMistakes}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mistakes
                </Button>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time: {timeSpent}s</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Result Header */}
              <div className="text-center">
                <div
                  className={`text-6xl mb-4 ${
                    isCorrect ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isCorrect ? "🎉" : "😔"}
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {isCorrect ? "Correct!" : "Incorrect"}
                </h2>
                <p className="text-muted-foreground">
                  {isCorrect
                    ? "Great job! You got it right this time."
                    : "Keep practicing! This is how you learn."}
                </p>
              </div>

              {/* Question Review */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {question.subject}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {question.quiz_title}
                    </span>
                  </div>
                  <CardTitle>{question.question_text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { key: "A", text: question.option_a },
                      { key: "B", text: question.option_b },
                      { key: "C", text: question.option_c },
                      { key: "D", text: question.option_d },
                    ].map((option) => {
                      const isUserAnswer = option.key === selectedAnswer;
                      const isCorrectAnswer =
                        option.key === question.correct_answer;

                      return (
                        <div
                          key={option.key}
                          className={`p-3 border rounded-lg ${
                            isCorrectAnswer
                              ? "border-green-500 bg-green-50 text-green-800"
                              : isUserAnswer && !isCorrectAnswer
                              ? "border-red-500 bg-red-50 text-red-800"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {option.key}. {option.text}
                            </span>
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              {isCorrectAnswer && (
                                <span className="text-xs font-medium">
                                  Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="text-xs font-medium">
                                  Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="mt-6 p-4 rounded-lg border bg-yellow-200 dark:bg-yellow-300/20 border-yellow-500">
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      Explanation:
                    </h4>
                    <p style={{ color: 'var(--foreground)' }}>
                      {question.explanation}
                    </p>
                  </div>

                  {/* Confidence Analysis */}
                  {confidence && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        Confidence Analysis:
                      </h4>
                      <div className="flex items-center gap-2">
                        {confidence === "confident" && (
                          <Target className="h-4 w-4 text-green-600" />
                        )}
                        {confidence === "guess" && (
                          <Target className="h-4 w-4 text-yellow-600" />
                        )}
                        {confidence === "fluke" && (
                          <Target className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-orange-700 dark:text-orange-300">
                          You were{" "}
                          {confidence === "confident"
                            ? "confident"
                            : confidence === "guess"
                            ? "guessing"
                            : "completely unsure"}{" "}
                          about this answer.
                          {!isCorrect &&
                            confidence === "confident" &&
                            " This confident mistake is particularly valuable for learning!"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button size="lg" onClick={handleRetake}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Retake Question
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBackToMistakes}
                >
                  Back to Mistakes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBackToMistakes}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mistakes
              </Button>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{timeSpent}s</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Retake Question
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Info */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {question.subject}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                {question.quiz_title}
              </span>
            </div>

            {/* Question */}
            <div>
              <h2 className="text-xl font-semibold mb-6">
                {question.question_text}
              </h2>

              <div className="space-y-3">
                {[
                  { key: "A", text: question.option_a },
                  { key: "B", text: question.option_b },
                  { key: "C", text: question.option_c },
                  { key: "D", text: question.option_d },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedAnswer(option.key)}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all shadow-lg ${
                      selectedAnswer === option.key
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    style={{
                      backgroundColor: selectedAnswer === option.key ? '#3b82f6' : undefined,
                      color: selectedAnswer === option.key ? 'white' : 'var(--foreground)'
                    }}
                  >
                    <span className="font-medium mr-3">{option.key}.</span>
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Selection */}
            {selectedAnswer && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-3">
                  How confident are you about this answer?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfidence("confident")}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      confidence === "confident"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border hover:border-green-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">😊</div>
                      <div className="font-medium">Confident</div>
                      <div className="text-xs text-muted-foreground">
                        I&apos;m certain this is correct
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setConfidence("guess")}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      confidence === "guess"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-border hover:border-yellow-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🤔</div>
                      <div className="font-medium">Educated Guess</div>
                      <div className="text-xs text-muted-foreground">
                        I think this is right
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setConfidence("fluke")}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      confidence === "fluke"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-border hover:border-red-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎲</div>
                      <div className="font-medium">Fluke</div>
                      <div className="text-xs text-muted-foreground">
                        I guessed randomly
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!selectedAnswer || !confidence}
              >
                Submit Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
