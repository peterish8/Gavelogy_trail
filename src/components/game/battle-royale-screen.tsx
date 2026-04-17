'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { useAuthStore } from '@/lib/stores/auth';
import { submitAllAnswers, finishGame } from '@/actions/game/gameplay';
import { calculatePoints } from '@/lib/game/scoring';
import { gameAudio } from '@/lib/game/audio';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Skull, Crown, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

const QUESTIONS_PER_ROUND = 3;
const QUESTION_TIME = 30; // Shorter timer for BR

const normalizeAnswer = (ans: string | null | undefined): string => {
  if (!ans) return '';
  return String(ans).replace(/[()]/g, '').trim().toUpperCase();
};

interface LocalAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  questionOrder: number;
}

export default function BattleRoyaleScreen() {
  const { lobbyId, players, questions, updatePlayerProgress, setStatus } = useGameStore();
  const { profile } = useAuthStore();

  const [currentRound, setCurrentRound] = useState(1);
  const [questionInRound, setQuestionInRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [showElimination, setShowElimination] = useState(false);
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState<string | null>(null);
  const [showShowdown, setShowShowdown] = useState(false);
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);

  const localAnswersRef = useRef<LocalAnswer[]>([]);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const roundScoresRef = useRef<Map<string, number>>(new Map());

  const totalRounds = 4;
  const me = players.find(p => p.id === profile?.id);
  const globalQuestionIndex = (currentRound - 1) * QUESTIONS_PER_ROUND + questionInRound;
  const question = questions[globalQuestionIndex];

  // Initialize alive players
  useEffect(() => {
    setAlivePlayers(players.map(p => p.id));
  }, [players]);

  // Timer
  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowFeedback(false);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null);
          return 0;
        }
        if (prev <= 6) gameAudio?.playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalQuestionIndex]);

  const handleAnswer = (answer: string | null) => {
    if (isAnswered || !question) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(answer || 'TIMEOUT');

    const timeTaken = (QUESTION_TIME - timeLeft) * 1000;
    const correct = normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);
    const points = calculatePoints(correct, timeTaken, QUESTION_TIME * 1000);

    setIsCorrect(correct);
    if (correct) {
      gameAudio?.playCorrect();
      setMyScore(prev => prev + points);
    } else {
      gameAudio?.playWrong();
    }

    // Track round scores
    const prevScore = roundScoresRef.current.get(profile?.id || '') || 0;
    roundScoresRef.current.set(profile?.id || '', prevScore + points);

    localAnswersRef.current.push({
      questionId: question.id,
      answer: answer || '',
      isCorrect: correct,
      timeTakenMs: timeTaken,
      pointsEarned: points,
      questionOrder: globalQuestionIndex + 1
    });

    setShowFeedback(true);

    // Simulate bot answers for this round
    alivePlayers
      .filter(id => id !== profile?.id)
      .forEach(botId => {
        const botCorrect = Math.random() < 0.65;
        const botPoints = botCorrect ? calculatePoints(true, 15000 + Math.random() * 15000, QUESTION_TIME * 1000) : 0;
        const prev = roundScoresRef.current.get(botId) || 0;
        roundScoresRef.current.set(botId, prev + botPoints);
      });

    setTimeout(() => {
      const isLastQuestionInRound = questionInRound >= QUESTIONS_PER_ROUND - 1;

      if (isLastQuestionInRound) {
        handleEndOfRound();
      } else {
        setQuestionInRound(prev => prev + 1);
      }
    }, 1500);
  };

  const handleEndOfRound = () => {
    if (currentRound >= totalRounds || alivePlayers.length <= 1) {
      handleFinish();
      return;
    }

    // Find lowest scorer to eliminate
    let lowestId = '';
    let lowestScore = Infinity;
    alivePlayers.forEach(id => {
      const score = roundScoresRef.current.get(id) || 0;
      if (score < lowestScore) {
        lowestScore = score;
        lowestId = id;
      }
    });

    // Check if it's a showdown (2 left before elimination)
    if (alivePlayers.length === 3) {
      setShowShowdown(true);
      gameAudio?.playSelect();
      setTimeout(() => setShowShowdown(false), 2000);
    }

    // Eliminate
    setEliminatedPlayerId(lowestId);
    setShowElimination(true);
    gameAudio?.playEliminated();

    setTimeout(() => {
      setAlivePlayers(prev => prev.filter(id => id !== lowestId));
      updatePlayerProgress(lowestId, { eliminated: true });
      setShowElimination(false);
      setEliminatedPlayerId(null);
      roundScoresRef.current.clear();

      if (lowestId === profile?.id) {
        // Player eliminated
        const placement = alivePlayers.length;
        console.log(`Eliminated! Placed ${placement}`);
        handleFinish();
      } else {
        setCurrentRound(prev => prev + 1);
        setQuestionInRound(0);
      }
    }, 2500);
  };

  const handleFinish = async () => {
    if (!lobbyId || !profile?.id) return;

    const finalScore = localAnswersRef.current.reduce((sum, a) => sum + a.pointsEarned, 0);
    updatePlayerProgress(profile.id, { score: finalScore, currentQuestion: questions.length });
    await submitAllAnswers(lobbyId, profile.id, localAnswersRef.current, finalScore);
    await finishGame(lobbyId);
    setStatus('finished');
  };

  if (!question) return <div className="p-10 text-center">Loading...</div>;

  // Parse options
  const getOptions = () => {
    if (!question?.options) return [];
    if (Array.isArray(question.options)) {
      return (question.options as Array<{ letter?: string; text: string } | string>).map((opt, i) => {
        if (typeof opt === 'object' && 'text' in opt) return { key: opt.letter || String.fromCharCode(65 + i), text: opt.text };
        return { key: String.fromCharCode(65 + i), text: String(opt) };
      });
    }
    return Object.entries(question.options as Record<string, string>).map(([k, v]) => ({ key: k, text: String(v) }));
  };
  const optionsList = getOptions();

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto p-4 space-y-4">
      {/* Showdown Banner */}
      <AnimatePresence>
        {showShowdown && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            >
              <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-4xl font-black text-white uppercase tracking-widest">Showdown!</h2>
              <p className="text-white/60 mt-2">Final 2 players remaining</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elimination Banner */}
      <AnimatePresence>
        {showElimination && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Skull className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white">
                {eliminatedPlayerId === profile?.id ? 'YOU WERE ELIMINATED' : 'Player Eliminated!'}
              </h2>
              {eliminatedPlayerId === profile?.id && (
                <p className="text-white/60 mt-2">You placed #{alivePlayers.length}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Round</span>
          <span className="ml-2 text-lg font-black">{currentRound}/{totalRounds}</span>
        </div>
        <div className={cn("text-2xl font-black tabular-nums", timeLeft < 10 && "text-red-500 animate-pulse")}>
          {timeLeft}s
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-sm font-bold">{alivePlayers.length} alive</span>
        </div>
      </div>

      {/* Player Avatars */}
      <div className="flex items-center justify-center gap-3">
        {players.map(p => {
          const isAlive = alivePlayers.includes(p.id);
          const isMe = p.id === profile?.id;
          return (
            <div key={p.id} className={cn("text-center transition-all", !isAlive && "opacity-30 grayscale")}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
                isMe ? "border-blue-500 bg-blue-500/20" : "border-white/20 bg-white/5",
                !isAlive && "line-through"
              )}>
                {isAlive ? p.displayName[0] : '❌'}
              </div>
              <span className="text-[9px] text-muted-foreground truncate max-w-[50px] block">
                {isMe ? 'You' : p.displayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Question */}
      <div className="flex-1 space-y-4">
        {question.passage && (
          <p className="text-sm text-muted-foreground p-3 rounded-lg bg-white/5 border border-white/10">{question.passage}</p>
        )}
        <h2 className="text-xl font-bold">{question.text}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsList.map(opt => {
            const sel = selectedOption === opt.key;
            const correctKey = question.correctAnswer;
            const isCA = normalizeAnswer(correctKey) === normalizeAnswer(opt.key);
            const isWA = showFeedback && sel && !isCA;
            const showC = showFeedback && isCA;

            return (
              <motion.button
                key={opt.key} whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(opt.key)} disabled={isAnswered}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  showC && "border-green-500 bg-green-500/10", isWA && "border-red-500 bg-red-500/10",
                  !showFeedback && "border-white/10 hover:border-white/25",
                  showFeedback && !showC && !isWA && "opacity-40"
                )}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-full border border-white/20 text-xs font-bold">{opt.key}</span>
                <span className="text-sm font-medium">{opt.text}</span>
                {showC && <CheckCircle className="h-5 w-5 ml-auto text-green-500" />}
                {isWA && <XCircle className="h-5 w-5 ml-auto text-red-500" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Score Footer */}
      <div className="p-3 bg-white/5 rounded-xl text-center text-sm font-bold tabular-nums">
        Your Score: {myScore}
      </div>
    </div>
  );
}
