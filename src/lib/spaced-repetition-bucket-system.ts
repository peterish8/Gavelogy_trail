/**
 * ADVANCED SPACED REPETITION — BUCKET SYSTEM
 *
 * LOCKED RULES:
 * 1. Buckets (A–F) are IMMUTABLE — set once, never changes
 * 2. Hierarchy is FIXED: D → E → F → C → B → A
 * 3. Recall size = ceil(total_questions / 2)
 * 4. Confidence captured EVERY attempt (initial → bucket, SR → priority)
 * 5. Priority is DYNAMIC (recomputed each recall)
 */

import { getConvexHttpClient } from "./convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type Bucket = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type Confidence = 'confident' | 'fifty_fifty' | 'fluke';

export interface QuestionMemoryState {
  id: string;
  user_id: string;
  quiz_id: string;
  question_id: string;
  bucket: Bucket;
  times_shown: number;
  times_correct: number;
  last_was_wrong: boolean;
  last_shown_at: string | null;
  last_confidence: Confidence | null;
  created_at: string;
}

export interface QuestionAnswer {
  questionId: string;
  isCorrect: boolean;
  confidence: Confidence;
}

export const BUCKET_HIERARCHY: Bucket[] = ['D', 'E', 'F', 'C', 'B', 'A'];

const BUCKET_BASE_WEIGHT: Record<Bucket, number> = {
  D: 100, E: 90, F: 80, C: 60, B: 50, A: 20,
};
const RECENT_WRONG_BOOST = 30;
const CONFIDENCE_BOOST: Record<Confidence, number> = { fluke: 25, fifty_fifty: 15, confident: 0 };
const MAX_RECENCY_BOOST = 20;
const RECENCY_BOOST_PER_DAY = 3;
const EXPOSURE_PENALTY_THRESHOLD = 5;
const EXPOSURE_PENALTY_PER_SHOW = 5;

export function determineBucket(confidence: Confidence, isCorrect: boolean): Bucket {
  if (isCorrect) {
    if (confidence === 'confident') return 'A';
    if (confidence === 'fifty_fifty') return 'B';
    return 'C';
  } else {
    if (confidence === 'confident') return 'D';
    if (confidence === 'fifty_fifty') return 'E';
    return 'F';
  }
}

function daysSinceDate(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function computePriority(state: QuestionMemoryState): number {
  const baseWeight = BUCKET_BASE_WEIGHT[state.bucket];
  const recentWrongBoost = state.last_was_wrong ? RECENT_WRONG_BOOST : 0;
  const lastConfidence = state.last_confidence || 'confident';
  const confidenceBoost = CONFIDENCE_BOOST[lastConfidence];
  const daysSince = state.last_shown_at ? daysSinceDate(state.last_shown_at) : 7;
  const recencyBoost = Math.min(daysSince * RECENCY_BOOST_PER_DAY, MAX_RECENCY_BOOST);
  const exposurePenalty = state.times_shown > EXPOSURE_PENALTY_THRESHOLD
    ? (state.times_shown - EXPOSURE_PENALTY_THRESHOLD) * EXPOSURE_PENALTY_PER_SHOW
    : 0;
  return baseWeight + recentWrongBoost + confidenceBoost + recencyBoost - exposurePenalty;
}

export async function selectRecallQuestions(
  _userId: string,
  quizId: string
): Promise<string[]> {
  try {
    const client = getConvexHttpClient();
    const allStates = await client.query(api.spacedRepetition.getMemoryStates, {
      quizId: quizId as Id<"attached_quizzes">,
    });
    if (!allStates.length) return [];

    const quota = Math.ceil(allStates.length / 2);

    const bucketGroups: Record<Bucket, (QuestionMemoryState & { priority: number })[]> = {
      A: [], B: [], C: [], D: [], E: [], F: [],
    };

    allStates.forEach((s) => {
      const state: QuestionMemoryState = {
        id: s._id,
        user_id: s.userId,
        quiz_id: s.quizId,
        question_id: s.questionId,
        bucket: s.bucket as Bucket,
        times_shown: s.times_shown,
        times_correct: s.times_correct,
        last_was_wrong: s.last_was_wrong,
        last_shown_at: s.last_shown_at ?? null,
        last_confidence: s.last_confidence as Confidence | null,
        created_at: s._creationTime?.toString() ?? "",
      };
      bucketGroups[state.bucket].push({ ...state, priority: computePriority(state) });
    });

    BUCKET_HIERARCHY.forEach((bucket) => {
      bucketGroups[bucket].sort((a, b) => b.priority - a.priority);
    });

    const selected: string[] = [];
    for (const bucket of BUCKET_HIERARCHY) {
      if (selected.length >= quota) break;
      const available = bucketGroups[bucket];
      const needed = quota - selected.length;
      selected.push(...available.slice(0, needed).map((s) => s.question_id));
    }
    return selected;
  } catch {
    return [];
  }
}

export async function classifyQuestionsAfterInitialQuiz(
  _userId: string,
  quizId: string,
  answers: QuestionAnswer[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getConvexHttpClient();
    await client.mutation(api.spacedRepetition.classifyQuestionsAfterQuiz, {
      quizId: quizId as Id<"attached_quizzes">,
      results: answers.map((a) => ({
        questionId: a.questionId,
        is_correct: a.isCorrect,
        confidence: a.confidence,
      })),
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateMemoryStateAfterSR(
  _userId: string,
  quizId: string,
  questionId: string,
  isCorrect: boolean,
  confidence: Confidence
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getConvexHttpClient();
    await client.mutation(api.spacedRepetition.updateMemoryStateAfterReview, {
      quizId: quizId as Id<"attached_quizzes">,
      questionId,
      is_correct: isCorrect,
      confidence,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function batchUpdateMemoryStatesAfterSR(
  userId: string,
  quizId: string,
  answers: QuestionAnswer[]
): Promise<{ success: boolean; updated: number; error?: string }> {
  let updated = 0;
  for (const answer of answers) {
    const result = await updateMemoryStateAfterSR(
      userId, quizId, answer.questionId, answer.isCorrect, answer.confidence
    );
    if (result.success) updated++;
  }
  return { success: updated === answers.length, updated };
}

export async function hasMemoryStates(_userId: string, quizId: string): Promise<boolean> {
  try {
    const client = getConvexHttpClient();
    return await client.query(api.spacedRepetition.hasMemoryStates, {
      quizId: quizId as Id<"attached_quizzes">,
    });
  } catch {
    return false;
  }
}
