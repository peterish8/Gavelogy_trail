'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { useAuthStore } from '@/lib/stores/auth';
import { submitAllAnswers, finishGame } from '@/actions/game/gameplay';
import { calculatePoints } from '@/lib/game/scoring';
import { gameAudio } from '@/lib/game/audio';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Users, Trophy, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

const QUESTION_TIME = 45;
const POINTS_PER_CORRECT = 5; // Fixed 5 points per correct answer

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

export default function TagTeamScreen() {
  const { lobbyId, players, questions, currentQuestionIndex, nextQuestion, updatePlayerProgress, setStatus } = useGameStore();
  const { profile } = useAuthStore();

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Team scores
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);

  const localAnswersRef = useRef<LocalAnswer[]>([]);
  const timerRef = useRef<NodeJS.Timeout>(null);

  const totalQuestions = questions.length;
  const question = questions[currentQuestionIndex];

  // Assign teams: player 0+2 = Team A, player 1+3 = Team B
  const teamA = players.filter((_, i) => i % 2 === 0);
  const teamB = players.filter((_, i) => i % 2 === 1);
  const myTeam = teamA.some(p => p.id === profile?.id) ? 'A' : 'B';

  // Timer
  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowFeedback(false);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleAnswer(null); return 0; }
        if (prev <= 6) gameAudio?.playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: string | null) => {
    if (isAnswered || !question) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(answer || 'TIMEOUT');

    const timeTaken = (QUESTION_TIME - timeLeft) * 1000;
    const correct = normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);

    setIsCorrect(correct);

    // Update my team score
    if (correct) {
      gameAudio?.playCorrect();
      if (myTeam === 'A') setTeamAScore(prev => prev + POINTS_PER_CORRECT);
      else setTeamBScore(prev => prev + POINTS_PER_CORRECT);
    } else {
      gameAudio?.playWrong();
    }

    // Simulate bot teammates and opponents
    players.forEach((p, idx) => {
      if (p.id === profile?.id) return; // Skip self
      const isTeamA = idx % 2 === 0;
      const botCorrect = Math.random() < 0.65;
      if (botCorrect) {
        if (isTeamA) setTeamAScore(prev => prev + POINTS_PER_CORRECT);
        else setTeamBScore(prev => prev + POINTS_PER_CORRECT);
      }
    });

    localAnswersRef.current.push({
      questionId: question.id,
      answer: answer || '',
      isCorrect: correct,
      timeTakenMs: timeTaken,
      pointsEarned: correct ? POINTS_PER_CORRECT : 0,
      questionOrder: currentQuestionIndex + 1
    });

    setShowFeedback(true);

    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        nextQuestion();
      } else {
        handleFinish();
      }
    }, 1500);
  };

  const handleFinish = async () => {
    if (!lobbyId || !profile?.id) return;

    const finalScore = localAnswersRef.current.reduce((sum, a) => sum + a.pointsEarned, 0);
    updatePlayerProgress(profile.id, { score: finalScore, currentQuestion: totalQuestions });

    // Determine winner
    const myTeamWon = myTeam === 'A' ? teamAScore >= teamBScore : teamBScore >= teamAScore;
    if (myTeamWon) {
      gameAudio?.playWin();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else {
      gameAudio?.playLose();
    }

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
      {/* Team Scoreboard Header */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Team A */}
        <div className={cn(
          "p-4 rounded-xl border-2 text-center transition-all",
          myTeam === 'A' ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5"
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase">Team A</span>
            {myTeam === 'A' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">You</span>}
          </div>
          <div className="text-3xl font-black text-blue-400 tabular-nums">{teamAScore}</div>
          <div className="flex justify-center gap-2 mt-2">
            {teamA.map(p => (
              <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 truncate max-w-[60px]">
                {p.id === profile?.id ? 'You' : p.displayName}
              </span>
            ))}
          </div>
        </div>

        {/* VS + Timer */}
        <div className="flex flex-col items-center gap-2">
          <Swords className="h-6 w-6 text-muted-foreground" />
          <div className={cn(
            "text-2xl font-black tabular-nums",
            timeLeft < 10 ? "text-red-500 animate-pulse" : "text-foreground"
          )}>
            {timeLeft}s
          </div>
          <span className="text-[10px] text-muted-foreground">Q{currentQuestionIndex + 1}/{totalQuestions}</span>
        </div>

        {/* Team B */}
        <div className={cn(
          "p-4 rounded-xl border-2 text-center transition-all",
          myTeam === 'B' ? "border-red-500/50 bg-red-500/10" : "border-white/10 bg-white/5"
        )}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase">Team B</span>
            {myTeam === 'B' && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">You</span>}
          </div>
          <div className="text-3xl font-black text-red-400 tabular-nums">{teamBScore}</div>
          <div className="flex justify-center gap-2 mt-2">
            {teamB.map(p => (
              <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 truncate max-w-[60px]">
                {p.id === profile?.id ? 'You' : p.displayName}
              </span>
            ))}
          </div>
        </div>
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
            const isCA = normalizeAnswer(question.correctAnswer) === normalizeAnswer(opt.key);
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

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className={cn("p-4 rounded-xl border text-center", isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <span className={cn("text-sm font-bold", isCorrect ? "text-green-400" : "text-red-400")}>
              {isCorrect ? `+${POINTS_PER_CORRECT} for Team ${myTeam}!` : 'Missed!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
