const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importPyqData() {
  try {
    console.log("Starting PYQ data import...");

    // Read CSV file
    const csvContent = fs.readFileSync("./content/2020_pyq.csv", "utf-8");
    const lines = csvContent.split("\n");

    // Skip header
    const dataLines = lines.slice(1).filter((line) => line.trim());

    console.log(`Processing ${dataLines.length} lines...`);

    // Parse CSV data
    const passages = new Map();
    const questions = [];

    dataLines.forEach((line, index) => {
      // Simple CSV parsing (assuming no commas in the actual content)
      const columns = line.split(",");

      if (columns.length >= 9) {
        const passageNumber = parseInt(columns[0]);
        const passage = columns[1];
        const questionNo = parseInt(columns[2]);
        const question = columns[3];
        const optionA = columns[4];
        const optionB = columns[5];
        const optionC = columns[6];
        const optionD = columns[7];
        const correctAnswer = columns[8];

        // Store unique passages
        if (!passages.has(passageNumber)) {
          passages.set(passageNumber, {
            passage_number: passageNumber,
            passage: passage,
          });
        }

        // Store questions
        questions.push({
          passage_number: passageNumber,
          question_no: questionNo,
          question: question,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
        });
      }
    });

    console.log(
      `Found ${passages.size} unique passages and ${questions.length} questions`
    );

    // Insert passages first
    console.log("Inserting passages...");
    const passageArray = Array.from(passages.values());
    const { error: passagesError } = await supabase
      .from("pyq_2020_passages")
      .insert(passageArray);

    if (passagesError) {
      console.error("Error inserting passages:", passagesError);
      return;
    }

    console.log("Passages inserted successfully");

    // Insert questions
    console.log("Inserting questions...");
    const { error: questionsError } = await supabase
      .from("pyq_2020_questions")
      .insert(questions);

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      return;
    }

    console.log("Questions inserted successfully");

    // Verify the import
    const { data: passageCount } = await supabase
      .from("pyq_2020_passages")
      .select("*", { count: "exact", head: true });

    const { data: questionCount } = await supabase
      .from("pyq_2020_questions")
      .select("*", { count: "exact", head: true });

    console.log(`Import complete!`);
    console.log(`- Passages: ${passageCount}`);
    console.log(`- Questions: ${questionCount}`);
  } catch (error) {
    console.error("Import failed:", error);
  }
}

importPyqData();
