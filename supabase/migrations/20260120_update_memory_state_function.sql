-- =============================================
-- SQL FUNCTION: update_memory_state_after_sr
-- =============================================
-- This function updates a question's memory state after a spaced repetition attempt.
-- It handles the increment logic properly and ensures bucket NEVER changes.
-- =============================================

CREATE OR REPLACE FUNCTION update_memory_state_after_sr(
  p_user_id UUID,
  p_quiz_id UUID,
  p_question_id TEXT,
  p_is_correct BOOLEAN,
  p_confidence TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE question_memory_states
  SET
    times_shown = times_shown + 1,
    times_correct = CASE WHEN p_is_correct THEN times_correct + 1 ELSE times_correct END,
    last_was_wrong = NOT p_is_correct,
    last_shown_at = NOW(),
    last_confidence = p_confidence
    -- ⚠️ BUCKET NEVER CHANGES
  WHERE 
    user_id = p_user_id 
    AND quiz_id = p_quiz_id 
    AND question_id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_memory_state_after_sr TO authenticated;
GRANT EXECUTE ON FUNCTION update_memory_state_after_sr TO service_role;
