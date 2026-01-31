/**
 * ═══════════════════════════════════════════════════════════════════
 * ADVANCED SPACED REPETITION — BUCKET SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 * 
 * EXECUTION CONTRACT — DO NOT SIMPLIFY
 * 
 * LOCKED RULES:
 * 1. Buckets (A–F) are IMMUTABLE — set once, never changes
 * 2. Hierarchy is FIXED: D → E → F → C → B → A
 * 3. Recall size = ceil(total_questions / 2)
 * 4. Confidence captured EVERY attempt (initial → bucket, SR → priority)
 * 5. Priority is DYNAMIC (recomputed each recall)
 * 
 * See: implementation_plan.md for full specification
 * ═══════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key (bypasses RLS)
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS — DO NOT HARDCODE ELSEWHERE
// ═══════════════════════════════════════════════════════════════════

/** Fixed hierarchy order: most urgent first */
export const BUCKET_HIERARCHY: Bucket[] = ['D', 'E', 'F', 'C', 'B', 'A'];

/** Base weight per bucket (higher = more urgent) */
const BUCKET_BASE_WEIGHT: Record<Bucket, number> = {
  D: 100, // Tier 1: Dangerous (Confident + Wrong)
  E: 90,  // Tier 1: Dangerous (50-50 + Wrong)
  F: 80,  // Tier 1: Dangerous (Fluke + Wrong)
  C: 60,  // Tier 2: Fragile (Fluke + Correct)
  B: 50,  // Tier 2: Fragile (50-50 + Correct)
  A: 20,  // Tier 3: Stable (Confident + Correct)
};

/** Priority boost if last SR attempt was wrong */
const RECENT_WRONG_BOOST = 30;

/** Priority boost based on SR confidence (lower confidence = higher boost) */
const CONFIDENCE_BOOST: Record<Confidence, number> = {
  fluke: 25,
  fifty_fifty: 15,
  confident: 0,
};

/** Max recency boost (days since last shown) */
const MAX_RECENCY_BOOST = 20;
const RECENCY_BOOST_PER_DAY = 3;

/** Penalty for over-exposure (after 5 shows) */
const EXPOSURE_PENALTY_THRESHOLD = 5;
const EXPOSURE_PENALTY_PER_SHOW = 5;

// ═══════════════════════════════════════════════════════════════════
// BUCKET DETERMINATION — IMMUTABLE AFTER CREATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Determines the diagnostic bucket for a question based on initial quiz
 * response. This is called ONCE and the result NEVER changes.
 * 
 * @param confidence - User's confidence level (confident, fifty_fifty, fluke)
 * @param isCorrect - Whether the answer was correct
 * @returns Bucket A-F
 */
