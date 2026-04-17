---
name: Quiz & Spaced Repetition
description: Load when working with quizzes, mistake tracking, confidence levels, spaced repetition algorithm, or the recall question system
---

# Purpose
Gavelogy's quiz system with intelligent spaced repetition — weighted question selection based on past mistakes and confidence levels to optimize CLAT PG exam preparation.

# When to Use
- Building new quiz features
- Modifying question selection algorithm
- Debugging why certain questions appear too often/rarely
- Adding new confidence level tracking
- Building retake/practice modes

# Setup
Key files:
| File | Purpose |
|------|---------|
| `src/lib/quiz-loader.ts` | Loads quiz metadata + questions from Supabase |
| `src/lib/spaced-repetition-algorithm.ts` | Weighted selection logic |
| `src/hooks/use-spaced-repetition.ts` | React hook wrapping the algorithm |
| `src/lib/stores/quiz.ts` | Quiz attempt state |
| `src/lib/stores/mistakes.ts` | Persisted mistake tracking |
| `src/app/api/quiz/` | API routes for save/recall |

# Core Concepts

## Data Sources for Spaced Repetition
```
┌─────────────────────────┐     ┌──────────────────────────────┐
│ mistakes table          │     │ quiz_answer_confidence table  │
│ - question_id           │     │ - question_id                │
│ - is_cleared (bool)     │     │ - confidence: 'confident'    │
│ - created_at            │     │              'guess'          │
└────────────┬────────────┘     │              'fluke'          │
             │                  └───────────────┬──────────────┘
             │                                  │
             └─────────────┬────────────────────┘
                           ▼
              Weighted Question Pool
              (questions table filtered by subject)
```

## Weighting System
```ts
// src/lib/spaced-repetition-algorithm.ts
function calculateWeight(questionId: string, context: SpacedRepContext): number {
  let weight = 1; // base weight

  // Active mistake (not cleared) — highest priority
  if (context.activeMistakes.has(questionId)) {
    weight += 50;
  }

  // Low-confidence answer — high priority
  const confidence = context.confidenceMap.get(questionId);
  if (confidence === 'fluke') weight += 30;
  if (confidence === 'guess') weight += 20;

  // Random jitter — prevents repetitive patterns
  weight += Math.random() * 5;

  return weight;
}

function selectWeightedQuestion(
  questions: Question[],
  weights: Map<string, number>
): Question {
  const totalWeight = questions.reduce((s, q) => s + (weights.get(q.qid) ?? 1), 0);
  let random = Math.random() * totalWeight;

  for (const question of questions) {
    random -= weights.get(question.qid) ?? 1;
    if (random <= 0) return question;
  }
  return questions[questions.length - 1];
}
```

## Confidence Levels
```ts
type ConfidenceLevel = 'confident' | 'guess' | 'fluke';

// confident: User knew the answer — don't prioritize in review
// guess: User was unsure — moderate priority
// fluke: User got it right by luck — high priority (treat like a mistake)
```

## Mistake Lifecycle
```
Wrong answer recorded
       ↓
mistake inserted (is_cleared: false)
       ↓
Question gets +50 weight in spaced repetition
       ↓
User answers correctly with 'confident' → mark is_cleared: true
       ↓
Weight returns to baseline
```

# Best Practices

## Loading Recall Questions
```ts
// API route: GET /api/quiz/get-recall-questions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const limit = parseInt(searchParams.get('limit') ?? '10');

  const supabase = createBrowserClient(url, key);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Get active mistakes
  const { data: mistakes } = await supabase
    .from('mistakes')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('is_cleared', false)
    .eq('subject', subject);

  // 2. Get confidence data
  const { data: confidences } = await supabase
    .from('quiz_answer_confidence')
    .select('question_id, confidence')
    .eq('user_id', user.id)
    .in('confidence', ['guess', 'fluke']);

  // 3. Get all questions for subject
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', subject);

  // 4. Apply weighted selection
  const selected = selectWeightedQuestions(questions, mistakes, confidences, limit);

  return NextResponse.json({ questions: selected });
}
```

## Recording Quiz Answers
```ts
// API route: POST /api/quiz/save-attempt
const payload = {
  quizId: 'uuid',
  answers: [
    { questionId: 'q1', answer: 'B', confidence: 'confident', timeTaken: 12.4 },
    { questionId: 'q2', answer: 'A', confidence: 'guess', timeTaken: 28.1 },
  ],
  score: 8,
  totalQuestions: 10,
};
```

## Marking Mistakes
```ts
// POST /api/quiz/save-mistake
async function saveMistake(questionId: string, userAnswer: string, subject: string) {
  await supabase.from('mistakes').upsert(
    {
      user_id: userId,
      question_id: questionId,
      user_answer: userAnswer,
      subject,
      is_cleared: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,question_id' }
  );
}
```

