
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectData() {
  console.log('--- Inspecting Quiz Data ---');

  // 1. Get recent attempts
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('user_id, completed_at, score')
    .order('completed_at', { ascending: false })
    .limit(5);

  console.log('Recent Attempts:');
  console.table(attempts);

  if (attempts && attempts.length > 0) {
      const userId = attempts[0].user_id;
      
      // 2. Get daily activity for this user
      const { data: activity } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false })
        .limit(5);

      console.log('Daily Activity Entries:');
      console.table(activity);
  }
}

inspectData();
