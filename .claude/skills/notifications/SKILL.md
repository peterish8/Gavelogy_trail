---
name: Notifications
description: Load when adding push notifications, in-app alerts, toast messages, or notification center functionality
---

# Purpose
Implement a notification system for Gavelogy including in-app toast notifications, a notification center, and optional browser push notifications for quiz reminders and streak warnings.

# When to Use
- Adding toast notifications for user feedback
- Building a notification center/inbox
- Implementing browser push notifications
- Setting up quiz reminders or streak warnings
- Showing real-time alerts for game events

# Core Concepts

## Toast Notification System

```tsx
// src/lib/stores/toast.ts
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 5000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helpers
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
};
```

```tsx
// src/components/ui/toast-container.tsx
'use client';
import { useToastStore } from '@/lib/stores/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
         aria-live="polite" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors[t.type]}`}
            >
              <Icon className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t.title}</p>
                {t.message && <p className="text-xs opacity-80 mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => removeToast(t.id)} className="shrink-0" aria-label="Dismiss">
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

## Browser Push Notifications

```ts
// src/lib/push-notifications.ts
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    ...options,
  });
}

// Usage: Quiz reminder
export function scheduleQuizReminder(delayMs: number = 8 * 60 * 60 * 1000) {
  setTimeout(() => {
    sendLocalNotification('Time to practice! 📚', {
      body: 'Your daily quiz is waiting. Keep your streak alive!',
      tag: 'quiz-reminder', // prevents duplicates
    });
  }, delayMs);
}
```

## Notification Center (Database-Backed)

```sql
-- Supabase table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'streak', 'league', 'system'
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only read their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
```

# Usage Examples

```tsx
// After successful quiz submission
import { toast } from '@/lib/stores/toast';

const result = await submitAnswer(data);
if (result.success) {
  toast.success('Correct! 🎉', `+${result.data.xp} XP earned`);
} else {
  toast.error('Oops!', result.error);
}

// Streak warning
if (streakEndingSoon) {
  toast.warning('Streak ending!', 'Complete a quiz in the next 2 hours to keep your streak');
}
```

# Best Practices

1. **Use toasts for transient feedback** — success, error, warnings
2. **Use notification center for persistent messages** — achievements, announcements
3. **Don't spam** — rate limit notifications, respect user preferences
4. **Accessible** — `aria-live="polite"` on toast container
5. **Auto-dismiss** — 5s default, keep errors longer

# Related Skills
- `zustand-state-management` — Toast store pattern
- `framer-motion` — Toast animations
- `accessibility` — Live regions for notifications
