---
name: Dashboard & Analytics
description: Load when working on dashboard components, analytics data fetching, charts, activity graphs, performance panels, or streak tracking
---

# Purpose
Gavelogy's analytics dashboard — activity graphs, subject performance, consistency tracking, mistake trends, streak data, and confidence distribution charts.

# When to Use
- Adding new analytics panels or charts
- Fetching analytics data from Supabase
- Debugging why stats look wrong
- Adding new metrics (new subject, new stat type)
- Optimizing dashboard load performance

# Setup
Key files:
| File | Purpose |
|------|---------|
| `src/app/dashboard/page.tsx` | Main dashboard page |
| `src/components/dashboard/` | All dashboard panel components |
| `src/hooks/use-activity-stats.ts` | Hook for activity/performance stats |
| `src/hooks/use-daily-activity.ts` | Daily activity data hook |
| `src/hooks/use-day-history.ts` | Historical day-by-day data |
| `src/lib/stores/streaks.ts` | Streak state + persistence |
| `recharts` | Chart library used throughout |

# Core Concepts

## Dashboard Layout
```
Dashboard
├── Header (XP, coins, streak summary)
├── Analytics Tabs
│   ├── Performance Tab — subject accuracy, score trends
│   ├── Consistency Tab — activity heatmap, streak calendar
│   └── Mistakes Tab — by subject, difficulty, trend
├── Activity Graph — daily activity heatmap (GitHub-style)
├── Recent Activity List — last 10 actions
└── Performance Panel — quick stats
```

## Key Database Tables
```sql
-- daily_activity: aggregated per user per day
daily_activity (user_id, date, quiz_count, correct_count, total_count, subjects_studied)

-- activity_log: granular events
activity_log (user_id, action_type, subject, score, created_at)

-- badge_progress: achievement tracking
badge_progress (user_id, badge_id, current_value, target_value, unlocked_at)

-- mistakes: for mistake trend charts
mistakes (user_id, subject, is_cleared, created_at)
```

## Recharts Patterns
```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Score trend over time
<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={weeklyScores}>
    <defs>
      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6B9BD2" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#6B9BD2" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
    <Area type="monotone" dataKey="score" stroke="#6B9BD2" fill="url(#scoreGrad)" />
  </AreaChart>
</ResponsiveContainer>
```

# Best Practices

## Data Fetching Pattern
```ts
// hooks/use-activity-stats.ts
export function useActivityStats(userId: string) {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setStats(processActivityData(data ?? []));
      setLoading(false);
    }

    fetchStats();
  }, [userId]);

  return { stats, loading };
}
```

## Processing Raw Data
```ts
function processActivityData(rows: DailyActivity[]): ProcessedStats {
  const totalQuizzes = rows.reduce((s, r) => s + r.quiz_count, 0);
  const totalCorrect = rows.reduce((s, r) => s + r.correct_count, 0);
  const avgAccuracy = totalQuizzes > 0 ? Math.round((totalCorrect / (rows.reduce((s, r) => s + r.total_count, 0))) * 100) : 0;

  // Build 30-day heatmap grid
  const heatmap = buildDateGrid(30).map((date) => {
    const row = rows.find((r) => r.date === date);
    return { date, count: row?.quiz_count ?? 0, intensity: calculateIntensity(row?.quiz_count ?? 0) };
  });

  return { totalQuizzes, avgAccuracy, heatmap, rows };
}

function calculateIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}
```

## Activity Heatmap Component
```tsx
const INTENSITY_COLORS = [
  'bg-muted',          // 0 — no activity
  'bg-blue-900/50',    // 1 — light
  'bg-blue-700/70',    // 2 — moderate
  'bg-blue-500/80',    // 3 — active
  'bg-blue-400',       // 4 — very active
];

function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  return (
    <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
      {data.map((day) => (
        <Tooltip key={day.date} content={`${day.date}: ${day.count} quizzes`}>
          <div
            className={cn(
              'aspect-square rounded-sm',
              INTENSITY_COLORS[day.intensity]
            )}
          />
        </Tooltip>
      ))}
    </div>
  );
}
```

