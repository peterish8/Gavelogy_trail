
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  const userId = '847adb67-dbc1-4450-b595-f02dcf28ccbf';
  const quizId = '40ebcb9d-bf05-4233-a425-b6ec91634814';

  console.log(`Checking for Schedule: User ${userId}, Quiz ${quizId}`);

  const { data, error } = await supabase
    .from('spaced_repetition_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId);

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Result:', data);
    if (data.length === 0) {
        console.log('❌ NO ROW FOUND! The insert failed or was rolled back.');
    } else {
        console.log('✅ ROW FOUND:', data[0]);
    }
  }
}

verifyData();
