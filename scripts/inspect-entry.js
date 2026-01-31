
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectQuiz() {
  console.log('--- Searching for Quiz: Delhi Pollution Control... ---');
  
  // 1. Find the quiz in attached_quizzes by title pattern
  const { data: quizzes, error } = await supabase
    .from('attached_quizzes')
    .select('*')
    .ilike('title', '%Delhi Pollution%')
    .limit(1);

  if (error) {
      console.error('Error searching attached_quizzes:', error);
      return;
  }
  
  if (!quizzes || quizzes.length === 0) {
      console.log('❌ Quiz not found in attached_quizzes view.');
      return;
  }

  const quiz = quizzes[0];
  console.log('✅ Found in View:', quiz);
  console.log(`- ID: ${quiz.id}`);
  console.log(`- Subject ID: ${quiz.subject_id}`);

  if (quiz.subject_id) {
      // Check if this subject_id exists in subjects table
      const { data: subject, error: subjError } = await supabase
        .from('subjects')
        .select('id, course_id, name')
        .eq('id', quiz.subject_id)
        .single();
        
      if (subjError) {
          console.log(`❌ Subject lookup failed for ID ${quiz.subject_id}:`, subjError.message);
      } else {
          console.log('✅ Subject Found:', subject);
          
          if (subject.course_id) {
               console.log('✅ Course ID:', subject.course_id);
          } else {
               console.log('❌ Subject has no course_id.');
          }
      }
  } else {
      console.log('❌ Quiz has no subject_id in View.');
  }
  
  // Also check 'quizzes' table to see if it's there
  const { data: standardQuiz } = await supabase.from('quizzes').select('*').eq('id', quiz.id).single();
  console.log('In standard "quizzes" table?', !!standardQuiz);
}

inspectQuiz();
