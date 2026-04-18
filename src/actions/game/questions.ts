'use server';

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { QuizQuestion } from '@/lib/quiz-loader';

export async function fetchGameQuestions(
  mode: 'duel' | 'arena',
  token?: string
): Promise<Partial<QuizQuestion>[]> {
  const opts = token ? { token } : {};
  const count = mode === 'duel' ? 10 : 12;
  try {
    const questions = await fetchQuery(api.content.getRandomGameQuestions, { count }, opts);
    return questions.map((q) => ({
      id: q._id,
      question_text: q.question_text,
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? "",
      question_type: "single_choice" as const,
      order_index: q.order_index ?? 0,
      passage: q.passage,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title: (q as any).title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      correctAnswer: (q as any).correctAnswer,
    }));
  } catch {
    return [];
  }
}
