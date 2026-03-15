'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { submitAllAnswers, finishGame } from '@/actions/game/gameplay';
import { simulateSingleBotAnswer, generateBotAccuracy } from '@/lib/game/bot-system';
import { calculatePoints } from '@/lib/game/scoring';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth';
import confetti from 'canvas-confetti';

const QUESTION_TIME = 45; // Seconds

// SFX URLs (royalty-free tones)
const SFX_CORRECT = '/sounds/correct.mp3';
const SFX_WRONG = '/sounds/wrong.mp3';

// Normalize answer strings for comparison
const normalizeAnswer = (ans: string | null | undefined): string => {
  if (!ans) return '';
  return String(ans).replace(/[()]/g, '').trim().toUpperCase();
};

// Local answer record for batch submission
interface LocalAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  questionOrder: number;
}

export default function DuelGameScreen() {
  const { 
    lobbyId, 
    players, 
    questions, 
    currentQuestionIndex, 
    nextQuestion, 
    updatePlayerProgress,
    setStatus
  } = useGameStore();
  
  const { profile } = useAuthStore();
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [correctAnswerKey, setCorrectAnswerKey] = useState<string | null>(null);
  const [botAccuracy] = useState(() => generateBotAccuracy());
  
  // Collect all answers locally — NO per-question DB calls!
  const localAnswersRef = useRef<LocalAnswer[]>([]);
  const correctCountRef = useRef(0);

  const timerRef = useRef<NodeJS.Timeout>(null);
  const correctSfxRef = useRef<HTMLAudioElement | null>(null);
  const wrongSfxRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio refs
  useEffect(() => {
    correctSfxRef.current = new Audio(SFX_CORRECT);
    wrongSfxRef.current = new Audio(SFX_WRONG);
    correctSfxRef.current.volume = 0.5;
    wrongSfxRef.current.volume = 0.5;
  }, []);
  
  // Current Question
  const question = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  
  // Identify self and opponent
  const me = players.find(p => p.id === profile?.id);
  const opponent = players.find(p => p.id !== profile?.id);

  // Timer Effect
  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowFeedback(false);
    setCorrectAnswerKey(null);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // Sync opponent score from realtime player updates
  useEffect(() => {
    if (opponent) {
      setOpponentScore(opponent.score || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponent?.score]);

  const handleTimeUp = () => {
    if (!isAnswered) {
      handleAnswer(null); // Treat as wrong/timeout
    }
  };

  /**
   * CLIENT-SIDE answer validation — NO server call!
   * Correct answer is already in the question object.
   */
  const handleAnswer = (answer: string | null) => {
    if (isAnswered || !question) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(answer || 'TIMEOUT');
    const timeTaken = (QUESTION_TIME - timeLeft) * 1000;
    
    // Client-side validation using question.correctAnswer
    const correct = normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);
    const points = calculatePoints(correct, timeTaken);
    
    setIsCorrect(correct);
    setCorrectAnswerKey(question.correctAnswer || null);
    
    // Play SFX + update local score
    if (correct) {
      correctSfxRef.current?.play().catch(() => {});
      setMyScore(prev => prev + points);
      correctCountRef.current += 1;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      wrongSfxRef.current?.play().catch(() => {});
    }
    
    // Store answer locally (NO DB call)
    localAnswersRef.current.push({
      questionId: question.id,
      answer: answer || '',
      isCorrect: correct,
      timeTakenMs: timeTaken,
      pointsEarned: points,
      questionOrder: currentQuestionIndex + 1
    });
    
    setShowFeedback(true);
    
    // Auto-advance
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        nextQuestion();
      } else {
        handleFinish();
      }
    }, 2000);
  };

  /**
   * BATCH SUBMIT: Send all answers to server in ONE request at the end.
   */
  const handleFinish = async () => {
    if (!lobbyId || !me || !profile?.id) return;
    
    const finalScore = localAnswersRef.current.reduce((sum, a) => sum + a.pointsEarned, 0);
    
    // Update store for results screen
    updatePlayerProgress(profile.id, { 
      score: finalScore,
      currentQuestion: totalQuestions 
    });
    
    // ONE server call: batch submit all answers + update score
    await submitAllAnswers(lobbyId, profile.id, localAnswersRef.current, finalScore);
    
    // ONE server call: mark game as finished
    await finishGame(lobbyId);
    
    setStatus('finished');
  };

  // Bot Logic (Host runs this) — bot answers are simulated locally too
  useEffect(() => {
    const isHost = players.length > 0 && players[0].id === profile?.id;
    
    if (isHost && opponent && opponent.isBot && !isAnswered) {
      simulateSingleBotAnswer(
        { name: opponent.displayName || 'Bot', accuracy: botAccuracy, avgResponseTime: 20000 },
        question,
        (_ans, _time) => {
          // Bot scoring is simulated client-side for UI
          // Just update opponent score visually
          const botCorrect = Math.random() < botAccuracy / 100;
          const botPoints = botCorrect ? calculatePoints(true, 15000 + Math.random() * 20000) : 0;
          setOpponentScore(prev => prev + botPoints);
          
          // Update opponent in game store
          if (opponent) {
            updatePlayerProgress(opponent.id, { 
              score: (opponent.score || 0) + botPoints,
              currentQuestion: currentQuestionIndex + 1
            });
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, isAnswered]);

  if (!question) return <div className="p-10 text-center">Loading Question...</div>;

  // Parse options matching course-quiz page pattern
  const getOptionsList = (): { key: string; text: string }[] => {
    if (!question?.options) return [];
    
    const getLabel = (i: number) => String.fromCharCode(65 + i);
    
    if (Array.isArray(question.options)) {
      return (question.options as Array<{ letter?: string; text: string } | string>).map((opt, i: number) => {
        if (typeof opt === 'object' && opt !== null && 'text' in opt) {
          return { key: opt.letter || getLabel(i), text: opt.text };
        }
        return { key: getLabel(i), text: String(opt) };
      });
    } else if (typeof question.options === 'object') {
      return Object.entries(question.options as Record<string, string>).map(([key, value]) => ({
        key,
        text: String(value)
      }));
    }
    return [];
  };
  
  const optionsList = getOptionsList();

  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-4 md:p-6 space-y-4">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate text-foreground/90">
                  {question.title || "General Knowledge"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Match Mode</span>
                  <span>•</span>
                  <span>{new Date().getFullYear()}</span>
              </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
               {/* Timer */}
               <div className="flex flex-col items-center min-w-[60px]">
                    <span className={cn("text-2xl font-black tabular-nums leading-none", 
                        timeLeft < 10 ? "text-destructive animate-pulse" : "text-primary")}>
                        {timeLeft}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sec</span>
               </div>

               {/* Progress */}
               <div className="flex flex-col items-end gap-1 min-w-[140px]">
                   <span className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                   <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="w-full h-2" />
               </div>
          </div>
      </div>

      {/* Main Content Card */}
      <Card className="flex-1 border-border/50 shadow-sm relative overflow-hidden flex flex-col bg-white">
         <CardContent className="p-6 md:p-10 flex flex-col h-full overflow-y-auto">
            
            {/* Case Passage Section */}
            {question.passage && (
                <div className="mb-8 space-y-3">
                    <span className="text-sm font-bold text-foreground/80">Case Passage:</span>
                    <p className="text-base md:text-lg leading-relaxed text-muted-foreground text-justify bg-secondary/10 p-4 rounded-lg border border-border/50">
                        {question.passage}
                    </p>
                </div>
            )}
            
            {/* Question */}
            <div className="space-y-6 mb-8">
                <h2 className="text-xl md:text-2xl font-bold leading-snug text-foreground/90">
                    {question.text}
                </h2>
                <div className="h-px w-full bg-border/50" />
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {optionsList.map((option) => {
                    const isSelected = selectedOption === option.key;
                    const correctKey = correctAnswerKey || question.correctAnswer;
                    const isCorrectAnswer = normalizeAnswer(correctKey) === normalizeAnswer(option.key);
                    const isWrongAnswer = showFeedback && isSelected && !isCorrectAnswer;
                    const showAsCorrect = showFeedback && isCorrectAnswer;

                    let containerClasses = "bg-white border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 text-foreground";
                    let labelClasses = "bg-gray-100 text-gray-500 border-gray-200";
                    
                    if (showFeedback) {
                        if (showAsCorrect) {
                            containerClasses = "bg-green-500 text-white border-green-500 shadow-md";
                            labelClasses = "bg-white/20 text-white border-white/40";
                        } else if (isWrongAnswer) {
                            containerClasses = "bg-red-500 text-white border-red-500 shadow-md";
                            labelClasses = "bg-white/20 text-white border-white/40";
                        } else {
                            containerClasses = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                            labelClasses = "bg-gray-100 text-gray-400 border-gray-200";
                        }
                    } else if (isSelected) {
                        containerClasses = "bg-blue-500 text-white border-blue-500 shadow-lg scale-[1.02]";
                        labelClasses = "bg-white/20 text-white border-white/40";
                    }

                    return (
                        <motion.button
                            key={option.key}
                            whileTap={{ scale: 0.995 }}
                            onClick={() => handleAnswer(option.key)}
                            disabled={isAnswered}
                            className={cn(
                                "relative flex items-center gap-4 p-5 md:p-6 rounded-xl text-left transition-all w-full min-h-[80px]",
                                containerClasses
                            )}
                        >
                            <span className={cn(
                                "shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border transition-colors",
                                labelClasses
                            )}>
                                {option.key}
                            </span>
                            <span className="text-lg font-medium leading-snug">{option.text}</span>
                            
                            {/* Feedback Icons */}
                            {showFeedback && (
                                <div className="absolute top-4 right-4">
                                    {showAsCorrect ? 
                                        <CheckCircle className="w-6 h-6 text-white drop-shadow-md" /> : 
                                        (isWrongAnswer && <XCircle className="w-6 h-6 text-white drop-shadow-md" />)
                                    }
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
            
            {/* Feedback / Explanation Box */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "mt-8 p-6 rounded-xl border",
                            isCorrect ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 mt-1">
                                {isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <h4 className={cn(
                                    "text-lg font-bold",
                                    isCorrect ? "text-green-800" : "text-red-600"
                                )}>
                                    {isCorrect ? "Correct!" : "Incorrect"}
                                </h4>
                                
                                {!isCorrect && (
                                    <div className="text-gray-900 font-medium">
                                        Correct Answer: <span className="font-bold">({correctAnswerKey || question.correctAnswer})</span>
                                    </div>
                                )}
                                
                                <div className="text-gray-700 leading-relaxed">
                                    <span className="font-bold text-gray-900">Explanation:</span> {question.explanation || "No explanation available."}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

         </CardContent>
      </Card>
      
      {/* Player Stats Footer (Minimal) */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-border/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {myScore}
              </div>
              <span className="font-semibold text-sm">Your Score</span>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-border/50 flex items-center justify-end gap-3">
              <span className="font-semibold text-sm">{opponent?.displayName || "Opponent"}</span>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                  {opponentScore}
              </div>
          </div>
      </div>
    </div>
  );
}
