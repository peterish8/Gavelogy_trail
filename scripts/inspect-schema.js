
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTable() {
  console.log('--- Inspecting attached_quizzes ---');
  
  // Try to insert/select from attached_quizzes to see structure or error
  const { data, error } = await supabase
    .from('attached_quizzes')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error selecting from attached_quizzes:', error.message);
    
    // Fallback: Check 'quizzes' table
    console.log('--- Inspecting quizzes ---');
    const { data: qData, error: qError } = await supabase
        .from('quizzes')
        .select('*, subject:subjects(id)')
        .limit(1);
        
    if (qError) {
        console.log('Error selecting from quizzes:', qError.message);
    } else {
        console.log('Success selecting from quizzes. Sample:', qData);
    }
  } else {
    console.log('Success selecting from attached_quizzes. Sample:', data);
    
    // Check relation
    const { data: relData, error: relError } = await supabase
        .from('attached_quizzes')
        .select('*, subject:subjects(title)') // Trying to join
        .limit(1);
        
    if (relError) console.log('Relational Select Error:', relError.message);
    else console.log('Relational Select Success');
  }
}

inspectTable();
