"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, FileText, Clock, Flame } from "lucide-react";
import { useQuizStore } from "@/lib/stores/quiz";
import { useDailyActivity } from "@/hooks/use-daily-activity";

export default function ConsistencyTab() {
  const { getQuizStats } = useQuizStore();
  const stats = getQuizStats();

  // Get current month's activity from the hook
  const now = new Date();
  const { activities } = useDailyActivity(now.getFullYear(), now.getMonth() + 1);

  // Build a date→count lookup from daily activity records
  const activityMap: Record<string, number> = {};
  for (const a of activities) {
    activityMap[a.activity_date] = a.quizzes_completed ?? 0;
  }

  // Generate last 30 days of activity data using real DB data
  const activityData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    const count = activityMap[dateStr] ?? 0;
    // Map count to 0-4 activity level
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
    return { date: dateStr, activity: level, count };
  });

  // Real weekly stats
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekAttempts = stats.recentAttempts.filter(
    (a) => Date.now() - a.completedAt <= oneWeekMs
  );
  const lastWeekAttempts = stats.recentAttempts.filter(
    (a) => Date.now() - a.completedAt > oneWeekMs && Date.now() - a.completedAt <= 2 * oneWeekMs
  );

  const quizzesThisWeek = thisWeekAttempts.length;
  const quizzesLastWeek = lastWeekAttempts.length;
  const quizDelta = quizzesThisWeek - quizzesLastWeek;

  // Active days this week (unique dates)
  const activeDatesThisWeek = new Set(
    thisWeekAttempts.map((a) => new Date(a.completedAt).toDateString())
  );
  const activeDaysCount = activeDatesThisWeek.size;

  // Estimate study time: ~5 min per quiz attempt
  const studyMinutes = quizzesThisWeek * 5;
  const studyLastWeekMinutes = quizzesLastWeek * 5;
  const studyTimeDelta = studyMinutes - studyLastWeekMinutes;
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Active days in last 30 days (for motivational banner rank)
  const totalActiveDays = activityData.filter((d) => d.activity > 0).length;
  const consistencyPct = Math.round((totalActiveDays / 30) * 100);

  // Color Mapping Function (GitHub-style green gradient)
  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return "bg-muted";
      case 1: return "bg-green-200 dark:bg-green-900";
      case 2: return "bg-green-400 dark:bg-green-700";
      case 3: return "bg-green-600 dark:bg-green-500";
      case 4: return "bg-green-700 dark:bg-green-400";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Study Consistency Tracker
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Your learning activity over the past 30 days
        </p>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Activity Heatmap (Last 30 Days)
        </h4>

        <div className="grid grid-cols-10 gap-2 mb-4">
          {activityData.map((day, index) => (
            <div
              key={index}
              className={`aspect-square rounded ${getActivityColor(day.activity)} transition-all hover:scale-110 cursor-pointer pressable`}
              title={`${day.date}: ${day.count === 0 ? "No activity" : `${day.count} quiz${day.count > 1 ? "zes" : ""}`}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-4 h-4 rounded ${getActivityColor(level)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Quizzes This Week
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {quizzesThisWeek}
                </p>
                {quizDelta !== 0 ? (
                  <p className={`text-xs ${quizDelta > 0 ? "text-green-600" : "text-red-500"}`}>
                    {quizDelta > 0 ? "+" : ""}{quizDelta} vs last week
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Same as last week</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Attempts
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats.totalAttempts}
                </p>
                <p className="text-xs text-gray-500">all time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Study Time
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {formatTime(studyMinutes)}
                </p>
                {studyTimeDelta !== 0 ? (
                  <p className={`text-xs ${studyTimeDelta > 0 ? "text-green-600" : "text-red-500"}`}>
                    {studyTimeDelta > 0 ? "+" : ""}{formatTime(Math.abs(studyTimeDelta))} vs last week
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Same as last week</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Days
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {activeDaysCount}/7
                </p>
                <p className={`text-xs ${activeDaysCount >= 5 ? "text-green-600" : activeDaysCount >= 3 ? "text-yellow-600" : "text-gray-500"}`}>
                  {activeDaysCount >= 6 ? "Outstanding!" : activeDaysCount >= 4 ? "Great consistency!" : activeDaysCount >= 2 ? "Keep it up!" : "Start studying daily"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-linear-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-full">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {consistencyPct >= 70
                  ? "You're in the top 15% most consistent learners!"
                  : consistencyPct >= 40
                  ? `${totalActiveDays} active days this month — keep it going!`
                  : "Build your streak — daily practice makes perfect!"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalActiveDays} of 30 days active this month ({consistencyPct}% consistency)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
