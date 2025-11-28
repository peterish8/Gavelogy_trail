# Quick Setup Guide - Dashboard & Badges

## 🚀 Quick Start

### 1. Set Up Supabase Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of SUPABASE_SCHEMA_COMPLETE.sql
```

### 2. Verify Tables Created

Check that these tables exist:

- ✅ `badges`
- ✅ `badge_progress`
- ✅ `daily_activity`
- ✅ `activity_log`
- ✅ `subject_performance`
- ✅ `weekly_performance`

### 3. Test the Dashboard

1. Sign in to your app
2. Go to Dashboard → Achievements tab
3. You should see 4 badge cards (even if no badges are earned yet)

## 📊 How Badges Work

### Badge Types

| Badge                 | What It Tracks    | Bronze           | Silver            | Gold              |
| --------------------- | ----------------- | ---------------- | ----------------- | ----------------- |
| 🎯 Accuracy Champ     | Quiz accuracy     | 3 quizzes @ 80%+ | 5 quizzes @ 90%+  | 10 quizzes @ 95%+ |
| ⚡ Speedster          | Answer speed      | 5 quizzes @ <15s | 10 quizzes @ <10s | 20 quizzes @ <8s  |
| 📅 Consistent Learner | Daily streak      | 3 days           | 7 days            | 14 days           |
| 🔍 Insight Seeker     | Explanation views | 20 views         | 50 views          | 100 views         |

### Automatic Badge Calculation

Badges are calculated automatically when you:

1. **Complete a Quiz** → Updates Accuracy Champ & Speedster badges
2. **View Explanations** → Updates Insight Seeker badge
3. **Maintain Streak** → Updates Consistent Learner badge

## 💻 Code Integration

### When User Completes a Quiz

```typescript
import { supabase } from "@/lib/supabase";
import { calculateAllBadges } from "@/lib/badges";

// 1. Save quiz attempt
const { data: attempt } = await supabase.from("quiz_attempts").insert({
  user_id: userId,
  quiz_id: quizId,
  score: correctAnswers,
  total_questions: totalQuestions,
  time_taken: timeSpent,
  accuracy: (correctAnswers / totalQuestions) * 100,
  average_time_per_question: timeSpent / totalQuestions,
});

// 2. Calculate badges
await calculateAllBadges(userId, currentStreak);
```

### When User Views Explanation

```typescript
import { logExplanationView } from "@/lib/badges";

// Log explanation view
await logExplanationView(userId, questionId, subject);
```

### When Streak Updates

```typescript
import { calculateConsistentLearnerBadge } from "@/lib/badges";

// Update streak in database
await supabase
  .from("users")
  .update({ streak_count: newStreak })
  .eq("id", userId);

// Calculate badge
await calculateConsistentLearnerBadge(userId, newStreak);
```

## 🎨 Dashboard Features

### Overview Tab

- Streak display
- Score trends
- Accuracy percentage
- Weak topics
- Coins earned
- Courses owned

### Analytics Tab

- **Performance**: Overall accuracy, quiz trends, subject-wise performance
- **Mistakes**: Active mistakes, clearance rate, mistake heatmap
- **Consistency**: Activity heatmap, weekly summary, streak tracking
- **Readiness**: Exam readiness score, subject mastery, recommendations

### Achievements Tab

- **4 Badge Cards**: One for each badge type
- **Progress Bars**: Shows progress towards next level
- **Achievement Dates**: When badges were earned
- **Visual Indicators**: Bronze 🥉 Silver 🥈 Gold 🥇

## 📝 Database Tables Explained

### `badges`

Stores earned badges with metadata

```sql
SELECT * FROM badges WHERE user_id = 'user-uuid';
```

### `badge_progress`

Tracks progress towards badges

```sql
SELECT * FROM badge_progress WHERE user_id = 'user-uuid';
```

### `quiz_attempts`

Stores quiz completion data

```sql
SELECT * FROM quiz_attempts WHERE user_id = 'user-uuid' ORDER BY completed_at DESC;
```

### `daily_activity`

Tracks daily activity for streaks

```sql
SELECT * FROM daily_activity WHERE user_id = 'user-uuid' ORDER BY activity_date DESC;
```

### `activity_log`

Detailed activity log

```sql
SELECT * FROM activity_log WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

