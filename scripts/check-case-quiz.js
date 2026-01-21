
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCaseQuiz() {
  console.log('--- Checking Contemporary Case Quizzes ---');
  
  // Find match by title
  const { data: cases, error } = await supabase
    .from('contemporary_case_quizzes')
    .select('*')
    .ilike('case_name', '%Delhi Pollution%')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (cases && cases.length > 0) {
      console.log('✅ Found in contemporary_case_quizzes:', cases[0]);
  } else {
      console.log('❌ Not found in contemporary_case_quizzes either.');
      
      // Try 'mock_tests' just in case
      const { data: mocks } = await supabase.from('mock_tests').select('*').ilike('title', '%Delhi Pollution%').limit(1);
      if (mocks && mocks.length > 0) console.log('✅ Found in mock_tests:', mocks[0]);
  }
}

checkCaseQuiz();
