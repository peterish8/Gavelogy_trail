/**
 * Calculate points for an answer based on correctness and speed.
 * 
 * Formula:
 * - Base Points: 10 (if correct)
 * - Speed Bonus: Max 5 points
 * - Wrong Answer: 0 points
 * 
 * @param isCorrect Whether the answer is correct
 * @param timeTakenMs Time taken in milliseconds
 * @param maxTimeMs Max time allowed (default 45000ms)
 * @returns Points earned (integer)
 */
export function calculatePoints(isCorrect: boolean, timeTakenMs: number, maxTimeMs = 45000): number {
  if (!isCorrect) return 0;
  
  const BASE_POINTS = 10;
  const MAX_SPEED_BONUS = 5;
  
  // Clamp time taken
  const clampedTime = Math.max(0, Math.min(timeTakenMs, maxTimeMs));
  
  // Linear decay for speed bonus
  // If time is 0s: Bonus = 5
  // If time is 45s: Bonus = 0
  const speedRatio = 1 - (clampedTime / maxTimeMs);
  const speedBonus = MAX_SPEED_BONUS * speedRatio;
  
  return Math.round(BASE_POINTS + speedBonus);
}