export function determineBucket(confidence: Confidence, isCorrect: boolean): Bucket {
  if (isCorrect) {
    switch (confidence) {
      case 'confident': return 'A';
      case 'fifty_fifty': return 'B';
      case 'fluke': return 'C';
    }
  } else {
    switch (confidence) {
      case 'confident': return 'D';
      case 'fifty_fifty': return 'E';
      case 'fluke': return 'F';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC PRIORITY SCORING
// ═══════════════════════════════════════════════════════════════════

/**
 * Computes dynamic priority score for a question.
 * Higher score = higher urgency = shown earlier.
 * 
 * WHY THIS FORMULA EXISTS:
 * - baseWeight: Ensures hierarchy order is preserved
 * - recentWrongBoost: Surfaces questions that were just missed
 * - confidenceBoost: Low SR confidence signals fragile recall
 * - recencyBoost: Questions not seen recently need reinforcement
 * - exposurePenalty: Prevents over-drilling the same questions
 */
export function computePriority(state: QuestionMemoryState): number {
  // 1. Base weight from fixed hierarchy
  const baseWeight = BUCKET_BASE_WEIGHT[state.bucket];
  
  // 2. +30 if LAST attempt was wrong
  const recentWrongBoost = state.last_was_wrong ? RECENT_WRONG_BOOST : 0;
  
  // 3. Low confidence boost from last SR attempt
  const lastConfidence = state.last_confidence || 'confident';
  const confidenceBoost = CONFIDENCE_BOOST[lastConfidence];
  
  // 4. Recency boost (not shown recently = higher priority)
  const daysSince = state.last_shown_at 
    ? daysSinceDate(state.last_shown_at) 
    : 7; // Never shown in SR = assume 7 days
  const recencyBoost = Math.min(daysSince * RECENCY_BOOST_PER_DAY, MAX_RECENCY_BOOST);
  
  // 5. Over-exposure penalty
  const exposurePenalty = state.times_shown > EXPOSURE_PENALTY_THRESHOLD
    ? (state.times_shown - EXPOSURE_PENALTY_THRESHOLD) * EXPOSURE_PENALTY_PER_SHOW
    : 0;
  
  return baseWeight + recentWrongBoost + confidenceBoost + recencyBoost - exposurePenalty;
}

/** Helper: Calculate days since a date */
function daysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ═══════════════════════════════════════════════════════════════════
// WATERFALL QUESTION SELECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Selects questions for a spaced repetition recall using waterfall hierarchy.
 * 
 * ALGORITHM:
 * 1. Get all memory states for user+quiz
 * 2. Group by bucket in hierarchy order
 * 3. Sort within each bucket by priority
 * 4. Consume from D → A until quota filled
 * 
 * @returns Array of question IDs to show in this recall
 */
export async function selectRecallQuestions(
  userId: string,
  quizId: string
): Promise<string[]> {
  // 1. Fetch all memory states
  const { data: allStates, error } = await getSupabaseAdmin()
    .from('question_memory_states')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId);
  
  if (error || !allStates || allStates.length === 0) {
    console.error('[BucketSystem] Error fetching memory states:', error);
    return [];
  }
  
  // 2. Calculate recall quota: ceil(N / 2)
  const quota = Math.ceil(allStates.length / 2);
  
  // 3. Group by bucket
  const bucketGroups: Record<Bucket, (QuestionMemoryState & { priority: number })[]> = {
    A: [], B: [], C: [], D: [], E: [], F: []
  };
  
  allStates.forEach((s: QuestionMemoryState) => {
    bucketGroups[s.bucket].push({
      ...s,
      priority: computePriority(s)
    });
  });
  
  // 4. Sort each bucket by priority (highest first)
  BUCKET_HIERARCHY.forEach(bucket => {
    bucketGroups[bucket].sort((a, b) => b.priority - a.priority);
  });
  
  // 5. Waterfall selection: consume D → A until quota
  const selected: string[] = [];
  
  for (const bucket of BUCKET_HIERARCHY) {
    if (selected.length >= quota) break;
    
    const available = bucketGroups[bucket];
    const needed = quota - selected.length;
    
    selected.push(...available.slice(0, needed).map(s => s.question_id));
  }
  
  return selected;
}

// ═══════════════════════════════════════════════════════════════════
// INITIAL CLASSIFICATION — CALLED AFTER FIRST QUIZ
// ═══════════════════════════════════════════════════════════════════

/**
 * Classifies all questions after the initial quiz attempt.
 * Creates memory states with immutable buckets.
 */
export async function classifyQuestionsAfterInitialQuiz(
  userId: string,
  quizId: string,
  answers: QuestionAnswer[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const memoryStates = answers.map(answer => ({
      user_id: userId,
      quiz_id: quizId,
      question_id: answer.questionId,
      bucket: determineBucket(answer.confidence, answer.isCorrect),
      times_shown: 0, // Not shown in SR yet
      times_correct: 0,
      last_was_wrong: false,
      last_shown_at: null,
      last_confidence: null,
    }));
    
    const { error } = await getSupabaseAdmin()
      .from('question_memory_states')
      .insert(memoryStates);
    
    if (error) {
      console.error('[BucketSystem] Error creating memory states:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`[BucketSystem] Classified ${answers.length} questions for quiz ${quizId}`);
    return { success: true };
  } catch (e) {
    console.error('[BucketSystem] Classification error:', e);
    return { success: false, error: String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST-SR UPDATE — CALLED AFTER EACH SR ATTEMPT
// ═══════════════════════════════════════════════════════════════════

/**
 * Updates memory state after a spaced repetition attempt.
 * BUCKET NEVER CHANGES — only dynamic priority factors update.
 */
export async function updateMemoryStateAfterSR(
  userId: string,
  quizId: string,
  questionId: string,
  isCorrect: boolean,
  confidence: Confidence
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the SQL function for proper increment logic
    const { error } = await getSupabaseAdmin().rpc('update_memory_state_after_sr', {
      p_user_id: userId,
      p_quiz_id: quizId,
      p_question_id: questionId,
      p_is_correct: isCorrect,
      p_confidence: confidence,
    });
    
    if (error) {
      console.error('[BucketSystem] Error updating memory state:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (e) {
    console.error('[BucketSystem] Update error:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * Batch update for multiple questions after SR completion.
 */
export async function batchUpdateMemoryStatesAfterSR(
  userId: string,
  quizId: string,
  answers: QuestionAnswer[]
): Promise<{ success: boolean; updated: number; error?: string }> {
  let updated = 0;
  
  for (const answer of answers) {
    // Use direct SQL for proper increment
    const { error } = await getSupabaseAdmin().rpc('update_memory_state_after_sr', {
      p_user_id: userId,
      p_quiz_id: quizId,
      p_question_id: answer.questionId,
      p_is_correct: answer.isCorrect,
      p_confidence: answer.confidence,
    });
    
    if (!error) updated++;
  }
  
  return { success: updated === answers.length, updated };
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY: CHECK IF MEMORY STATES EXIST
// ═══════════════════════════════════════════════════════════════════

/**
 * Checks if memory states exist for a user+quiz (i.e., was initial quiz done?)
 */
export async function hasMemoryStates(
  userId: string,
  quizId: string
): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from('question_memory_states')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quiz_id', quizId);
  
  if (error) {
    console.error('[BucketSystem] Error checking memory states:', error);
    return false;
  }
  
  return (count || 0) > 0;
}
