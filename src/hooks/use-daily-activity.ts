'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type DailyActivity = {
  activity_date: string;
  quizzes_completed: number;
};

export function useDailyActivity(year: number, month: number) {
  // Fetch all records for the user (no date filter = returns array)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = useQuery(api.analytics.getDailyActivity, {}) as any;
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const activities: DailyActivity[] = Array.isArray(all)
    ? all
        .filter((a: DailyActivity) => a.activity_date?.startsWith(prefix))
        .map((a: DailyActivity) => ({
          activity_date: a.activity_date,
          quizzes_completed: a.quizzes_completed,
        }))
    : [];

  return { activities, isLoading: all === undefined };
}