## Streak Tracking
```ts
// stores/streaks.ts
interface StreakStore {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // 'YYYY-MM-DD'
  updateStreak: () => void;
}

// Update streak on quiz completion
updateStreak: () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  set((state) => {
    if (state.lastActiveDate === today) return state; // already counted today
    if (state.lastActiveDate === yesterday) {
      // Consecutive day
      const newStreak = state.currentStreak + 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, state.longestStreak),
        lastActiveDate: today,
      };
    }
    // Streak broken
    return { currentStreak: 1, lastActiveDate: today };
  });
},
```

## Subject Performance Radar Chart
```tsx
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const subjects = ['Constitutional', 'Criminal', 'Contract', 'Tort', 'IPR', 'International'];

function SubjectRadar({ accuracyBySubject }: { accuracyBySubject: Record<string, number> }) {
  const data = subjects.map((s) => ({
    subject: s.substring(0, 5), // abbreviate
    accuracy: accuracyBySubject[s] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Radar dataKey="accuracy" stroke="#6B9BD2" fill="#6B9BD2" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

# Code Examples

## Circular Progress (XP to next league)
```tsx
// components/ui/circular-progress.tsx
function CircularProgress({ value, max, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor"
              strokeWidth={strokeWidth} fill="none" className="text-muted" />
      <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor"
              strokeWidth={strokeWidth} fill="none" className="text-primary"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
}
```

## Recent Activity List
```tsx
function RecentActivityList({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // ... fetch from activity_log table, limit 10, order by created_at desc

  return (
    <ul className="space-y-2">
      {activities.map((a) => (
        <li key={a.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ActivityIcon type={a.action_type} />
            <span className="text-foreground">{a.subject}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{formatScore(a.score)}</span>
            <span className="text-muted-foreground text-xs">{timeAgo(a.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

# Common Pitfalls

1. **Fetching all activity_log rows** without a date range → slow for active users (thousands of rows)
2. **Not memoizing chart data** → expensive recalculation on every render
3. **Recharts missing `ResponsiveContainer`** → chart doesn't resize with screen
4. **Streak logic timezone bug** → use UTC dates consistently, not local timezone
5. **Showing streak before hydration** → persist streak in Zustand, show skeleton until hydrated

# Performance Notes
- Aggregate in DB with `daily_activity` table — don't aggregate in the client
- Memoize processed chart data with `useMemo`
- Use `recharts` lazy import — it's ~120KB
- Activity heatmap with 365 days of data → virtualize or limit to 90 days visible
- Load dashboard data in parallel with `Promise.all`

```ts
const [activity, performance, mistakes] = await Promise.all([
  fetchActivityStats(userId),
  fetchPerformanceStats(userId),
  fetchMistakeStats(userId),
]);
```

# Security Notes
- Dashboard data is scoped by `user_id` via RLS
- Don't expose other users' stats in leaderboard (aggregate only — score, rank)
- Badge progress shouldn't reveal quiz question IDs

# Testing Strategy
```ts
// Test streak calculation edge cases
describe('streak tracking', () => {
  it('maintains streak for consecutive days', () => {
    const store = useMistakesStore.getState();
    mockDate('2026-03-20');
    store.updateStreak(); // day 1
    mockDate('2026-03-21');
    store.updateStreak(); // day 2
    expect(store.currentStreak).toBe(2);
  });

  it('resets streak after gap day', () => {
    mockDate('2026-03-22'); // skip a day
    store.updateStreak();
    expect(store.currentStreak).toBe(1);
  });
});

// Test activity intensity calculation
it('calculates intensity correctly', () => {
  expect(calculateIntensity(0)).toBe(0);
  expect(calculateIntensity(3)).toBe(2);
  expect(calculateIntensity(15)).toBe(4);
});
```

# Upgrade / Versioning Notes
- **Recharts v3**: New SSR compatibility improvements — works better with Next.js App Router
- Recharts is not actively maintained — consider `tremor` or `shadcn/ui charts` (built on Recharts) for longer-term support
- Watch: https://github.com/recharts/recharts/releases

# Related Skills
- `supabase-integration` — `daily_activity` and `activity_log` query patterns
- `zustand-state-management` — Streaks store persistence
