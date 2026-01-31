
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMocks() {
  console.log('--- Checking Mocks ---');
  const { data: mocks } = await supabase
    .from('mock_tests')
    .select('*')
    .ilike('title', '%Delhi Pollution%')
    .limit(1);
  
  console.log('Mock data:', mocks);

  if (mocks && mocks.length > 0) {
      console.log('✅ Found in mock_tests:', mocks[0]);
  } else {
      console.log('❌ Not found in mock_tests.');
  }
}

checkMocks();
