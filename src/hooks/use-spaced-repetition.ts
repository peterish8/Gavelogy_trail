'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface SpacedRepetitionItem {
  id: string;
  quiz_id: string;
  current_stage_index: number;
  next_due_at: string;
  last_completed_at: string | null;
  status: "active" | "completed" | "archived";
  quiz: {
    title: string;
    id: string;
    course_id: string;
    note_item_id: string;
  };
}

export function useSpacedRepetition() {
  const schedules = useQuery(api.spacedRepetition.getActiveSchedules, {});

  const formatted: SpacedRepetitionItem[] = (schedules ?? []).map((s) => ({
    id: s._id,
    quiz_id: s.quizId,
    current_stage_index: s.current_stage_index,
    next_due_at: s.next_due_at ?? "",
    last_completed_at: s.last_completed_at ?? null,
    status: s.status,
    quiz: s.quiz,
  }));

  return { schedules: formatted, isLoading: schedules === undefined, refetch: () => {} };
}
