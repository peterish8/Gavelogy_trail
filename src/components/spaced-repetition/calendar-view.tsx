
"use client";

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { getCalendarGrid, isSameDay, isToday, formatMonthYear } from "@/lib/calendar-utils";
import { useSpacedRepetition, SpacedRepetitionItem } from '@/hooks/use-spaced-repetition';
import { useDailyActivity } from '@/hooks/use-daily-activity';
import { useDayHistory } from '@/hooks/use-day-history';
import { calculateNextIntervalDays, MAX_STAGE_INDEX } from '@/lib/spaced-repetition-config';
import { ActivityGraph } from '@/components/dashboard/activity-graph';

export function SpacedRepetitionCalendar() {
  const { schedules } = useSpacedRepetition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarGrid = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const { activities: dailyActivities } = useDailyActivity(year, month);
  const { history: completedHistory } = useDayHistory(selectedDate);

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    dailyActivities.forEach(item => { map[item.activity_date] = item.quizzes_completed; });
    return map;
  }, [dailyActivities]);

  const schedulesByDate = useMemo(() => {
    type CalendarItem = SpacedRepetitionItem & { isProjected?: boolean; projectedStage?: number };
    const groups: Record<string, CalendarItem[]> = {};
    const todayStr = new Date().toDateString();

    schedules.forEach(item => {
      const dueAt = new Date(item.next_due_at);
      const dueDayStart = new Date(dueAt); dueDayStart.setHours(0, 0, 0, 0);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      let key = dueDayStart < todayStart ? todayStr : dueAt.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);

      let lastProjectedDate = new Date(dueAt);
      let lastStage = item.current_stage_index;
      for (let i = 0; i < 5; i++) {
        if (lastStage >= MAX_STAGE_INDEX) break;
        const gap = calculateNextIntervalDays(lastStage);
        if (gap === null) break;
        const nextDate = new Date(lastProjectedDate);
        nextDate.setDate(nextDate.getDate() + gap);
        const projKey = nextDate.toDateString();
        if (!groups[projKey]) groups[projKey] = [];
        groups[projKey].push({ ...item, isProjected: true, projectedStage: lastStage + 1 });
        lastProjectedDate = nextDate;
        lastStage++;
      }
    });
    return groups;
  }, [schedules]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const itemsForSelectedDay = useMemo(() => {
    const items = selectedDate ? (schedulesByDate[selectedDate.toDateString()] || []) : [];
    return items.sort((a, b) => {
      const aIsOverdue = !a.isProjected && new Date(a.next_due_at) < new Date() && !isToday(new Date(a.next_due_at));
      const bIsOverdue = !b.isProjected && new Date(b.next_due_at) < new Date() && !isToday(new Date(b.next_due_at));
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      if (!a.isProjected && b.isProjected) return -1;
      if (a.isProjected && !b.isProjected) return 1;
      return 0;
    });
  }, [selectedDate, schedulesByDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">

      {/* ── Tasks Panel ── */}
      <div className="lg:col-span-3 glass-card card-interactive rounded-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex flex-col gap-1 border-b border-white/30 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--brand-soft)] dark:bg-violet-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand)]" />
            </div>
            <span className="font-semibold text-sm text-[var(--ink)]" style={{ fontFamily: 'var(--display-family)' }}>Tasks</span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] pl-8">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[440px]">
          {itemsForSelectedDay.length > 0 ? (
            itemsForSelectedDay.map((item, idx) => {
              const isProjected = item.isProjected;
              const stageDisplay = isProjected ? item.projectedStage : item.current_stage_index;
              const isItemOverdue = !isProjected && new Date(item.next_due_at) < new Date() && !isToday(new Date(item.next_due_at));

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`group flex flex-col gap-2 p-3 rounded-xl transition-all duration-200 ${
                    isProjected
                      ? 'border border-dashed border-[var(--border-strong)]/35 dark:border-white/[0.07] opacity-55'
                      : 'task-card-glass hover:-translate-y-0.5'
                  }`}
                  style={isProjected ? { background: "rgba(255,255,255,0.14)" } : undefined}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-sm text-[var(--ink)] line-clamp-2 leading-snug">{item.quiz.title}</span>
                    {isItemOverdue && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 h-5 shrink-0">Overdue</Badge>
                    )}
                    {isProjected && (
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 h-5 shrink-0 text-[var(--ink-3)] border-[var(--border-strong)]/30 bg-white/30 dark:bg-white/[0.04]">Future</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
                    <span className="font-medium">Stage {stageDisplay}</span>
                    {!isProjected && (
                      <div className="flex gap-1">
                        {item.quiz.course_id && (
                          <Link href={`/course-viewer?courseId=${item.quiz.course_id}&itemId=${item.quiz.note_item_id}&view=reader&quizId=${item.quiz.id}`}>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">📝 Notes</Button>
                          </Link>
                        )}
                        <Link href={`/course-quiz/${item.quiz.id}?mode=spaced-repetition`}>
                          <Button size="sm" className="h-6 text-[10px] px-2.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white">Start</Button>
                        </Link>
                      </div>
                    )}
                    {isProjected && <span className="text-[10px] italic opacity-70">Unlock by passing previous</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
              <span className="text-2xl opacity-40">☕</span>
              <p className="text-sm font-medium text-[var(--ink-3)]">No tasks today</p>
              <p className="text-xs text-[var(--ink-3)] opacity-60">Select another date or relax!</p>
            </div>
          )}
        </div>

        {/* Completed Today */}
        {completedHistory.length > 0 && (
          <div className="p-4 border-t border-white/30 dark:border-white/[0.06] shrink-0">
            <h4 className="text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-wider mb-2.5">Completed Today</h4>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
              {completedHistory.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-2 rounded-lg task-card-glass text-xs">
                  <span className="truncate max-w-[140px] font-medium text-[var(--ink)]" title={attempt.quiz?.title}>{attempt.quiz?.title || 'Unknown Quiz'}</span>
                  <Badge className={`text-[10px] h-5 shrink-0 ml-2 ${attempt.passed ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                    {attempt.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Activity Graph ── */}
      <div className="lg:col-span-3 h-full min-h-[250px] lg:min-h-0">
        <ActivityGraph />
      </div>

      {/* ── Calendar Grid ── */}
      <div className="lg:col-span-6 glass-card card-interactive rounded-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/30 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--brand-soft)] dark:bg-violet-500/15 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--brand)]" />
            </div>
            <span className="font-semibold text-base text-[var(--ink)]" style={{ fontFamily: 'var(--display-family)' }}>
              {formatMonthYear(currentDate)}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/[0.06]" onClick={handlePrevMonth}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/[0.06] font-medium" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/[0.06]" onClick={handleNextMonth}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-4 flex-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1.5 text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5 h-full content-start">
            {calendarGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;

              const dateKey = date.toDateString();
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              const activityKey = `${y}-${m}-${d}`;

              const items = schedulesByDate[dateKey] || [];
              const isTodayDate = isToday(date);
              const isSelected = isSameDay(date, selectedDate);
              const projectedCount = items.filter(i => i.isProjected).length;
              const overdueCount = items.filter(i => !i.isProjected && new Date(i.next_due_at) < new Date()).length;
              const pendingCount = items.length - overdueCount - projectedCount;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square p-1.5 rounded-xl cursor-pointer
                    flex flex-col justify-between relative
                    glass-cell
                    ${isSelected ? 'glass-cell-selected' : isTodayDate ? 'glass-cell-today' : ''}
                  `}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className={`text-[11px] font-semibold leading-none ${isTodayDate ? 'text-[var(--brand)]' : 'text-[var(--ink)]/70'}`}>
                      {date.getDate()}
                    </span>
                    {(activityMap[activityKey] || 0) > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white/60 dark:ring-black/40">
                        {activityMap[activityKey]}
                      </span>
                    )}
                  </div>

                  {(overdueCount > 0 || pendingCount > 0 || projectedCount > 0) && (
                    <div className="flex gap-0.5 flex-wrap content-end mt-auto">
                      {overdueCount > 0 && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                      {pendingCount > 0 && <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />}
                      {projectedCount > 0 && <div className="h-1.5 w-1.5 rounded-full bg-violet-400 opacity-40" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
