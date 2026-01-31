"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Trophy } from "lucide-react";
import { QuizLoader, AttachedQuiz } from "@/lib/quiz-loader";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface UserAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export default function CourseQuizPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CourseQuizContent params={params} />
    </Suspense>
  );
}

function CourseQuizContent({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itemId } = use(params);
  const { user } = useAuthStore();
  const { awardDailyPoint } = useStreakStore();
  
  const courseId = searchParams?.get("courseId") || "";
  const returnUrl = courseId ? `/course-viewer?courseId=${courseId}` : "/courses";

  useCopyProtection();

  const [quiz, setQuiz] = useState<AttachedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<'confident' | '50/50' | 'fluke' | null>(null);

  /* Updated to support Spaced Repetition Mode */
  const mode = searchParams?.get("mode");
  const isSpacedRepetition = mode === "spaced-repetition";

  useEffect(() => {
    // Only load if user is present for SR mode, or always for normal mode
    if (isSpacedRepetition && !user) return;
    loadQuiz();
  }, [itemId, user, isSpacedRepetition]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let quizData: AttachedQuiz | null = null;

      if (isSpacedRepetition) {
         if (!user) {
            setError("Please log in to use Spaced Repetition.");
            return;
         }
         // In SR Mode, itemId is passed as the Quiz ID directly (from Calendar)
         quizData = await QuizLoader.getSpacedRepetitionQuiz(itemId, user.id);
      } else {
         // Standard Mode: itemId is the Note Item ID
         quizData = await QuizLoader.getQuizForNote(itemId);
      }
      
      if (!quizData || quizData.questions.length === 0) {
        setError(isSpacedRepetition 
           ? "No spaced repetition questions available (or error loading)." 
           : "No quiz questions found.");
        return;
      }
      
      setQuiz(quizData);
    } catch (err: unknown) {
      console.error("Error loading quiz:", err);
      setError("Error loading quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const totalQuestions = quiz?.questions.length || 0;

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !user) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect
    };
    setUserAnswers(prev => [...prev, answer]);
    setShowFeedback(true);

    if (!isCorrect) {
      await QuizLoader.saveMistake(
        user.id,
        currentQuestion,
        selectedAnswer,
        quiz?.title || "Course",
        undefined
      );
    }
  };

  const handleConfidenceSelect = async (rating: 'confident' | '50/50' | 'fluke') => {
    if (!user || !quiz || !currentQuestion || !selectedAnswer) return;
    
    setConfidenceRating(rating);

    // Save confidence rating
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    await QuizLoader.saveConfidenceRating({
      userId: user.id,
      quizId: quiz.id,
      questionId: currentQuestion.id,
      confidenceLevel: rating,
      wasCorrect: isCorrect
    });
  };

  const handleContinue = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setConfidenceRating(null);
      setShowFeedback(false);
    } else {
      await handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    if (!quiz || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const finalScore = userAnswers.filter(a => a.isCorrect).length;
      const percentage = Math.round((finalScore / totalQuestions) * 100);
      const passed = percentage >= (quiz.passing_score || 70);

      await QuizLoader.saveQuizAttempt(
        quiz.id,
        user.id,
        percentage,
        passed,
        userAnswers,
        totalQuestions,
        isSpacedRepetition
      );

      if (passed) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await awardDailyPoint();
      }

      setIsCompleted(true);
    } catch (err) {
      console.error("Error saving quiz attempt:", err);
      // Optional: Show error toast/message
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse options for current question
  const getOptionsList = (): { key: string; text: string }[] => {
    if (!currentQuestion) return [];
    
    const getLabel = (i: number) => String.fromCharCode(65 + i);
    
    if (Array.isArray(currentQuestion.options)) {
      return currentQuestion.options.map((opt, i) => {
        if (typeof opt === 'object' && opt !== null && 'text' in opt) {
          const optObj = opt as { letter?: string; text: string };
          return { key: optObj.letter || getLabel(i), text: optObj.text };
        }
        return { key: getLabel(i), text: String(opt) };
      });
    } else if (typeof currentQuestion.options === 'object') {
      return Object.entries(currentQuestion.options).map(([key, value]) => ({
        key,
        text: String(value)
      }));
    }
    return [];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Quiz</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
               <Button variant="outline" onClick={() => router.push(returnUrl)}>Go Back</Button>
               <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (isCompleted && quiz) {
    const finalScore = userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    const passed = percentage >= (quiz.passing_score || 70);

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full text-center overflow-hidden shadow-2xl">
            <div className={`p-8 ${passed ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <Trophy className="h-20 w-20 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-xl opacity-90">{passed ? "Congratulations!" : "Keep practicing!"}</p>
            </div>
            <CardContent className="p-8 space-y-8">
              <div>
                <div className="text-6xl font-bold text-gray-900 mb-2">{percentage}%</div>
                <p className="text-gray-500 text-lg">
                  You answered {finalScore} out of {totalQuestions} correctly
                </p>
              </div>

              <div className={`p-6 rounded-xl text-lg ${passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {passed 
                  ? "Excellent work! You've mastered this topic." 
                  : "Keep studying! Review the notes and try again."
                }
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" onClick={() => router.push(returnUrl)} className="min-w-[160px]">
                  Back to Course
                </Button>
                <Button size="lg" onClick={() => window.location.reload()} className="min-w-[160px]">
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  if (!quiz || !currentQuestion) return null;
  
  const optionsList = getOptionsList();
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100/50 pb-20">
      {/* 1. Header Card */}
      <div className="max-w-5xl mx-auto px-4 pt-6 mb-6">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-md">
           <CardContent className="p-4 md:p-5 flex items-center gap-4 md:gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push(returnUrl)}
                className="shrink-0 rounded-full hover:bg-gray-100"
              >
                 <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              
              <div className="flex-1 min-w-0">
                 <h1 className="text-xl font-bold text-gray-900 truncate">{quiz.title}</h1>
                 <p className="text-sm text-gray-500 truncate">Quiz • Question {currentQuestionIndex + 1}</p>
              </div>

              <div className="hidden md:block w-48 shrink-0">
                 <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                    <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <span>{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Mobile Progress Bar */}
        <div className="md:hidden mt-4 px-1">
           <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium">
              <span>{currentQuestionIndex + 1} / {totalQuestions}</span>
           </div>
           <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
           </div>
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="max-w-5xl mx-auto px-4">
         <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 md:p-10">
               
               {/* Case Passage (if present) */}
               {currentQuestion.passage && (
                 <div className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-3">Case Passage:</h3>
                    <p className="text-gray-800 leading-relaxed text-lg font-serif">
                       {currentQuestion.passage}
                    </p>
                 </div>
               )}

               {/* Question Text */}
               <div className="mb-10">
                  <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
                     {currentQuestion.question_text}
                  </h2>
               </div>

               {/* Options Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {optionsList.map((option) => {
                    const isSelected = selectedAnswer === option.key;
                    const isCorrectAnswer = currentQuestion.correct_answer === option.key;
                    const isWrongAnswer = showFeedback && isSelected && !isCorrectAnswer;
                    const showAsCorrect = showFeedback && isCorrectAnswer;

                    return (
                      <button
                        key={option.key}
                        onClick={() => handleAnswerSelect(option.key)}
                        disabled={showFeedback}
                        className={cn(
                          "relative p-5 md:p-6 rounded-xl border-2 text-left transition-all duration-200 group",
                          // Default Interaction
                          !showFeedback && !isSelected && "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30",
                          // Selected State (Before submit)
                          !showFeedback && isSelected && "border-blue-500 bg-blue-500 text-white shadow-lg scale-[1.02]",
                          // Correct State (After submit)
                          showAsCorrect && "border-green-500 bg-green-500 text-white shadow-md",
                          // Wrong State (After submit)
                          isWrongAnswer && "border-red-500 bg-red-500 text-white shadow-md",
                          // Unselected state (After submit)
                          showFeedback && !showAsCorrect && !isWrongAnswer && "border-gray-100 bg-gray-50 text-gray-400 opacity-60"
                        )}
                      >
                         <div className="flex items-start gap-4">
                            <span className={cn(
                               "shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border transition-colors",
                               !showFeedback && !isSelected && "bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600",
                               !showFeedback && isSelected && "bg-white/20 text-white border-white/40",
                               showAsCorrect && "bg-white/20 text-white border-white/40",
                               isWrongAnswer && "bg-white/20 text-white border-white/40",
                               showFeedback && !showAsCorrect && !isWrongAnswer && "bg-gray-100 text-gray-400 border-gray-200"
                            )}>
                               {option.key}
                            </span>
                            <span className={cn(
                               "text-lg font-medium pt-0.5",
                            )}>
                               {option.text}
                            </span>
                         </div>
                      </button>
                    );
                  })}
               </div>

               {/* Footer Action Area */}
               <div className="space-y-6">
                  {/* Submit Button */}
                  {!showFeedback && (
                     <div className="flex justify-end">
                        <Button 
                           size="lg"
                           onClick={handleSubmitAnswer} 
                           disabled={!selectedAnswer}
                           className="bg-gray-900 hover:bg-black text-white px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Submit Answer
                        </Button>
                     </div>
                  )}

                  {/* Feedback Section */}
                  {showFeedback && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Box */}
                        <div className={cn(
                           "rounded-xl p-6 mb-6 border",
                           userAnswers[userAnswers.length - 1]?.isCorrect 
                              ? "bg-green-50 border-green-200" 
                              : "bg-yellow-50 border-yellow-200" // Yellow for incorrect, per image
                        )}>
                           <div className="flex items-start gap-4">
                              <div className="shrink-0 mt-1">
                                 {userAnswers[userAnswers.length - 1]?.isCorrect ? (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                 ) : (
                                    <XCircle className="h-6 w-6 text-red-500" />
                                 )}
                              </div>
                              <div className="space-y-3">
                                 <h4 className={cn(
                                    "text-lg font-bold",
                                    userAnswers[userAnswers.length - 1]?.isCorrect ? "text-green-800" : "text-red-600"
                                 )}>
                                    {userAnswers[userAnswers.length - 1]?.isCorrect ? "Correct!" : "Incorrect"}
                                 </h4>
                                 
                                 {!userAnswers[userAnswers.length - 1]?.isCorrect && (
                                    <div className="text-gray-900 font-medium">
                                       Correct Answer: <span className="font-bold">({currentQuestion.correct_answer})</span>
                                    </div>
                                 )}
                                 
                                 <div className="text-gray-700 leading-relaxed">
                                    <span className="font-bold text-gray-900">Explanation:</span> {currentQuestion.explanation || "No explanation available."}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Confidence Rating Section */}
                        <div className="mb-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
                           <h4 className="text-gray-900 font-semibold mb-4">How confident were you?</h4>
                           <div className="flex flex-wrap gap-3 justify-center">
                              <Button
                                variant={confidenceRating === 'confident' ? "default" : "outline"}
                                className={cn(
                                   "min-w-[100px] transition-all",
                                   confidenceRating === 'confident' 
                                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600 ring-2 ring-green-100" 
                                      : "hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                )}
                                onClick={() => handleConfidenceSelect('confident')}
                              >
                                 Confident
                              </Button>
                              <Button
                                variant={confidenceRating === '50/50' ? "default" : "outline"}
                                className={cn(
                                   "min-w-[100px] transition-all",
                                   confidenceRating === '50/50' 
                                      ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 ring-2 ring-yellow-100" 
                                      : "hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
                                )}
                                onClick={() => handleConfidenceSelect('50/50')}
                              >
                                 50/50
                              </Button>
                              <Button
                                variant={confidenceRating === 'fluke' ? "default" : "outline"}
                                className={cn(
                                   "min-w-[100px] transition-all",
                                   confidenceRating === 'fluke' 
                                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500 ring-2 ring-red-100" 
                                      : "hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                )}
                                onClick={() => handleConfidenceSelect('fluke')}
                              >
                                 Fluke
                              </Button>
                           </div>
                        </div>

                         {/* Continue Button - Gated by Confidence */}
                        {confidenceRating && (
                           <div className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <Button 
                                 onClick={handleContinue} 
                                 disabled={isSubmitting}
                                 className="bg-gray-900 hover:bg-black text-white px-12 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                 {currentQuestionIndex < totalQuestions - 1 ? "Continue" : (isSubmitting ? "Saving..." : "View Results")}
                              </Button>
                           </div>
                        )}
                     </div>
                  )}
               </div>

            </CardContent>
         </Card>
      </div>
    </div>
  );
}