## 🔒 Security (RLS)

All tables have Row Level Security enabled:

- Users can only see their own data
- Users can only insert their own records
- Users can only update their own records

## 🧪 Testing

### Test Badge Calculation

1. Insert test quiz attempts:

```sql
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken, accuracy, average_time_per_question)
VALUES
  ('your-user-id', 'quiz-id', 8, 10, 300, 80.0, 15.0),
  ('your-user-id', 'quiz-id', 9, 10, 280, 90.0, 12.0),
  ('your-user-id', 'quiz-id', 10, 10, 250, 100.0, 10.0);
```

2. Call badge calculation:

```typescript
await calculateAllBadges(userId, 3);
```

3. Check badges table:

```sql
SELECT * FROM badges WHERE user_id = 'your-user-id';
```

4. Check badge progress:

```sql
SELECT * FROM badge_progress WHERE user_id = 'your-user-id';
```

## 🎯 Badge Thresholds

Update thresholds in `src/lib/badges.ts`:

```typescript
const BADGE_THRESHOLDS: Record<BadgeType, BadgeThreshold> = {
  accuracy_champ: {
    bronze: 3, // Change this
    silver: 5, // Change this
    gold: 10, // Change this
  },
  // ... other badges
};
```

## 📊 Dashboard Data Flow

1. User completes quiz → Saved to `quiz_attempts`
2. Badge calculation runs → Updates `badges` and `badge_progress`
3. Dashboard fetches badges → Displays in Achievements tab
4. User views explanations → Logged to `activity_log`
5. Badge calculation runs → Updates Insight Seeker badge

## 🎨 Customization

### Change Badge Names

Edit `src/components/dashboard/analytics/AchievementsTab.tsx`:

```typescript
const BADGE_CONFIG = {
  accuracy_champ: {
    name: "Your Custom Name",
    description: "Your custom description",
    // ...
  },
};
```

### Change Badge Icons

Replace icons in `AchievementsTab.tsx`:

```typescript
import { YourIcon } from "lucide-react";

const BADGE_CONFIG = {
  accuracy_champ: {
    icon: YourIcon,
    // ...
  },
};
```

## 🐛 Troubleshooting

### Badges Not Showing

1. Check if tables exist in Supabase
2. Check RLS policies are enabled
3. Check user is authenticated
4. Check console for errors

### Badge Calculation Not Working

1. Check `quiz_attempts` table has data
2. Check `badge_progress` table is being updated
3. Check console for errors
4. Verify user_id matches authenticated user

### Dashboard Shows Old Data

1. Clear browser cache
2. Refresh page
3. Check Supabase data is up to date

## 📚 Additional Resources

- See `DASHBOARD_PRODUCTION_READY.md` for detailed implementation
- See `SUPABASE_SCHEMA_COMPLETE.sql` for database schema
- See `src/lib/badges.ts` for badge calculation logic
- See `src/components/dashboard/analytics/AchievementsTab.tsx` for badge display

## ✅ Checklist

- [ ] Run SQL schema in Supabase
- [ ] Verify tables created
- [ ] Test dashboard loads
- [ ] Test Achievements tab
- [ ] Integrate badge calculation in quiz flow
- [ ] Test badge earning
- [ ] Verify badges display correctly

## 🎉 You're Done!

Your dashboard is now production-ready with:

- ✅ Real data from Supabase
- ✅ Badge system with 4 types
- ✅ Achievements tab
- ✅ No mock data
- ✅ Complete database schema

Start using it by completing quizzes and earning badges!
