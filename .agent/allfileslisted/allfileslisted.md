# Gavelogy Project Documentation

> **Last Updated:** January 2026  
> A comprehensive map of all project files, routes, components, and architecture.

---

## Table of Contents
1. [Pages/Routes](#pagesroutes)
2. [Components](#components)
3. [Hooks](#hooks)
4. [State Stores (Zustand)](#state-stores-zustand)
5. [Utilities & Libraries](#utilities--libraries)
6. [Server Actions](#server-actions)
7. [Database Tables](#database-tables)
8. [Quick Reference](#quick-reference)
9. [File Naming Conventions](#file-naming-conventions)

---

## Pages/Routes

| Route | File Path | Description |
|-------|-----------|-------------|
| `/` | `src/app/page.tsx` | Landing page with hero, features, FAQ sections |
| `/login` | `src/app/login/page.tsx` | User login page |
| `/signup` | `src/app/signup/page.tsx` | User registration page |
| `/simple-login` | `src/app/simple-login/page.tsx` | Simplified login flow |
| `/get-started` | `src/app/get-started/page.tsx` | Onboarding flow for new users |
| `/dashboard` | `src/app/dashboard/page.tsx` | User dashboard with analytics and progress |
| `/profile` | `src/app/profile/page.tsx` | User profile management |
| `/settings` | `src/app/settings/page.tsx` | User settings and preferences |
| `/courses` | `src/app/courses/page.tsx` | Course listing page |
| `/course-viewer` | `src/app/course-viewer/page.tsx` | Main course content viewer with notes, TTS, and highlights |
| `/course-quiz/[itemId]` | `src/app/course-quiz/[itemId]/page.tsx` | Full-page quiz for a course item |
| `/quiz` | `src/app/quiz/page.tsx` | Quiz hub/listing |
| `/quiz/[quizId]` | `src/app/quiz/[quizId]/page.tsx` | Individual standalone quiz page |
| `/quiz/retake/[questionId]` | `src/app/quiz/retake/[questionId]/page.tsx` | Retake specific quiz questions |
| `/mistakes` | `src/app/mistakes/page.tsx` | Review incorrect answers from past quizzes |
| `/mistakes/retake` | `src/app/mistakes/retake/page.tsx` | Retake questions from mistake log |
| `/subjects` | `src/app/subjects/page.tsx` | Subject listing/navigation |
| `/pyq/[year]` | `src/app/pyq/[year]/page.tsx` | Previous Year Questions by year |
| `/pyq/[year]/mock` | `src/app/pyq/[year]/mock/page.tsx` | Mock test for PYQs |
| `/arena` | `src/app/arena/page.tsx` | Game arena entry point |
| `/arena/lobby` | `src/app/arena/lobby/page.tsx` | Multiplayer lobby |
| `/arena/game` | `src/app/arena/game/page.tsx` | Active arena game screen |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Global user rankings |
| `/purchase-success` | `src/app/purchase-success/page.tsx` | Payment confirmation page |
| `/test-auth` | `src/app/test-auth/page.tsx` | Auth debugging page (dev only) |
| `/auth` | `src/app/auth/page.tsx` | OAuth callback handling |

---

## Components

### Core Components (`src/components/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `AppHeader` | `app-header.tsx` | Authenticated app header with navigation |
| `Header` | `header.tsx` | Public landing page header |
| `CourseStructureList` | `course-structure-list.tsx` | Hierarchical course structure with progress tracking |
| `CourseNotes` | `course-notes.tsx` | Note content renderer with rich formatting |
| `QuizModal` | `quiz-modal.tsx` | Modal-based quiz interface |
| `SearchCommandMenu` | `search-command-menu.tsx` | Global search (Cmd+K) functionality |
| `StudyTimer` | `study-timer.tsx` | Pomodoro-style study timer |
| `HighlightToolbar` | `highlight-toolbar.tsx` | Text selection highlighting tools |
| `TranslateWidget` | `translate-widget.tsx` | In-app translation widget |
| `StructureSidebar` | `structure-sidebar.tsx` | Course navigation sidebar |
| `ImmersiveFeatures` | `ImmersiveFeatures.tsx` | Landing page features section |
| `FAQSection` | `FAQSection.tsx` | Accordion FAQ component |
| `WhyGavelogy` | `WhyGavelogy.tsx` | Landing page value proposition |
| `DottedBackground` | `DottedBackground.tsx` | Decorative dotted background |
| `GradualBlur` | `GradualBlur.tsx` | Gradient blur effects |
| `LoadingSpinner` | `LoadingSpinner.tsx` | Loading state indicator |
| `ErrorBoundary` | `ErrorBoundary.tsx` | React error boundary wrapper |
| `Providers` | `providers.tsx` | Context providers wrapper |
| `CacheInitializer` | `CacheInitializer.tsx` | Initializes data cache on mount |

### UI Components (`src/components/ui/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `Button` | `button.tsx` | Primary button component (shadcn) |
| `Card` | `card.tsx` | Card container component |
| `Dialog` | `dialog.tsx` | Modal dialog component |
| `Input` | `input.tsx` | Form input field |
| `Textarea` | `textarea.tsx` | Multi-line text input |
| `Label` | `label.tsx` | Form label component |
| `Badge` | `badge.tsx` | Status/tag badges |
| `Avatar` | `avatar.tsx` | User avatar component |
| `Alert` | `alert.tsx` | Alert/notification component |
| `Tabs` | `tabs.tsx` | Tab navigation component |
| `Progress` | `progress.tsx` | Progress bar component |
| `BlurOverlay` | `blur-overlay.tsx` | Blurred overlay for locked content |
| `StarBorder` | `StarBorder.tsx` | Decorative star border effect |

### Dashboard Components (`src/components/dashboard/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `ConfidenceChart` | `ConfidenceChart.tsx` | Quiz confidence visualization |
| `AnalyticsTabs` | `analytics/index.tsx` | Tab container for analytics views |
| `PerformanceTab` | `analytics/PerformanceTab.tsx` | Performance metrics and charts |
| `ConsistencyTab` | `analytics/ConsistencyTab.tsx` | Study consistency tracking |
| `MistakesTab` | `analytics/MistakesTab.tsx` | Mistake analysis and review |

### Game Components (`src/components/game/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `DuelGameScreen` | `duel-game-screen.tsx` | Main arena game UI with questions, timer, scores |
| `ResultsScreen` | `results-screen.tsx` | Post-game results display |
| `GameErrorBoundary` | `error-boundary.tsx` | Error handling for game crashes |

---

## Hooks

| Hook | File Path | Purpose | Returns |
|------|-----------|---------|---------|
| `useSearch` | `use-search.ts` | Global search across courses, notes, quizzes | `{ results, loading, search() }` |
| `useTTS` | `use-tts.ts` | Text-to-speech playback control | `{ isPlaying, play(), pause(), progress }` |
| `useHighlightHistory` | `use-highlight-history.ts` | Undo/redo for text highlights | `{ addToHistory(), undo(), redo(), canUndo, canRedo }` |
| `useCopyProtection` | `useCopyProtection.ts` | Prevents text copying on protected content | `void` (side-effect only) |

---

## State Stores (Zustand)

All stores are in `src/lib/stores/`

| Store | File Path | Purpose | Key State |
|-------|-----------|---------|-----------|
| `useAuthStore` | `auth.ts` | Authentication state and user session | `user`, `isLoading`, `signIn()`, `signOut()` |
| `useQuizStore` | `quiz.ts` | Active quiz state and answers | `currentQuestion`, `answers`, `score` |
| `useMistakesStore` | `mistakes.ts` | Wrong answers tracking | `mistakes[]`, `addMistake()`, `clearMistakes()` |
| `useGameStore` | `game-store.ts` | Arena game state | `gameState`, `playerScore`, `botScore` |
| `useStreaksStore` | `streaks.ts` | Daily study streaks | `currentStreak`, `longestStreak` |
| `useThemeStore` | `theme.ts` | Theme/dark mode toggle | `theme`, `setTheme()` |
| `usePreferencesStore` | `preferences.ts` | User preferences | `soundEnabled`, `autoPlay` |

---

## Utilities & Libraries

### Core Utilities (`src/lib/`)

| Utility | File Path | Purpose |
|---------|-----------|---------|
| `supabase` | `supabase.ts` | Supabase client + full database types |
| `supabase-client` | `supabase-client.ts` | Browser-only Supabase client |
| `supabase/server` | `supabase/server.ts` | Server-side Supabase client |
| `DataLoader` | `data-loader.ts` | All data fetching (courses, notes, completion) |
| `QuizLoader` | `quiz-loader.ts` | Quiz and question fetching |
| `cache` | `cache.ts` | In-memory caching with TTL |
| `contentConverter` | `content-converter.ts` | Custom tags ↔ HTML conversion |
| `highlightStorage` | `highlight-storage.ts` | LocalStorage for user highlights |
| `ttsProcessor` | `tts-processor.ts` | Prepare content for TTS |
| `payment` | `payment.ts` | Payment/subscription handling |
| `validation` | `validation.ts` | Form validation utilities |
| `utils` | `utils.ts` | General utilities (`cn()` for classnames) |

### Game Utilities (`src/lib/game/`)

| Utility | File Path | Purpose |
|---------|-----------|---------|
| `botSystem` | `bot-system.ts` | AI opponent logic with configurable accuracy |
| `realtime` | `realtime.ts` | Supabase realtime for multiplayer |
| `scoring` | `scoring.ts` | Score calculation (speed bonus, accuracy) |

---

## Server Actions

All in `src/actions/game/`

| Action | File Path | Purpose |
|--------|-----------|---------|
| `fetchGameQuestions` | `questions.ts` | Get randomized questions for arena |
| `matchmaking` | `matchmaking.ts` | Find/create game matches |
| `gameplay` | `gameplay.ts` | Submit answers, update scores |
| `rewards` | `rewards.ts` | Calculate and grant rewards |

---

## Database Tables

Based on types in `src/lib/supabase.ts`:

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | `id`, `email`, `username`, `display_name`, `avatar_url` | User profiles |
| `courses` | `id`, `title`, `description`, `is_active`, `order_index` | Course metadata |
| `structure_items` | `id`, `course_id`, `parent_id`, `title`, `item_type`, `order_index` | Course hierarchy (folders/files) |
| `note_contents` | `id`, `item_id`, `content_html` | Note content for structure items |
| `attached_quizzes` | `id`, `note_item_id`, `title`, `passing_score` | Quizzes linked to notes |
| `quiz_questions` | `id`, `quiz_id`, `question_text`, `options`, `correct_answer`, `explanation` | Individual questions |
| `quiz_attempts` | `id`, `user_id`, `quiz_id`, `score`, `passed`, `answers` | User quiz history |
| `mistakes` | `id`, `user_id`, `question_id`, `user_answer`, `correct_answer` | Wrong answers for review |
| `user_completed_items` | `id`, `user_id`, `item_id` | Track completed notes |
| `contemporary_case_quizzes` | `case_number`, `question`, `options`, `correct_answer` | Legacy case quizzes |
| `contemprory_case_notes` | `case_number`, `overall_content` | Legacy case notes |
| `game_sessions` | `id`, `player_id`, `mode`, `status` | Arena game sessions |
| `game_answers` | `id`, `session_id`, `question_id`, `answer`, `is_correct` | Arena game answers |

---

## Quick Reference

### "I want to edit X, what files do I need?"

| I want to edit... | Files to modify |
|-------------------|-----------------|
| **Landing page content** | `src/app/page.tsx`, `src/components/ImmersiveFeatures.tsx`, `src/components/FAQSection.tsx` |
| **Course structure/tree** | `src/components/course-structure-list.tsx`, `src/lib/data-loader.ts` |
| **Note content rendering** | `src/components/course-notes.tsx`, `src/lib/content-converter.ts` |
| **Quiz UI/logic** | `src/components/quiz-modal.tsx`, `src/app/course-quiz/[itemId]/page.tsx` |
| **Quiz data fetching** | `src/lib/quiz-loader.ts`, `src/lib/data-loader.ts` |
| **Authentication flow** | `src/lib/stores/auth.ts`, `src/app/login/page.tsx` |
| **Arena game mechanics** | `src/components/game/duel-game-screen.tsx`, `src/lib/game/bot-system.ts` |
| **Search functionality** | `src/hooks/use-search.ts`, `src/components/search-command-menu.tsx` |
| **Highlighting/annotations** | `src/components/highlight-toolbar.tsx`, `src/lib/highlight-storage.ts` |
| **Text-to-speech** | `src/hooks/use-tts.ts`, `src/lib/tts-processor.ts` |
| **Dashboard analytics** | `src/app/dashboard/page.tsx`, `src/components/dashboard/analytics/*.tsx` |
| **Mistakes/wrong answers** | `src/app/mistakes/page.tsx`, `src/lib/stores/mistakes.ts` |
| **Database queries** | `src/lib/data-loader.ts`, `src/lib/quiz-loader.ts` |
| **UI components (buttons, cards)** | `src/components/ui/*.tsx` |
| **Global styles** | `src/app/globals.css` |

---

## File Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `kebab-case.tsx` | `course-structure-list.tsx` | Components and pages |
| `PascalCase.tsx` | `FAQSection.tsx` | Legacy components (being migrated) |
| `use-*.ts` | `use-search.ts` | Custom React hooks |
| `*.ts` | `data-loader.ts` | Utilities and non-React code |
| `[param]` | `[itemId]/page.tsx` | Dynamic routes |
| `stores/*.ts` | `stores/auth.ts` | Zustand state stores |
| `*.tsx.backup` | `page.tsx.backup` | Backup files (not in use) |

---

## Architecture Notes

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** Zustand stores for global state
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Content Format:** Custom tag syntax converted to HTML (see `content-converter.ts`)
