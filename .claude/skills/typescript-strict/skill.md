---
name: TypeScript Strict Mode
description: Load when dealing with TypeScript errors, type utilities, generics, strict mode patterns, or type-safe Supabase/Zustand integrations
---

# Purpose
TypeScript 5 strict mode patterns used in Gavelogy — type utilities, discriminated unions, generic hooks, and type-safe database access.

# When to Use
- Fixing TypeScript errors
- Writing new type definitions
- Creating generic components or hooks
- Typing Supabase responses
- Using complex Zustand store types

# Setup
`tsconfig.json` in this project:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] },
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

Note: `ignoreBuildErrors: true` in `next.config.ts` — errors don't block builds but should still be fixed.

# Core Concepts

## Key Types (`src/types/index.ts`)
```ts
interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile extends User {
  xp: number;
  total_coins: number;
  streak_count: number;
  longest_streak: number;
  role: 'student' | 'admin';
}

interface QuizQuestion {
  qid: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subject: string;
}

type ConfidenceLevel = 'confident' | 'guess' | 'fluke';
type GameMode = 'duel' | 'speed_court' | 'battle_royale' | 'tag_team';
type GameStatus = 'idle' | 'matchmaking' | 'waiting' | 'pregame' | 'active' | 'finished';
```

## Discriminated Unions (useful for game/quiz states)
```ts
type QuizState =
  | { status: 'loading' }
  | { status: 'active'; currentQuestion: QuizQuestion; questionIndex: number }
  | { status: 'complete'; score: number; total: number }
  | { status: 'error'; message: string };

function QuizRenderer({ state }: { state: QuizState }) {
  switch (state.status) {
    case 'loading': return <Skeleton />;
    case 'active': return <QuestionCard question={state.currentQuestion} />;
    case 'complete': return <ResultsPanel score={state.score} />;
    case 'error': return <ErrorMessage message={state.message} />;
  }
}
```

# Best Practices

## Generic Data Fetching Hook
```ts
function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queryFn().then(({ data, error }) => {
      if (error) setError(error.message);
      else setData(data);
      setLoading(false);
    });
  }, []);

  return { data, loading, error };
}

// Usage
const { data: profile, loading } = useSupabaseQuery<UserProfile>(() =>
  supabase.from('users').select('*').eq('id', userId).single()
);
```

## Type-Safe Component Props
```ts
// With CVA variants
import { VariantProps } from 'class-variance-authority';

const badgeVariants = cva('...', {
  variants: { variant: { default: '...', success: '...', warning: '...' } },
});

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

## Narrowing Patterns
```ts
// Type guard for Supabase responses
function isSupabaseError(error: unknown): error is { message: string; code: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Null coalescing chains
const username = profile?.username ?? user?.email?.split('@')[0] ?? 'Anonymous';

// Non-null assertion (use sparingly, document why)
const canvas = ref.current!; // Safe here — only called after mount check
```

## Utility Types in Practice
```ts
// Partial for optional updates
type ProfileUpdate = Partial<Pick<UserProfile, 'username' | 'full_name' | 'avatar_url'>>;

// Omit for insert types (DB generates id/created_at)
type NewMistake = Omit<Mistake, 'id' | 'created_at'>;

// Record for dynamic mappings
type AnswerMap = Record<string, { answer: string; timeTaken: number }>;
type SubjectAccuracy = Record<string, number>;

// Extract for union subset
type PaidGameMode = Extract<GameMode, 'speed_court' | 'battle_royale' | 'tag_team'>;
```

## Zustand Store Typing
```ts
// Define interface, then use as generic
interface GameStore {
  mode: GameMode | null;
  setMode: (mode: GameMode) => void;
}

// Correct: pass interface as generic
export const useGameStore = create<GameStore>()((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
}));

// With persist middleware — type the state subset
const useGameStore = create<GameStore>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'game',
      partialize: (state): Pick<GameStore, 'mode'> => ({ mode: state.mode }),
    }
  )
);
```

# Code Examples

## Typed API Route Handler
```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SaveAttemptSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.enum(['A', 'B', 'C', 'D']),
    confidence: z.enum(['confident', 'guess', 'fluke']),
    timeTaken: z.number().positive(),
  })),
  score: z.number().min(0).max(100),
});

type SaveAttemptPayload = z.infer<typeof SaveAttemptSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const result = SaveAttemptSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const payload: SaveAttemptPayload = result.data;
  // proceed with typed payload
}
```

## Typed Custom Hook
```ts
interface UseQuizOptions {
  subject: string;
  mode: 'practice' | 'exam';
  questionCount?: number;
}

interface UseQuizReturn {
  questions: QuizQuestion[];
  currentIndex: number;
  answer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => void;
  isComplete: boolean;
  score: number;
}

function useQuiz({ subject, mode, questionCount = 10 }: UseQuizOptions): UseQuizReturn {
  // implementation...
}
```

# Common Pitfalls

1. **`as any` to suppress errors** → masks real bugs; use proper type narrowing
2. **`!` non-null assertion without comment** → makes code brittle; always document why it's safe
3. **Not typing `useState` initial value** → inferred as `never` if null: use `useState<User | null>(null)`
4. **Forgetting `await params`** in Next.js 15 → `params` is now `Promise<{...}>` not `{...}`
5. **`Object.keys()` returns `string[]`**  not typed keys → use `(Object.keys(obj) as (keyof typeof obj)[])`

# Performance Notes
- TypeScript compilation is handled by Turbopack (no `tsc` in dev hot path)
- `skipLibCheck: true` — skips type checking third-party `.d.ts` files → faster builds
- Use `type` imports for type-only imports (helps tree-shaking): `import type { User } from '@/types'`
- `incremental: true` in tsconfig — caches compilation for faster rebuilds

# Testing Strategy
```ts
// Use satisfies operator for type-checking test data
const mockUser = {
  id: 'uuid-123',
  email: 'test@gavelogy.com',
  username: 'testuser',
  // ...
} satisfies User; // ensures all required fields are present and typed

// Verify type narrowing works as expected
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```

# Upgrade / Versioning Notes
- **TypeScript 5.5**: `--noUncheckedSideEffectImports` — stricter module checking
- **TypeScript 5.6+**: Improved narrowing for union types and template literals
- Run `npx tsc --noEmit` to check for errors without building
- Watch: https://devblogs.microsoft.com/typescript/

# Related Skills
- `zustand-state-management` — Complex store type patterns
- `supabase-integration` — Typed database queries with generated types
- `nextjs-app-router` — Typed route params and page props
