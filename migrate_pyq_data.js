const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePyqData() {
  try {
    console.log('Starting PYQ data migration...');

    // 1. First, get all unique passages from the old table
    console.log('Fetching passages from old table...');
    const { data: oldData, error: fetchError } = await supabase
      .from('pyqs_2020')
      .select('passage_number, passage')
      .order('passage_number');

    if (fetchError) {
      console.error('Error fetching old data:', fetchError);
      return;
    }

    if (!oldData || oldData.length === 0) {
      console.log('No data found in old table');
      return;
    }

    // 2. Extract unique passages
    const uniquePassages = [];
    const seenPassages = new Set();

    oldData.forEach(row => {
      if (!seenPassages.has(row.passage_number)) {
        uniquePassages.push({
          passage_number: row.passage_number,
          passage: row.passage
        });
        seenPassages.add(row.passage_number);
      }
    });

    console.log(`Found ${uniquePassages.length} unique passages`);

    // 3. Insert passages into new table
    console.log('Inserting passages...');
    const { error: passagesError } = await supabase
      .from('pyq_2020_passages')
      .insert(uniquePassages);

    if (passagesError) {
      console.error('Error inserting passages:', passagesError);
      return;
    }

    console.log('Passages inserted successfully');

    // 4. Get all questions from old table
    console.log('Fetching questions from old table...');
    const { data: questionsData, error: questionsError } = await supabase
      .from('pyqs_2020')
      .select('passage_number, question_no, question, option_a, option_b, option_c, option_d, correct_answer')
      .order('passage_number, question_no');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }

    // 5. Insert questions into new table
    console.log('Inserting questions...');
    const { error: questionsInsertError } = await supabase
      .from('pyq_2020_questions')
      .insert(questionsData);

    if (questionsInsertError) {
      console.error('Error inserting questions:', questionsInsertError);
      return;
    }

    console.log('Questions inserted successfully');

    // 6. Verify the migration
    console.log('Verifying migration...');
    const { data: passageCount } = await supabase
      .from('pyq_2020_passages')
      .select('*', { count: 'exact', head: true });

    const { data: questionCount } = await supabase
      .from('pyq_2020_questions')
      .select('*', { count: 'exact', head: true });

    console.log(`Migration complete!`);
    console.log(`- Passages: ${passageCount}`);
    console.log(`- Questions: ${questionCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migratePyqData();
