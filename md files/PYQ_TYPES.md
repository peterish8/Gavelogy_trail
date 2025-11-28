# PYQ Data Types

## TypeScript Interface

```typescript
export interface PYQQuestion {
  id: string;
  year: number; // 2020, 2021, 2022, 2023, 2024, 2025
  question_number: number;
  question_id: string; // e.g., "PYQ-2020-01"

  // Question Content
  passage: string | null;
  question: string;

  // Multiple Choice Options
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;

  // Answer & Explanation
  correct_answer: string; // "(A)", "(B)", "(C)", "(D)"
  explanation: string | null; // Can be null for mock exams

  // Subject/Topic Classification (optional)
  subject: string | null; // e.g., "Constitutional Law"
  topic: string | null; // e.g., "Article 16"

  // Source Information
  source_case: string | null;
  source_page: string | null;

  // Metadata
  difficulty: "easy" | "medium" | "hard";
  marks: number;

  // Mock Exam Settings
  is_mock_question: boolean; // Whether this is a mock exam question
  show_explanation: boolean; // Whether to show explanation after submission

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

## Example Data Structure

### Mock Exam Question (No Explanation)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "year": 2020,
  "question_number": 1,
  "question_id": "PYQ-2020-01",
  "passage": "―9. We now come to the Division Bench judgment of this Court reported as Rajeev Kumar Gupta & Others v. Union of India & Others – (2016) 13 SCC 153...",
  "question": "The above passage has been taken from which of the following recent judgments, relating to the question of reservation in promotions for the disabled persons?",
  "option_a": "National Federation of the Blind v. Sanjay Kothari, Secy. Deptt. of Personnel and Training.",
  "option_b": "Siddaraju v. State of Karnataka & Ors.",
  "option_c": "Rajeev Kumar Gupta & Ors. v. Union of India & Ors.",
  "option_d": "Ashok Kumar v. Union of India & Ors.",
  "correct_answer": "(B)",
  "explanation": null,
  "subject": "Constitutional Law",
  "topic": "Reservation in Promotion",
  "source_case": "Siddaraju v. State of Karnataka & Ors.",
  "source_page": "Page 2 of 35",
  "difficulty": "medium",
  "marks": 1,
  "is_mock_question": true,
  "show_explanation": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Regular Practice Question (With Explanation)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "year": 2020,
  "question_number": 2,
  "question_id": "PYQ-2020-02",
  "passage": null,
  "question": "Which of the following is true in context of the scheme provided under Article 16 of the Indian Constitution, relating to reservation in promotion?",
  "option_a": "Reservation in promotion can only be granted to the class of citizens mentioned under Article 16 (4).",
  "option_b": "Reservation in promotion cannot be granted to a class of citizen provided by the virtue of Article 16 (1).",
  "option_c": "The scheme of reservation in promotion can be extended to any class of citizens under the scheme of Article 16 (1).",
  "option_d": "Reservation in promotion defeats the scheme of Article 16 (1) and Article 15 (1).",
  "correct_answer": "(C)",
  "explanation": "Article 16(1) allows differential treatment for any class of citizens, not just backward classes mentioned in Article 16(4). The scheme of reservation in promotion can be extended to any class of citizens under Article 16(1), provided it is consistent with the constitutional mandate.",
  "subject": "Constitutional Law",
  "topic": "Article 16",
  "source_case": "Siddaraju v. State of Karnataka & Ors.",
  "source_page": "Page 2 of 35",
  "difficulty": "medium",
  "marks": 1,
  "is_mock_question": false,
  "show_explanation": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## CSV Import Format

For the PYQ data you provided, the CSV should have these columns:

```csv
year,question_number,question_id,passage,question,option_a,option_b,option_c,option_d,correct_answer,explanation,subject,topic,source_case,source_page,difficulty,marks
2020,1,PYQ-2020-01,"Excerpt taken from...","The above passage has been taken from which of the following...","Option A text","Option B text","Option C text","Option D text","(B)","Explanation text","Constitutional Law","Reservation in Promotion","Siddaraju v. State of Karnataka & Ors.","Page 2 of 35","medium",1
```

## Key Features

1. **Year-based organization**: Questions are tagged by year (2020-2025)
2. **Unique question IDs**: Each question has a unique identifier
3. **Passage support**: Optional passage/context for questions
4. **Subject classification**: Optional subject and topic fields
5. **Source tracking**: Reference to source cases and page numbers
6. **Difficulty levels**: Easy, medium, hard classification
7. **Mock exam mode**: Questions can be marked as mock exam questions
8. **Explanation control**: Can hide explanations during mock exams
9. **Flexible schema**: Most fields are optional except core question data

## Mock Exam Behavior

For **mock exam questions** (`is_mock_question: true`):

- **No instant feedback**: After selecting an answer, the user proceeds to the next question
- **No explanations shown**: Explanations are hidden during the exam
- **Results after submission**: All answers, correct/incorrect status, and explanations are shown only after the entire exam is submitted
- **JEE-style UI**: Similar to JEE exam interface with:
  - Question navigation (Previous/Next)
  - Question paper navigation (Jump to any question)
  - Timer countdown
  - Submit button at the end
  - Results page showing:
    - Total questions attempted
    - Correct answers count
    - Incorrect answers count
    - Accuracy percentage
    - Question-wise breakdown with explanations

## Usage Examples

### Fetch all questions for a specific year

```typescript
const { data } = await supabase
  .from("pyqs")
  .select("*")
  .eq("year", 2020)
  .order("question_number");
```

### Fetch questions by subject

```typescript
const { data } = await supabase
  .from("pyqs")
  .select("*")
  .eq("subject", "Constitutional Law")
  .order("year", "question_number");
```

### Fetch a specific question

```typescript
const { data } = await supabase
  .from("pyqs")
  .select("*")
  .eq("question_id", "PYQ-2020-01")
  .single();
```
