'use server';

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface AnswerData {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  questionOrder: number;
}

export async function submitAllAnswers(
  lobbyId: string,
  _userId: string,
  answers: AnswerData[],
  totalScore: number,
  token?: string
) {
  const opts = token ? { token } : {};
  try {
    await fetchMutation(
      api.game.batchSaveAnswers,
      {
        lobbyId: lobbyId as Id<"game_lobbies">,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          is_correct: a.isCorrect,
          time_taken_ms: a.timeTakenMs,
          points_earned: a.pointsEarned,
        })),
        totalScore,
      },
      opts
    );
    return {
      success: true,
      totalScore,
      correctCount: answers.filter((a) => a.isCorrect).length,
      totalQuestions: answers.length,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Submit failed" };
  }
}

export async function finishGame(lobbyId: string, token?: string) {
  const opts = token ? { token } : {};
  await fetchMutation(
    api.game.finishGame,
    { lobbyId: lobbyId as Id<"game_lobbies"> },
    opts
  );
}
