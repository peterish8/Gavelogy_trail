'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type ActivityData = {
  date: string;
  count: number;
  label: string;
};

export function useActivityStats(days: number) {
  const attempts = useQuery(api.quiz.getAttempts, {});

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const counts: Record<string, number> = {};
  let totalAttempts = 0;

  if (attempts) {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    for (const a of attempts) {
      if (!a.completed_at) continue;
      if (a.completed_at < startIso || a.completed_at > endIso) continue;
      const d = new Date(a.completed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] ?? 0) + 1;
      totalAttempts++;
    }
  }

  const data: ActivityData[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    data.push({
      date: key,
      count: counts[key] ?? 0,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  return { data, isLoading: attempts === undefined, totalAttempts };
}
