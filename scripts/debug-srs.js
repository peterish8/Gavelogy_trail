
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars. URL:", !!supabaseUrl, "KEY:", !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock Config since we can't import TS directly easily in node script without compile
const calculateNextIntervalDays = (stage) => {
    // Stage -1 -> 1
    // Stage 0 -> 2
    if (stage === -1) return 1;
    return 2; 
};

async function runDebug() {
  console.log("--- Starting SRS Debug ---");
  
  // 1. Check Table Exists
  const { error: tableError } = await supabase.from('spaced_repetition_schedules').select('count', { count: 'exact', head: true });
  if (tableError) {
    console.error("CRITICAL: Table Access Error:", tableError);
    // Likely 42P01 if table missing
  } else {
    console.log("1. Table 'spaced_repetition_schedules' access OK.");
  }

  // 2. Simulate Save Attempt
  const fakeUserId = '00000000-0000-0000-0000-000000000001'; // Valid UUID format
  // Use a REAL quiz ID if valid FK is enforced?
  // Migration says: quiz_id references attached_quizzes(id).
  // I need a valid quiz ID.
  const { data: q } = await supabase.from('attached_quizzes').select('id').limit(1).single();
  const fakeQuizId = q ? q.id : '00000000-0000-0000-0000-000000000000'; // Fallback
  console.log(`2. Simulating User: ${fakeUserId}, Quiz: ${fakeQuizId}`);
  
  const gap = calculateNextIntervalDays(-1); // 1
  const nextDueAt = new Date();
  nextDueAt.setDate(nextDueAt.getDate() + gap);

  const payload = {
    user_id: fakeUserId,
    quiz_id: fakeQuizId,
    last_completed_at: new Date().toISOString(),
    status: 'active',
    current_stage_index: 0,
    next_due_at: nextDueAt.toISOString()
  };

  const { data, error: upsertError } = await supabase
    .from('spaced_repetition_schedules') 
    .upsert(payload, { onConflict: 'user_id,quiz_id' }) 
    .select();

  if (upsertError) {
    console.error("3. Upsert FAILED:", upsertError);
  } else {
    console.log("3. Upsert SUCCESS:", data);
  }

}

runDebug();
