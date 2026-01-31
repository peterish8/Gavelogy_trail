'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { submitAnswer, finishGame } from '@/actions/game/gameplay';
import { simulateSingleBotAnswer, generateBotAccuracy } from '@/lib/game/bot-system';
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

export default function DuelGameScreen() {
  const { 
    lobbyId, 
    players, 
    questions, 
    currentQuestionIndex, 
    nextQuestion, 
    submitAnswer: storeSubmitAnswer,
    updatePlayerProgress,
    setStatus
  } = useGameStore();
  
  const { profile } = useAuthStore();
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false); // Local feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [myScore, setMyScore] = useState(0); // Local score for immediate UI feedback
  const [opponentScore, setOpponentScore] = useState(0);
  const [correctAnswerKey, setCorrectAnswerKey] = useState<string | null>(null);
  const [botAccuracy] = useState(() => generateBotAccuracy()); // Generate once per game

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
  // Assuming 2 players for Duel
  const me = players.find(p => p.id === profile?.id);
  const opponent = players.find(p => p.id !== profile?.id);

  // Timer Effect
  useEffect(() => {
    // Reset state on new question
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowFeedback(false);
    setCorrectAnswerKey(null);

    // Start Timer
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

  const handleAnswer = async (answer: string | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(answer || 'TIMEOUT');
    const timeTaken = (QUESTION_TIME - timeLeft) * 1000;
    
    // Optimistic / Server validation
    // For Phase 1 we let server decide correctness, but for UI feedback we need to wait response
    // OR we assume we know logic?
    // questions[] from server stripped 'correct_answer'.
    // So we MUST await server for correctness feedback.
    
    if (lobbyId && me && question) {
        const res = await submitAnswer(lobbyId, me.id, question.id, answer || '', timeTaken, 1, currentQuestionIndex + 1);
        
        if (res.success) {
            setIsCorrect(!!res.isCorrect);
            
            // Play SFX
            if (res.isCorrect) {
                correctSfxRef.current?.play().catch(() => {});
                setMyScore(prev => prev + (res.points || 0));
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.7 }
                });
            } else {
                wrongSfxRef.current?.play().catch(() => {});
            }
            
            if (res.correctAnswer) {
                setCorrectAnswerKey(res.correctAnswer);
            }
            
            // Update Store
            storeSubmitAnswer(question.id, answer || '', timeTaken);
        }
    }
    
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

  const handleFinish = async () => {
    if (lobbyId) {
        // Save final score to store for results screen
        if (profile?.id) {
          updatePlayerProgress(profile.id, { score: myScore });
        }
        await finishGame(lobbyId);
        setStatus('finished');
    }
  };

  // Bot Logic (Host runs this)
  useEffect(() => {
    // Only run if I am the "host" (e.g. first player or just me if solo testing)
    // Simple heuristic: if I am player 0, I manage bots.
    const isHost = players.length > 0 && players[0].id === profile?.id;
    
    if (isHost && opponent && opponent.isBot && !isAnswered) {
         // Determine when bot answers this specific question
         // This effect depends on [currentQuestionIndex]
         
         // Using simulateSingleBotAnswer which sets a timeout
         simulateSingleBotAnswer(
            { name: opponent.displayName || 'Bot', accuracy: botAccuracy, avgResponseTime: 20000 }, // Use generated accuracy (60-80% typical)
            question,
            async (ans, time) => {
                if (lobbyId && question && opponent) {
                    const res = await submitAnswer(lobbyId, opponent.id, question.id, ans, time, 1, currentQuestionIndex + 1);
                    // Update opponent score in UI
                    if (res.success && res.points) {
                        setOpponentScore(prev => prev + res.points);
                    }
                }
            }
         );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, isAnswered]); // Re-run on new question

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
                    // Normalize: strip parentheses and uppercase for comparison
                    const normalize = (s: string | null | undefined) => s?.replace(/[()]/g, '').trim().toUpperCase() || '';
                    const correctKey = correctAnswerKey || question.correctAnswer;
                    const isCorrectAnswer = normalize(correctKey) === normalize(option.key);
                    const isWrongAnswer = showFeedback && isSelected && !isCorrectAnswer;
                    const showAsCorrect = showFeedback && isCorrectAnswer;

                    // Style Logic (matching course-quiz pattern)
                    let containerClasses = "bg-white border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 text-foreground";
                    let labelClasses = "bg-gray-100 text-gray-500 border-gray-200";
                    
                    if (showFeedback) {
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
            
            {/* Feedback / Explanation Box (matching course-quiz style) */}
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
