"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useMistakeStore } from "@/lib/stores/mistakes";

export default function RetakeQuizPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const router = useRouter();
  const { year } = use(params);
  const { mistakes, loadMistakes, clearMistakeByQuestionId } = useMistakeStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Filter mistakes for this year
  const yearMistakes = mistakes.filter(m => 
    m.subject === 'Contemporary Cases' && 
    m.question_id.includes(`-${year.slice(-2)}-`)
  );

  useEffect(() => {
    loadMistakes();
  }, []);

  const currentMistake = yearMistakes[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentMistake) return;

    const isCorrect = selectedAnswer === currentMistake.correct_answer.replace(/[()]/g, "").trim();
    
    const result = {
      questionId: currentMistake.question_id,
      isCorrect,
      selectedAnswer,
    };

    setResults(prev => [...prev, result]);

    // If correct, remove from mistakes
    if (isCorrect) {
      clearMistakeByQuestionId(currentMistake.question_id);
    }

    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < yearMistakes.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    const correctCount = results.filter(r => r.isCorrect).length;
    
    return (
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Retake Quiz Completed!</h2>
              <p className="text-gray-600 mb-6">
                You got {correctCount} out of {results.length} questions correct.
              </p>
              <Button onClick={() => router.push("/mistakes")} className="w-full">
                Back to Mistakes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentMistake) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">No Mistakes to Retake</h2>
              <p className="text-gray-600 mb-6">Great job! No mistakes found for {year}.</p>
              <Button onClick={() => router.push("/mistakes")}>
                Back to Mistakes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/mistakes")}
            className="md:mb-0"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="hidden md:inline">Back to Mistakes</span>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Retake Quiz - {year}</h1>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6">
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {yearMistakes.length}</p>
            </div>

            <h2 className="text-xl font-semibold mb-6">
              {currentMistake.question_text}
            </h2>

            <div className="space-y-3 mb-6">
              {["A", "B", "C", "D"].map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentMistake.correct_answer.replace(/[()]/g, "").trim();
                const isWrongAnswer = isSelected && !isCorrectAnswer;

                let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";

                if (showFeedback) {
                  if (isCorrectAnswer) {
                    buttonClass += "border-green-500 bg-green-50";
                  } else if (isWrongAnswer) {
                    buttonClass += "border-red-500 bg-red-50";
                  } else {
                    buttonClass += "border-gray-200";
                  }
                } else {
                  buttonClass += isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={buttonClass}
                    disabled={showFeedback}
                  >
                    <span className="font-medium text-gray-900">
                      {option}. Option {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer && !showFeedback && (
              <Button onClick={handleSubmitAnswer} className="w-full">
                Submit Answer
              </Button>
            )}

            {showFeedback && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  results[results.length - 1]?.isCorrect
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center mb-2">
                    {results[results.length - 1]?.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-semibold ${
                      results[results.length - 1]?.isCorrect
                        ? "text-green-800"
                        : "text-red-800"
                    }`}>
                      {results[results.length - 1]?.isCorrect
                        ? "Correct! Removed from mistakes."
                        : "Still incorrect - stays in mistakes."}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Correct Answer:</strong> {currentMistake.correct_answer_text || currentMistake.correct_answer}
                  </p>
                  {currentMistake.explanation && (
                    <p className="text-gray-700 mt-2">
                      <strong>Explanation:</strong> {currentMistake.explanation}
                    </p>
                  )}
                </div>

                <Button onClick={nextQuestion} className="w-full">
                  {currentQuestionIndex < yearMistakes.length - 1 ? "Next Question" : "Complete Quiz"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}