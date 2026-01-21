
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDeepJoin() {
  console.log('--- Testing Deep Join (Schedule -> Quiz -> Structure) ---');
  
  // Attempt to select course_id from structure_items via attached_quizzes
  // Note: attached_quizzes is a VIEW. Deep joins might fail if relations aren't detected.
  
  const { data, error } = await supabase
    .from('spaced_repetition_schedules')
    .select(`
      id,
      quiz:attached_quizzes!inner (
        id,
        title,
        note_item_id
        
        // Try to join structure_items. 
        // We need to guess the relation name. usually based on FK.
        // If attached_quizzes.note_item_id is a FK to structure_items.id
      )
    `)
    .limit(1);
    
    // I will try to add the nested select if I knew the relation name. 
    // But since I don't know if the View has the relation preserved, 
    // I'll try to just check if I can join "structure_items"
    
  console.log('Basic Fetch Result:', error ? error.message : 'Success');
  
  if (!error && data.length > 0) {
      console.log('Trying Deep Join...');
      const { data: deepData, error: deepError } = await supabase
        .from('spaced_repetition_schedules')
        .select(`
          id,
          quiz:attached_quizzes!inner (
             id,
             title,
             structure_items (
                course_id
             )
          )
        `)
        .limit(1);
        
      if (deepError) {
          console.log('❌ Deep Join Failed:', deepError.message);
          console.log('   Reason: Views often lose FK relationships for auto-detection.');
      } else {
          console.log('✅ Deep Join Success!');
          console.log(JSON.stringify(deepData, null, 2));
      }
  }
}

testDeepJoin();
