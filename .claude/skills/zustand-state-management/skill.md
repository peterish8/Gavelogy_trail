---
name: Zustand State Management
description: Load when creating or modifying Zustand stores — auth, game, quiz, mistakes, streaks, preferences, or any new store
---

# Purpose
Zustand 5 patterns used across Gavelogy's stores — persistence, devtools, slices, and integration with React components and Supabase auth.

# When to Use
- Creating a new Zustand store
- Adding state to an existing store
- Debugging stale state or hydration issues
- Integrating store state with Supabase data
- Optimizing re-render performance

# Setup
```bash
# Already installed
npm install zustand  # v5.0.8
```

# Core Concepts

## Stores in Gavelogy
| Store | File | Persisted |
|-------|------|-----------|
| Auth | `lib/stores/auth.ts` | Yes — user, profile, session |
| Game | `lib/stores/game-store.ts` | No — runtime only |
| Quiz | `lib/stores/quiz.ts` | Partial |
| Mistakes | `lib/stores/mistakes.ts` | Yes |
| Streaks | `lib/stores/streaks.ts` | Yes |
| Theme | `lib/stores/theme.ts` | Yes |
| Sidebar | `lib/stores/sidebar-store.ts` | Yes |
| Preferences | `lib/stores/preferences.ts` | Yes |
| Loading | `lib/stores/loading-store.ts` | No |

## Basic Store Pattern (Zustand 5)
```ts
import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  isDark: false,
  toggle: () => set((state) => ({ isDark: !state.isDark })),
  setDark: (value) => set({ isDark: value }),
}));
```

## Persisted Store Pattern
```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MistakesStore {
  mistakes: Mistake[];
  addMistake: (m: Mistake) => void;
  clearMistake: (id: string) => void;
}

export const useMistakesStore = create<MistakesStore>()(
  persist(
    (set) => ({
      mistakes: [],
      addMistake: (m) => set((state) => ({ mistakes: [...state.mistakes, m] })),
      clearMistake: (id) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, is_cleared: true } : m
          ),
        })),
    }),
    {
      name: 'gavelogy-mistakes',       // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mistakes: state.mistakes }), // only persist mistakes array
    }
  )
);
```

## Async Actions Pattern (used in auth store)
```ts
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
```

# Best Practices

## Selector Pattern — Prevent Over-Rendering
```ts
// BAD: subscribes to entire store — re-renders on any change
const store = useAuthStore();
const user = store.user;

// GOOD: only re-renders when `user` changes
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);

// GOOD: derived selector with shallow comparison
import { useShallow } from 'zustand/shallow';
const { user, profile } = useAuthStore(
  useShallow((state) => ({ user: state.user, profile: state.profile }))
);
```

## Resetting Store State
```ts
const initialState = { user: null, isLoading: false, error: null };

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  reset: () => set(initialState),
  logout: async () => {
    await supabase.auth.signOut();
    set(initialState); // full reset
  },
}));
```

## Slice Pattern (for large stores)
```ts
// Split game store into logical slices
const createPlayersSlice = (set) => ({
  players: [] as GamePlayer[],
  setPlayers: (players: GamePlayer[]) => set({ players }),
});

const createQuestionsSlice = (set) => ({
  questions: [] as GameQuestion[],
  currentIndex: 0,
  nextQuestion: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
});

export const useGameStore = create<GameStore>()((...args) => ({
  ...createPlayersSlice(...args),
  ...createQuestionsSlice(...args),
}));
```

## Subscribing Outside React
```ts
// Subscribe to auth changes outside React tree (useful in utility functions)
const unsubscribe = useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) initUserSession(user.id);
  }
);
```

# Code Examples

## Game Store Integration
```ts
// Reading game state in a component
const { players, currentQuestionIndex, userScore } = useGameStore(
  useShallow((s) => ({
    players: s.players,
    currentQuestionIndex: s.currentQuestionIndex,
    userScore: s.userScore,
  }))
);

// Dispatching action
const recordAnswer = useGameStore((s) => s.recordAnswer);
recordAnswer(questionId, selectedOption, timeTaken);
```

## Syncing Zustand with Supabase Auth
```ts
// Sync on app mount (done in auth-context.tsx)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      useAuthStore.getState().setUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.getState().reset();
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

## Persist Hydration Guard
```ts
// Prevent flash of unauthenticated state during SSR hydration
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  // Wait for zustand persist to rehydrate from localStorage
  useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  // or check immediately
  setHydrated(useAuthStore.persist.hasHydrated());
}, []);

if (!hydrated) return <LoadingSpinner />;
```

# Common Pitfalls

1. **Subscribing to full store** in render → every action causes a re-render
2. **Missing `useShallow`** when selecting multiple values → always re-renders
3. **Mutating state directly** instead of `set()` → state doesn't update reactively
4. **Storing non-serializable values** in persisted stores (e.g., functions, DOM refs) → JSON.stringify fails
5. **Race conditions** in async actions — use an `isLoading` flag, don't await in parallel without guards
6. **Stale closure in actions** — use `set((state) => ...)` form for derived updates

```ts
// BAD: stale closure
addScore: (points) => set({ score: score + points }), // `score` may be stale

// GOOD: use state param
addScore: (points) => set((state) => ({ score: state.score + points })),
```

# Performance Notes
- Zustand re-renders only components that subscribed to changed state
- Use `useShallow` for object/array selectors
- Split large stores into smaller focused stores — reduces re-render scope
- Use `subscribeWithSelector` middleware for external subscriptions with selectors
- Avoid putting large arrays (e.g., all questions) in stores without pagination

# Security Notes
- Never persist sensitive data (tokens, passwords) in localStorage via Zustand — use Supabase session cookies
- The `sessionId` and `deviceId` in auth store are persisted — ensure these are regenerated on logout
- Clear persisted stores on logout: `useAuthStore.persist.clearStorage()`

# Testing Strategy
```ts
// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: false, error: null });
});

// Test async action
it('login sets user on success', async () => {
  vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
    data: { user: mockUser, session: mockSession },
    error: null,
  });
  await useAuthStore.getState().login('test@test.com', 'password');
  expect(useAuthStore.getState().user).toEqual(mockUser);
});
```

# Upgrade / Versioning Notes
- **Zustand v5**: Removed `createStore` default export — use named `create` import
- **Zustand v5**: `useShallow` moved to `zustand/shallow`
- **Zustand v5**: `subscribeWithSelector` still available as middleware
- Watch: https://github.com/pmndrs/zustand/releases

# Related Skills
- `auth-system` — Auth store is the most complex store in the project
- `gamification-engine` — Game store + economy integration
