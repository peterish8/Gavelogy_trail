
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function traceNoteItem() {
  console.log('--- Tracing Note Item ID ---');
  
  // 1. Get note_item_id for the quiz
  const { data: quiz, error } = await supabase
    .from('attached_quizzes')
    .select('id, title, note_item_id')
    .ilike('title', '%Delhi Pollution%')
    .limit(1)
    .single();

  if (error || !quiz) {
      console.log('❌ Quiz not found in attached_quizzes.');
      return;
  }

  console.log('✅ Quiz Found:', quiz.title);
  console.log('   Note Item ID:', quiz.note_item_id);

  if (!quiz.note_item_id) {
       console.log('❌ Quiz has no note_item_id.');
       return;
  }

  // 2. Inspect 'structure_items' (assuming note_item_id points there?)
  // Or maybe 'notes'?
  // Let's try 'structure_items' first as commonly used name
  
  const { data: item, error: itemError } = await supabase
    .from('structure_items')
    .select('id, title, course_id, parent_id')
    .eq('id', quiz.note_item_id)
    .single();

  if (item) {
      console.log('✅ Found in structure_items:', item);
      console.log('   Course ID:', item.course_id);
  } else {
      console.log('❌ Not found in structure_items. Trying "notes" table?');
      // Try 'notes' ?? Not sure if exists.
  }
}

traceNoteItem();
