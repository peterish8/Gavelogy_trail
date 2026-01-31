
"use client";

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getCalendarGrid, isSameDay, isToday, formatMonthYear } from "@/lib/calendar-utils";
import { useSpacedRepetition, SpacedRepetitionItem } from '@/hooks/use-spaced-repetition';
import { useDailyActivity } from '@/hooks/use-daily-activity';
import { useDayHistory } from '@/hooks/use-day-history';
import { calculateNextIntervalDays, MAX_STAGE_INDEX } from '@/lib/spaced-repetition-config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

import { ActivityGraph } from '@/components/dashboard/activity-graph';

export function SpacedRepetitionCalendar() {
  const { schedules } = useSpacedRepetition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Default to Today

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarGrid = useMemo(() => getCalendarGrid(year, month), [year, month]);

  // Fetch Daily Activity
  const { activities: dailyActivities } = useDailyActivity(year, month);
  
  // Fetch History for Selected Day
  const { history: completedHistory } = useDayHistory(selectedDate);
  
  // Create a map for fast lookup: 'YYYY-MM-DD' -> count
  const activityMap = useMemo(() => {
     const map: Record<string, number> = {};
     dailyActivities.forEach(item => {
        map[item.activity_date] = item.quizzes_completed;
     });
     return map;
  }, [dailyActivities]);
  
  const schedulesByDate = useMemo(() => {
    // Add "isProjected" flag to local type
    type CalendarItem = SpacedRepetitionItem & { isProjected?: boolean; projectedStage?: number };
    const groups: Record<string, CalendarItem[]> = {};
    const todayStr = new Date().toDateString();

    schedules.forEach(item => {
       // 1. Acknowledge the ACTUAL due date
       const dueAt = new Date(item.next_due_at);
       const dueDayStart = new Date(dueAt); dueDayStart.setHours(0,0,0,0);
       const todayStart = new Date(); todayStart.setHours(0,0,0,0);

       let key = '';
       if (dueDayStart < todayStart) {
         key = todayStr; // Overdue -> Today bucket visually, but track as overdue
       } else {
         key = dueAt.toDateString(); 
       }

       if (!groups[key]) groups[key] = [];
       groups[key].push(item);

       // 2. Project FUTURE dates logic
       // Assume success on due date -> Calculate subsequent intervals
       let lastProjectedDate = new Date(dueAt);
       let lastStage = item.current_stage_index;

       // Limit projection to avoid infinite loops or massive grids (e.g., next 5 stages)
       for (let i = 0; i < 5; i++) {
          if (lastStage >= MAX_STAGE_INDEX) break;

          const gap = calculateNextIntervalDays(lastStage);
          if (gap === null) break;

          // Next date = Last Date + Gap
          const nextDate = new Date(lastProjectedDate);
          nextDate.setDate(nextDate.getDate() + gap);
          
          const projKey = nextDate.toDateString();
          if (!groups[projKey]) groups[projKey] = [];
          
          // Avoid duplicate projections for same item on same day? 
          // (Unlikely unless intervals are 0, which they aren't)
          groups[projKey].push({
            ...item,
            isProjected: true,
            projectedStage: lastStage + 1
          });

          // Advance cursors
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
    
    // Sort: Overdue first, then Pending (non-projected), then Future (projected) last
    return items.sort((a, b) => {
      const aIsProjected = a.isProjected;
      const bIsProjected = b.isProjected;
      
      const aIsOverdue = !aIsProjected && new Date(a.next_due_at) < new Date() && !isToday(new Date(a.next_due_at));
      const bIsOverdue = !bIsProjected && new Date(b.next_due_at) < new Date() && !isToday(new Date(b.next_due_at));
      
      // Overdue items first
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      // Projected/Future items last
      if (!aIsProjected && bIsProjected) return -1;
      if (aIsProjected && !bIsProjected) return 1;
      
      return 0;
    });
  }, [selectedDate, schedulesByDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      
      {/* 1. LEFT: Todo Container (25% width -> 3/12 cols) */}
      <Card className="lg:col-span-3 flex flex-col h-full shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary"/>
            Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
             {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
          {itemsForSelectedDay.length > 0 ? (
            itemsForSelectedDay.map((item, idx) => {
               // Determine real state
               const isProjected = item.isProjected;
               const stageDisplay = isProjected ? item.projectedStage : item.current_stage_index;

               const isItemOverdue = !isProjected && new Date(item.next_due_at) < new Date() && !isToday(new Date(item.next_due_at));
               
               return (
                 <div key={`${item.id}-${idx}`} className={`group flex flex-col gap-2 p-3 rounded-lg border transition-colors ${
                    isProjected ? 'bg-muted/30 border-dashed border-muted-foreground/30 opacity-70' : 'bg-card/50 dark:bg-black/20 hover:bg-accent/50 dark:hover:bg-accent/10 hover:border-primary/50'
                 }`}>
                   <div className="flex justify-between items-start">
                     <span className="font-medium text-sm line-clamp-2">{item.quiz.title}</span>
                     {isItemOverdue && <Badge variant="destructive" className="ml-2 text-[10px] px-1 h-5">Overdue</Badge>}
                     {isProjected && <Badge variant="outline" className="ml-2 text-[10px] px-1 h-5 text-muted-foreground border-purple-200 bg-purple-50">Future</Badge>}
                   </div>
                   
                   <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Stage {stageDisplay}</span>
                      {!isProjected && (
                        <div className="flex gap-1">
                            {item.quiz.course_id && (
                                <Link href={`/course-viewer?courseId=${item.quiz.course_id}&itemId=${item.quiz.note_item_id}&view=reader&quizId=${item.quiz.id}`}>
                                    <Button size="sm" variant="outline" className="h-7 text-xs hover:bg-secondary/80" title="Review Notes First">
                                    📝 Notes
                                    </Button>
                                </Link>
                            )}
                            <Link href={`/course-quiz/${item.quiz.id}?mode=spaced-repetition`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs hover:bg-primary hover:text-primary-foreground">
                                Start
                                </Button>
                            </Link>
                        </div>
                      )}
                      {isProjected && (
                        <span className="text-[10px] italic">Unlock by passing previous</span>
                      )}
                   </div>
                 </div>
               );
            })
          ) : (
             <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                <p>No tasks for this day.</p>
                <p className="text-xs opacity-70 mt-1">Select another date or relax! ☕</p>
             </div>
          )}
        </CardContent>
        {/* Completed Section (History) */}
        {completedHistory.length > 0 && (
            <div className="p-4 border-t bg-muted/10 shrink-0">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed Today</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {completedHistory.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-2 rounded bg-card border border-border/50 text-xs shadow-sm">
                           <span className="truncate max-w-[140px] font-medium" title={attempt.quiz?.title}>{attempt.quiz?.title || 'Unknown Quiz'}</span>
                           <Badge variant={attempt.passed ? "default" : "secondary"} className={`text-[10px] h-5 ${attempt.passed ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}>
                              {attempt.score}%
                           </Badge>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </Card>
        
      {/* 2. MIDDLE: Activity Graph Widget (25% width -> 3/12 cols, same as tasks) */}
      <div className="lg:col-span-3 h-full min-h-[250px] lg:min-h-0">
         <ActivityGraph />
      </div>

      {/* 3. RIGHT: Calendar Grid (50% width -> 6/12 cols) */}
      <Card className="lg:col-span-6 flex flex-col h-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b bg-muted/10">
          <div className="flex items-center space-x-2">
             <CalendarIcon className="w-5 h-5 text-muted-foreground"/>
             <span className="font-semibold text-lg">{formatMonthYear(currentDate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="w-4 h-4"/></Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date())} className="text-xs">Today</Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight className="w-4 h-4"/></Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1">
          {/* Day Labels */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-2 h-full content-start">
            {calendarGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="bg-transparent aspect-square" />;

              const dateKey = date.toDateString(); // Keep this for schedule lookup (if that uses it)
              
              // Create local YYYY-MM-DD key for activity lookup
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              const activityKey = `${y}-${m}-${d}`;

              const items = schedulesByDate[dateKey] || [];
              const isTodayDate = isToday(date);
              const isSelected = isSameDay(date, selectedDate);
              
              const projectedCount = items.filter(i => i.isProjected).length;
              const overdueCount = items.filter(i => !i.isProjected && new Date(i.next_due_at) < new Date()).length;
              // Real Pending = Total - Overdue - Projected
              const pendingCount = items.length - overdueCount - projectedCount;

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between relative
                    hover:shadow-sm
                    ${isSelected 
                       ? 'bg-primary/5 border-primary ring-1 ring-primary' 
                       : isTodayDate 
                          ? 'bg-accent/40 border-accent-foreground/20' 
                          : 'bg-card/50 dark:bg-black/40 border-border/60 hover:bg-accent/50 dark:hover:bg-accent/20 hover:border-primary/30'}
                  `}
                >
                  <div className="flex justify-between items-start w-full relative">
                     <span className={`text-xs font-medium ${isTodayDate ? 'text-primary' : 'text-foreground/80'}`}>
                        {date.getDate()}
                     </span>
                     {/* Daily Activity Badge */}
                     {(activityMap[activityKey] || 0) > 0 && (
                        <div className="absolute top-[-6px] right-[-6px] z-10">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                              {activityMap[activityKey]}
                            </span>
                        </div>
                     )}
                  </div>
                  
                  {/* Indicators */}
                  {(overdueCount > 0 || pendingCount > 0 || projectedCount > 0) && (
                     <div className="flex gap-1 flex-wrap content-end mt-auto">
                       {overdueCount > 0 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500" title={`${overdueCount} Overdue`}/>
                       )}
                       {pendingCount > 0 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" title={`${pendingCount} Due`}/>
                       )}
                       {projectedCount > 0 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-400 opacity-50" title={`${projectedCount} Future`}/>
                       )}
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
