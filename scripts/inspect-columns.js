
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('--- Inspecting attached_quizzes Columns ---');
  
  // Trick to get column structure: select * limit 0
  const { data, error } = await supabase
    .from('attached_quizzes')
    .select('*')
    .limit(1);

  if (error) {
      console.error('Error fetching attached_quizzes:', error);
  } else {
      console.log('Sample Row (Keys):', data.length > 0 ? Object.keys(data[0]) : 'No rows found');
      if (data.length > 0) console.log(data[0]);
  }

  console.log('\n--- Inspecting spaced_repetition_schedules ---');
  const { data: srs, error: srsError } = await supabase
    .from('spaced_repetition_schedules')
    .select('quiz_id')
    .limit(1);
    
  if (srsError) console.error('Error fetching SRS:', srsError);
  else console.log('SRS Sample:', srs);
}

inspectSchema();
