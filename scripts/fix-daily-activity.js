
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// IST Offset in ms (5 hours 30 mins)
const OFFSET_MS = (5 * 60 * 60 * 1000) + (30 * 60 * 1000);

async function fixDailyActivity() {
  console.log('--- Fixing Daily Activity (Applying +5:30 TZ Offset) ---');

  // 1. Fetch all quiz attempts
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('user_id, completed_at');

  if (error) {
    console.error('❌ Error fetching attempts:', error);
    return;
  }

  // 2. Clear existing entries to prevent duplicates/confusion? 
  // Ideally yes, but let's just Upsert. Upsert will overwrite.
  // BUT: If a count moves from Jan 19 to Jan 20, the Jan 19 entry might remain with a high count?
  // Yes. We should zero out or delete old entries first? 
  // Deleting everything is safest for a re-calc.
  
  if (attempts.length > 0) {
      console.log('Deleting existing daily_activity rows to ensure clean slate...');
      const { error: delError } = await supabase
        .from('daily_activity')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (unsafe filter workaround)
      
      // Supabase delete requires a filter. 
      // safer: delete where user_id matches the users found in attempts.
      const userIds = [...new Set(attempts.map(a => a.user_id))];
      for (const uid of userIds) {
          await supabase.from('daily_activity').delete().eq('user_id', uid);
      }
  }

  const dailyCounts = {}; 

  attempts.forEach(a => {
    // Convert UTC timestamp to Local (IST) Date
    const utcDate = new Date(a.completed_at);
    const localDate = new Date(utcDate.getTime() + OFFSET_MS);
    const dateStr = localDate.toISOString().split('T')[0];
    
    const key = `${a.user_id}::${dateStr}`;

    if (!dailyCounts[key]) {
        dailyCounts[key] = {
            user_id: a.user_id,
            activity_date: dateStr,
            count: 0
        };
    }
    dailyCounts[key].count++;
  });

  const records = Object.values(dailyCounts).map(item => ({
      user_id: item.user_id,
      activity_date: item.activity_date,
      quizzes_completed: item.count
  }));

  console.log(`Prepared ${records.length} corrected daily records.`);

  // 3. Upsert
  const { error: upsertError } = await supabase
    .from('daily_activity')
    .upsert(records, { onConflict: 'user_id, activity_date' });

  if (upsertError) {
      console.error('❌ Error upserting:', upsertError);
  } else {
      console.log('✅ Fix successful!');
      // print records for Jan 19 and 20
      console.log(records.filter(r => r.activity_date === '2026-01-20' || r.activity_date === '2026-01-19'));
  }
}

fixDailyActivity();