## Clearing Mistakes (Mastery)
```ts
async function clearMistake(questionId: string) {
  await supabase.from('mistakes')
    .update({ is_cleared: true })
    .eq('user_id', userId)
    .eq('question_id', questionId);

  // Also update local store
  useMistakesStore.getState().clearMistake(questionId);
}
```

# Code Examples

## Quiz Hook Usage
```tsx
'use client';
import { useSpacedRepetition } from '@/hooks/use-spaced-repetition';

function RetakePage({ subject }: { subject: string }) {
  const { questions, loading, recordAnswer, nextQuestion, isComplete } =
    useSpacedRepetition({ subject, limit: 20 });

  if (loading) return <QuizSkeleton />;
  if (isComplete) return <ResultsSummary />;

  const current = questions[currentIndex];

  return (
    <QuizCard
      question={current}
      onAnswer={(answer, confidence) => {
        recordAnswer(current.qid, answer, confidence);
        nextQuestion();
      }}
    />
  );
}
```

## Confidence UI Component
```tsx
function ConfidencePicker({ onSelect }: { onSelect: (c: ConfidenceLevel) => void }) {
  return (
    <div className="flex gap-2 mt-4">
      {[
        { value: 'confident', label: "I knew it!", color: 'bg-green-500' },
        { value: 'guess', label: "Good guess", color: 'bg-yellow-500' },
        { value: 'fluke', label: "Lucky fluke", color: 'bg-red-500' },
      ].map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => onSelect(value as ConfidenceLevel)}
          className={cn('flex-1 rounded-lg py-2 text-white text-sm font-medium', color)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

## Mistake Dashboard Stats
```tsx
function MistakesSummary() {
  const mistakes = useMistakesStore((s) => s.mistakes);
  const active = mistakes.filter(m => !m.is_cleared);
  const bySubject = groupBy(active, 'subject');

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(bySubject).map(([subject, items]) => (
        <StatCard key={subject} label={subject} value={items.length} />
      ))}
    </div>
  );
}
```

# Common Pitfalls

1. **Not upsert-ing mistakes** → duplicate entries for the same question
2. **Forgetting to clear mistakes after mastery** → question stays high-weight forever
3. **Treating 'fluke' same as 'confident'** → missed review opportunity
4. **Not applying random jitter** → algorithm produces deterministic patterns (boring)
5. **Fetching all questions without pagination** → slow for large question banks (> 500)
6. **Confidence not recorded for game answers** → only quiz answers have confidence tracking

# Performance Notes
- Question selection runs client-side with pre-fetched data — very fast
- Cache active mistakes in Zustand store — avoid re-fetching on every question
- Paginate question bank queries: `select('*').range(0, 99)` for first 100 questions
- Batch confidence saves: collect during quiz, save once at end of attempt

# Security Notes
- Validate `subject` parameter — enum check before querying
- Don't expose `correct_answer` in GET question responses until answer is submitted
- Rate-limit save-attempt endpoint (prevent XP farming via repeated saves)

# Testing Strategy
```ts
describe('spaced repetition algorithm', () => {
  it('mistakes get 50x weight boost', () => {
    const weights = buildWeightMap(questions, { activeMistakes: new Set(['q1']) });
    expect(weights.get('q1')).toBeGreaterThan(50);
    expect(weights.get('q2')).toBeLessThan(10);
  });

  it('fluke confidence gets weight boost', () => {
    const weights = buildWeightMap(questions, {
      activeMistakes: new Set(),
      confidenceMap: new Map([['q1', 'fluke']]),
    });
    expect(weights.get('q1')).toBeGreaterThan(25);
  });

  it('cleared mistakes return to baseline', () => {
    const weights = buildWeightMap(questions, {
      activeMistakes: new Set(), // q1 cleared
      confidenceMap: new Map(),
    });
    expect(weights.get('q1')).toBeLessThan(10);
  });
});
```

# Upgrade / Versioning Notes
- Current algorithm is simple weighted random — consider SM-2 or FSRS for more accurate spaced repetition
- SM-2 adds interval tracking (next review after 1 day, then 4 days, then 10 days...)
- FSRS (Free Spaced Repetition Scheduler) is state-of-the-art as of 2024
- Migration would require adding `next_review_date` and `ease_factor` columns to mistakes table

# Related Skills
- `supabase-integration` — Query patterns for mistakes/confidence tables
- `dashboard-analytics` — Displaying mistake trends and progress
- `gamification-engine` — Quiz answers also affect XP/coins in game modes
