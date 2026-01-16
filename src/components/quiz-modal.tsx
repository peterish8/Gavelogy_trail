"use client";

import { useState, useEffect } from "react";
import { AttachedQuiz, QuizQuestion } from "@/lib/quiz-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { useStreakStore } from "@/lib/stores/streaks";
import confetti from "canvas-confetti";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: AttachedQuiz | null;
}

export function QuizModal({ isOpen, onClose, quiz }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  const { awardDailyPoint, updateStreak } = useStreakStore();

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const totalQuestions = quiz?.questions.length || 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Reset state when quiz opens/changes
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setShowResults(false);
    }
  }, [isOpen, quiz]);

  const handleOptionSelect = (optionKey: string) => {
    if (isAnswered) return;
    setSelectedOption(optionKey);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    setIsAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      handleQuizCompletion();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleQuizCompletion = async () => {
    const finalScore = score + (selectedOption === currentQuestion?.correct_answer ? 1 : 0);
    const passed = (finalScore / totalQuestions) * 100 >= (quiz?.passing_score || 70);

    if (passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Update streak/points only on passing
      await awardDailyPoint();
      await updateStreak("quiz", 10); // Award 10 points for quiz completion
    }
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  if (!quiz || !currentQuestion) return null;

  if (showResults) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= (quiz.passing_score || 70);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Quiz Results</DialogTitle>
          </DialogHeader>
          
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              {passed ? (
                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                  <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full">
                  <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
              <p className="text-muted-foreground">
                You scored {score} out of {totalQuestions}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {passed ? "Excellent work! You've mastered this topic." : "Keep studying! Try reviewing the notes again."}
            </div>

            <Button onClick={onClose} className="w-full">
              Close Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Parse questions options 
  // Should handle array ["opt 1", "opt 2"] or object {"A": "opt 1", "B": "opt 2"}
  let optionsList: { key: string; text: string }[] = [];
  if (Array.isArray(currentQuestion.options)) {
    optionsList = currentQuestion.options.map((opt, i) => ({
      key: getOptionLabel(i), // or just use the index/value if strict
      text: opt
    }));
  } else if (typeof currentQuestion.options === 'object' && currentQuestion.options !== null) {
    optionsList = Object.entries(currentQuestion.options).map(([key, value]) => ({
      key,
      text: String(value)
    }));
  }

  // Attempt to map correct answer to a label if needed
  // e.g if correct answer is "Option B" but our keys are "A", "B"... 
  // For now assuming correct_answer matches one of the keys or full text.
  // Standardizing to match keys is safest.

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {quiz.title} <span className="text-sm font-normal text-muted-foreground ml-2">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </DialogTitle>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Question Text */}
          <div className="text-lg font-medium leading-relaxed">
            {currentQuestion.question_text}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionsList.map((opt) => {
              let variant = "outline";
              let className = "justify-start text-left h-auto py-4 px-4 whitespace-normal";
              
              if (isAnswered) {
                if (opt.key === currentQuestion.correct_answer || opt.text === currentQuestion.correct_answer) {
                  variant = "default"; // Correct
                  className += " bg-green-600 hover:bg-green-700 text-white border-green-600";
                } else if (selectedOption === opt.key && selectedOption !== currentQuestion.correct_answer) {
                  variant = "destructive"; // Wrong selection
                  className += " bg-red-600 hover:bg-red-700 text-white border-red-600";
                } else {
                  className += " opacity-50"; // Others
                }
              } else if (selectedOption === opt.key) {
                className += " border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500";
              }

              return (
                <Button
                  key={opt.key}
                  variant={variant as any}
                  className={className}
                  onClick={() => handleOptionSelect(opt.key)}
                  disabled={isAnswered}
                >
                  <span className="font-bold mr-3">{opt.key}.</span>
                  <span>{opt.text}</span>
                </Button>
              );
            })}
          </div>

          {/* Explanation / Feedback */}
          {isAnswered && (
            <div className={`p-4 rounded-lg border flex gap-3 ${
              selectedOption === currentQuestion.correct_answer 
                ? "bg-green-50 border-green-200 text-green-900" 
                : "bg-yellow-50 border-yellow-200 text-yellow-900"
            }`}>
              {selectedOption === currentQuestion.correct_answer ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold mb-1">
                  {selectedOption === currentQuestion.correct_answer ? "Correct!" : "Incorrect"}
                </p>
                <div className="text-sm opacity-90">
                  <span className="font-medium">Explanation: </span>
                  {currentQuestion.explanation || "No explanation provided."}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {!isAnswered ? (
            <Button onClick={handleCheckAnswer} disabled={!selectedOption} className="w-full md:w-auto">
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full md:w-auto">
              {isLastQuestion ? "View Results" : "Next Question"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
