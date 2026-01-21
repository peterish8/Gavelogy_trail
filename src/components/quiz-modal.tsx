"use client";

import { useState, useEffect } from "react";
import { AttachedQuiz, QuizQuestion, QuizLoader } from "@/lib/quiz-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { useStreakStore } from "@/lib/stores/streaks";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: AttachedQuiz | null;
  subjectName?: string;
  topicName?: string;
}

interface UserAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export function QuizModal({ isOpen, onClose, quiz, subjectName = "Course", topicName }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [confidenceRating, setConfidenceRating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { awardDailyPoint } = useStreakStore();
  const { user } = useAuthStore();

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
      setUserAnswers([]);
      setConfidenceRating(null);
    }
  }, [isOpen, quiz]);

  const handleOptionSelect = (optionKey: string) => {
    if (isAnswered) return;
    setSelectedOption(optionKey);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || !currentQuestion || !user) return;

    setIsAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    // Track this answer
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect
    };
    setUserAnswers(prev => [...prev, answer]);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      // Save mistake immediately when user answers incorrectly
      await QuizLoader.saveMistake(
        user.id,
        currentQuestion,
        selectedOption,
        subjectName,
        topicName
      );
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
      setConfidenceRating(null); // Reset for next question
    }
  };

  // Handle confidence selection (saves but does NOT auto-advance)
  const handleConfidenceSelect = async (confidence: string) => {
    if (!user || !quiz || !currentQuestion || confidenceRating) return;
    
    setConfidenceRating(confidence); // Lock the selection
    
    // Save to database (no auto-advance)
    await QuizLoader.saveConfidenceRating({
      userId: user.id,
      quizId: quiz.id,
      questionId: currentQuestion.id,
      confidenceLevel: confidence as 'confident' | '50/50' | 'fluke',
      wasCorrect: selectedOption === currentQuestion.correct_answer
    });
  };

  const handleQuizCompletion = async () => {
    if (!quiz || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const finalScore = score + (selectedOption === currentQuestion?.correct_answer ? 1 : 0);
      const percentage = (finalScore / totalQuestions) * 100;
      const passed = percentage >= (quiz.passing_score || 70);

      // Save quiz attempt to database
      await QuizLoader.saveQuizAttempt(
        quiz.id,
        user.id,
        percentage,
        passed,
        userAnswers
      );

      if (passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        // Award daily point on passing
        await awardDailyPoint();
      }
    } catch (error) {
       console.error("Error saving quiz attempt:", error);
    } finally {
       setIsSubmitting(false);
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
  // Should handle: [{letter: "A", text: "..."}, ...] or ["opt 1", "opt 2"] or {A: "...", B: "..."}
  let optionsList: { key: string; text: string }[] = [];
  if (Array.isArray(currentQuestion.options)) {
    optionsList = currentQuestion.options.map((opt, i) => {
      // Check if opt is an object with letter/text keys
      if (typeof opt === 'object' && opt !== null && 'text' in opt) {
        const optObj = opt as { letter?: string; text: string };
        return {
          key: optObj.letter || getOptionLabel(i),
          text: optObj.text
        };
      }
      // Simple string format
      return {
        key: getOptionLabel(i),
        text: String(opt)
      };
    });
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
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full min-h-[90vh] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-[#F8F9FC] shadow-2xl rounded-xl border-none outline-none">
        
        {/* Header - Clean White Style as per requested UI */}
        <DialogHeader className="bg-white border-b px-8 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col gap-1 w-full max-w-4xl">
             <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
               {quiz.title}
             </DialogTitle>
             <div className="flex items-center gap-2 text-sm text-gray-500">
               {subjectName && <span>{subjectName}</span>}
               {subjectName && <span className="text-gray-300">•</span>}
               <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
             </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
             <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress</span>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                   />
                </div>
             </div>
             
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-900 -mr-2"
             >
               <XCircle className="w-6 h-6" />
             </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Case Passage Box (if exists) */}
            {currentQuestion.passage && (
               <Card className="border-none shadow-sm overflow-hidden">
                  <div className="bg-white p-6 md:p-8">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                        Case Passage:
                     </h3>
                     <div className="text-gray-700 leading-relaxed text-base md:text-lg font-serif">
                        {currentQuestion.passage}
                     </div>
                  </div>
               </Card>
            )}

            {/* Question Section */}
            <div className="space-y-6">
               <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                  {currentQuestion.question_text}
               </h2>

               {/* Options Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionsList.map((opt) => {
                     const isSelected = selectedOption === opt.key;
                     const isCorrectAnswer = currentQuestion.correct_answer === opt.key;
                     const isWrongAnswer = isAnswered && isSelected && !isCorrectAnswer;
                     const showAsCorrect = isAnswered && isCorrectAnswer;

                     // Style Logic (matching course-quiz / DuelGameScreen exact pattern)
                     let containerClasses = "bg-white border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 text-gray-900";
                     let labelClasses = "bg-gray-100 text-gray-500 border-gray-200";
                     
                     if (isAnswered) {
                         if (showAsCorrect) {
                             // CORRECT ANSWER (Always Green)
                             containerClasses = "bg-green-500 text-white border-green-500 shadow-md";
                             labelClasses = "bg-white/20 text-white border-white/40";
                         } else if (isWrongAnswer) {
                             // WRONG SELECTION (Red)
                             containerClasses = "bg-red-500 text-white border-red-500 shadow-md";
                             labelClasses = "bg-white/20 text-white border-white/40";
                         } else {
                             // OTHER OPTIONS (Disabled/Dimmed)
                             containerClasses = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                             labelClasses = "bg-gray-100 text-gray-400 border-gray-200";
                         }
                     } else if (isSelected) {
                         // Selected but not yet submitted
                         containerClasses = "bg-blue-500 text-white border-blue-500 shadow-lg scale-[1.02]";
                         labelClasses = "bg-white/20 text-white border-white/40";
                     }

                     return (
                        <div 
                           key={opt.key}
                           className={`relative flex items-center p-5 md:p-6 rounded-xl text-left transition-all w-full min-h-[80px] cursor-pointer ${containerClasses}`}
                           onClick={() => !isAnswered && handleOptionSelect(opt.key)}
                        >
                           <span className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border transition-colors ${labelClasses}`}>
                               {opt.key}
                           </span>
                           <span className="text-lg font-medium leading-snug ml-4">{opt.text}</span>
                           
                           {/* Feedback Icons */}
                           {isAnswered && (
                               <div className="absolute top-4 right-4">
                                   {showAsCorrect ? 
                                       <CheckCircle className="w-6 h-6 text-white drop-shadow-md" /> : 
                                       (isWrongAnswer && <XCircle className="w-6 h-6 text-white drop-shadow-md" />)
                                   }
                               </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Strict Feedback Box Implementation (Matching approved layout) */}
            {isAnswered && (
                <div className={cn(
                    "mt-8 p-6 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-300",
                    selectedOption === currentQuestion.correct_answer ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                )}>
                   <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-1">
                         {selectedOption === currentQuestion.correct_answer ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                         ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                         )}
                      </div>
                      <div className="space-y-3">
                         <h4 className={cn(
                             "text-lg font-bold",
                             selectedOption === currentQuestion.correct_answer ? "text-green-800" : "text-red-600"
                         )}>
                             {selectedOption === currentQuestion.correct_answer ? "Correct!" : "Incorrect"}
                         </h4>
                         
                         {selectedOption !== currentQuestion.correct_answer && (
                             <div className="text-gray-900 font-medium">
                                 Correct Answer: <span className="font-bold">({currentQuestion.correct_answer})</span>
                             </div>
                         )}
                         
                         <div className="text-gray-700 leading-relaxed">
                             <span className="font-bold text-gray-900">Explanation:</span> {currentQuestion.explanation || "No explanation provided."}
                         </div>
                      </div>
                   </div>
                </div>
            )}

            {/* Confidence Rating Section */}
            {isAnswered && (
              <div className="mt-6 p-6 bg-white rounded-xl border-2 border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
                  How confident were you with this answer?
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Confident Button */}
                  <Button
                    onClick={() => !confidenceRating && handleConfidenceSelect('confident')}
                    disabled={!!confidenceRating && confidenceRating !== 'confident'}
                    className={cn(
                      "flex flex-col items-center gap-2 py-6 border-2 transition-all h-auto",
                      confidenceRating === 'confident'
                        ? "bg-green-500 text-white border-green-600 ring-2 ring-green-300 scale-105"
                        : confidenceRating
                          ? "bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:scale-105"
                    )}
                  >
                    <span className="text-2xl">😎</span>
                    <span className="font-semibold">Confident</span>
                  </Button>

                  {/* 50/50 Button */}
                  <Button
                    onClick={() => !confidenceRating && handleConfidenceSelect('50/50')}
                    disabled={!!confidenceRating && confidenceRating !== '50/50'}
                    className={cn(
                      "flex flex-col items-center gap-2 py-6 border-2 transition-all h-auto",
                      confidenceRating === '50/50'
                        ? "bg-yellow-500 text-white border-yellow-600 ring-2 ring-yellow-300 scale-105"
                        : confidenceRating
                          ? "bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 hover:scale-105"
                    )}
                  >
                    <span className="text-2xl">🤔</span>
                    <span className="font-semibold">50/50</span>
                  </Button>

                  {/* Fluke Button */}
                  <Button
                    onClick={() => !confidenceRating && handleConfidenceSelect('fluke')}
                    disabled={!!confidenceRating && confidenceRating !== 'fluke'}
                    className={cn(
                      "flex flex-col items-center gap-2 py-6 border-2 transition-all h-auto",
                      confidenceRating === 'fluke'
                        ? "bg-purple-500 text-white border-purple-600 ring-2 ring-purple-300 scale-105"
                        : confidenceRating
                          ? "bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:scale-105"
                    )}
                  >
                    <span className="text-2xl">🎲</span>
                    <span className="font-semibold">Fluke</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - White with centered button */}
        <div className="bg-white p-6 border-t shrink-0 flex justify-center">
            {!isAnswered ? (
               <Button 
                  onClick={handleCheckAnswer} 
                  disabled={!selectedOption} 
                  className="bg-gray-900 hover:bg-black text-white px-12 py-6 text-lg rounded-lg font-medium shadow-lg transition-transform active:scale-95"
               >
                  Submit Answer
               </Button>
            ) : confidenceRating ? (
               <Button 
                  onClick={handleNext} 
                  disabled={isSubmitting}
                  className="bg-gray-900 hover:bg-black text-white px-12 py-6 text-lg rounded-lg font-medium shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isLastQuestion ? (isSubmitting ? "Saving..." : "View Results") : "Continue"}
               </Button>
            ) : (
               <div className="text-gray-500 text-sm font-medium py-3">
                  Please select your confidence level above
               </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
