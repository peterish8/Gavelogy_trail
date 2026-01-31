
export const SPACED_REPETITION_STAGES = [
  { index: 0, dayInterval: 1, label: "Shock Recall" },
  { index: 1, dayInterval: 3, label: "Stabilization" },
  { index: 2, dayInterval: 7, label: "Balanced Retrieval" },
  { index: 3, dayInterval: 21, label: "Long-term Check" },
  { index: 4, dayInterval: 30, label: "Exam Recall" },
  { index: 5, dayInterval: 45, label: "Reinforcement" },
  { index: 6, dayInterval: 60, label: "Final Memory Lock" },
] as const;

export const MAX_STAGE_INDEX = SPACED_REPETITION_STAGES.length - 1;

/**
 * Calculates the number of days to add to NOW for the next due date.
 * @param completedStageIndex The index of the stage just completed. -1 implies initial learning.
 */
export function calculateNextIntervalDays(completedStageIndex: number): number | null {
  // If finished final stage, no next date
  if (completedStageIndex >= MAX_STAGE_INDEX) {
    return null;
  }

  const nextStageIndex = completedStageIndex + 1;
  const nextStage = SPACED_REPETITION_STAGES[nextStageIndex];
  
  // Base case: First repetition (Start -> Day 1)
  if (completedStageIndex === -1) {
    return nextStage.dayInterval; // 1 day
  }

  const currentStage = SPACED_REPETITION_STAGES[completedStageIndex];
  
  // Diff logic: (Day 3 - Day 1) = 2 days gap
  return nextStage.dayInterval - currentStage.dayInterval;
}
