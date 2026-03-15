'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { fetchGameQuestions } from '@/actions/game/questions';
import { calculatePoints } from '@/lib/game/scoring';
import { gameAudio } from '@/lib/game/audio';
import { Button } from '@/components/ui/button';
import { MuteToggle } from '@/components/game/mute-toggle';
import { cn } from '@/lib/utils';
import { 
  Zap, ArrowLeft, CheckCircle, XCircle, SkipForward, 
  Trophy, Timer, Flame 
} from 'lucide-react';
import { GCoinIcon } from '@/components/icons/g-coin-icon';
import confetti from 'canvas-confetti';

const INITIAL_TIME = 60;
const CORRECT_BONUS_TIME = 3;
const WRONG_PENALTY_TIME = 5;
const POINTS_PER_CORRECT = 5;

interface GameQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  title?: string;
  passage?: string;
}

const normalizeAnswer = (ans: string | null | undefined): string => {
  if (!ans) return '';
  return String(ans).replace(/[()]/g, '').trim().toUpperCase();
};

export default function SpeedCourtScreen({ preloadedQuestions }: { preloadedQuestions?: unknown[] }) {
  const router = useRouter();
  const { profile, checkAuth } = useAuthStore();

  // Game state
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout>(null);
  const originalQuestionsRef = useRef<GameQuestion[]>([]);

  // Load questions (from preloaded or fetch)
  useEffect(() => {
    const loadQuestions = async () => {
      let raw: Record<string, unknown>[];

      if (preloadedQuestions && preloadedQuestions.length > 0) {
        raw = preloadedQuestions as Record<string, unknown>[];
      } else {
        raw = await fetchGameQuestions('duel');
      }

      const parsed: GameQuestion[] = raw.map((q: Record<string, unknown>) => {
        const options: { key: string; text: string }[] = [];
        if (Array.isArray(q.options)) {
          (q.options as Array<{ letter?: string; text: string } | string>).forEach((opt, i) => {
            if (typeof opt === 'object' && opt !== null && 'text' in opt) {
              options.push({ key: opt.letter || String.fromCharCode(65 + i), text: opt.text });
            } else {
              options.push({ key: String.fromCharCode(65 + i), text: String(opt) });
            }
          });
        } else if (typeof q.options === 'object' && q.options) {
          Object.entries(q.options as Record<string, string>).forEach(([key, value]) => {
            options.push({ key, text: String(value) });
          });
        }
        return {
          id: q.id as string,
          text: q.text as string || q.question_text as string,
          options,
          correctAnswer: q.correctAnswer as string || q.correct_answer as string,
          explanation: q.explanation as string | undefined,
          title: q.title as string | undefined,
          passage: q.passage as string | undefined,
        };
      });
      originalQuestionsRef.current = parsed;
      setQuestions(parsed);
      setLoading(false);
    };
    loadQuestions();
  }, [preloadedQuestions]);

  // Timer
  useEffect(() => {
    if (loading || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        if (prev <= 6) gameAudio?.playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isGameOver]);

  const endGame = useCallback(() => {
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    if (correctCount > 5) {
      gameAudio?.playWin();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else {
      gameAudio?.playLose();
    }

    // Award coins (1 per correct) — happens via checkAuth refresh
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctCount]);

  const handleAnswer = (answer: string) => {
    if (showFeedback || isGameOver) return;

    const question = questions[currentIndex];
    if (!question) return;

    setSelectedOption(answer);
    setTotalAttempted(prev => prev + 1);
    setShowFeedback(true);

    const correct = normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);
    setIsCorrect(correct);

    if (correct) {
      gameAudio?.playCorrect();
      setScore(prev => prev + POINTS_PER_CORRECT);
      setCorrectCount(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setTimeLeft(prev => prev + CORRECT_BONUS_TIME);
    } else {
      gameAudio?.playWrong();
      setStreak(0);
      setTimeLeft(prev => Math.max(0, prev - WRONG_PENALTY_TIME));
    }

    // Auto-advance quickly
    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Loop: reshuffle and restart
        const reshuffled = [...originalQuestionsRef.current].sort(() => 0.5 - Math.random());
        setQuestions(reshuffled);
        setCurrentIndex(0);
      }
    }, 800);
  };

  const handleSkip = () => {
    if (showFeedback || isGameOver) return;
    setStreak(0);
    setTotalAttempted(prev => prev + 1);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      endGame();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Zap className="h-12 w-12 text-yellow-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading Speed Court...</span>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];

  // ─── RESULTS SCREEN ─────────────────────
  if (isGameOver) {
    const coinsEarned = correctCount; // 1 coin per correct
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-background/80 backdrop-blur-xl space-y-6 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Zap className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-3xl font-black">Time&apos;s Up!</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-2xl font-black">{score}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Score</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-black">{correctCount}/{totalAttempted}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Correct</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-black">{bestStreak}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Best Streak</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <GCoinIcon className="h-6 w-6 text-slate-300 mx-auto mb-1" />
              <div className="text-2xl font-black text-slate-200">+{coinsEarned}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Coins Earned</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/arena')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Arena
            </Button>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              onClick={() => window.location.reload()}
            >
              <Zap className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!question) return null;

  // ─── GAME SCREEN ────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Button variant="ghost" size="sm" onClick={() => router.push('/arena')} className="ml-12 lg:ml-14">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Timer (BIG) */}
        <motion.div
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-full border-2 font-black text-2xl tabular-nums",
            timeLeft <= 10
              ? "border-red-500 text-red-500 animate-pulse bg-red-500/10"
              : "border-yellow-500 text-yellow-500 bg-yellow-500/10"
          )}
          animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <Timer className="h-5 w-5" />
          {timeLeft}s
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-sm font-bold tabular-nums">{score}</span>
          </div>
          <MuteToggle />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 bg-white/5 border-b border-white/5 text-xs">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="font-bold">{correctCount}</span> correct
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-bold">{streak}</span> streak
        </span>
        <span className="text-muted-foreground">Q{currentIndex + 1}</span>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-3xl mx-auto w-full">
        {/* Passage */}
        {question.passage && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground">
            {question.passage}
          </div>
        )}

        {/* Question */}
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-6 leading-snug">
          {question.text}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          {question.options.map(option => {
            const isSelected = selectedOption === option.key;
            const isCorrectAnswer = normalizeAnswer(question.correctAnswer) === normalizeAnswer(option.key);
            const showAsCorrect = showFeedback && isCorrectAnswer;
            const showAsWrong = showFeedback && isSelected && !isCorrectAnswer;

            return (
              <motion.button
                key={option.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(option.key)}
                disabled={showFeedback}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl text-left border-2 transition-all",
                  showAsCorrect && "border-green-500 bg-green-500/10 text-green-400",
                  showAsWrong && "border-red-500 bg-red-500/10 text-red-400 animate-[shake_0.3s_ease-in-out]",
                  !showFeedback && "border-white/10 hover:border-white/25 hover:bg-white/5",
                  showFeedback && !showAsCorrect && !showAsWrong && "opacity-40"
                )}
              >
                <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-sm font-bold">
                  {option.key}
                </span>
                <span className="font-medium">{option.text}</span>
                {showAsCorrect && <CheckCircle className="h-5 w-5 ml-auto" />}
                {showAsWrong && <XCircle className="h-5 w-5 ml-auto" />}
              </motion.button>
            );
          })}
        </div>

        {/* Skip Button */}
        <Button
          variant="ghost"
          size="sm"
          className="self-center text-muted-foreground hover:text-foreground"
          onClick={handleSkip}
          disabled={showFeedback}
        >
          <SkipForward className="h-4 w-4 mr-1" />
          Skip
        </Button>

        {/* Time Bonus/Penalty Indicator */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              className={cn(
                "fixed top-20 right-6 px-3 py-1.5 rounded-full font-bold text-sm",
                isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isCorrect ? `+${CORRECT_BONUS_TIME}s ⏱️` : `-${WRONG_PENALTY_TIME}s ⏱️`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
