'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type CompletedQuizAttempt = {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  quiz: {
    title: string;
  };
};

export function useDayHistory(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${d}`;

  const attempts = useQuery(api.quiz.getDayHistory, { date: dateKey });

  const history: CompletedQuizAttempt[] = (attempts ?? []).map((a) => ({
    id: a._id,
    quiz_id: a.quizId,
    score: a.score,
    passed: a.score >= 60,
    completed_at: a.completed_at,
    quiz: { title: "" },
  }));

  return { history, isLoading: attempts === undefined };
}
