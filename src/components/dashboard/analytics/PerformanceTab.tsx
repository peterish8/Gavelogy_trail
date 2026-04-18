"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, BookOpen, Award, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizStore } from "@/lib/stores/quiz";
import { useMistakeStore } from "@/lib/stores/mistakes";

const SUBJECT_PALETTE: Record<string, { bg: string; text: string; bar: string }> = {
  "Contemporary Cases": { bg: "rgba(20,138,136,0.12)", text: "#148A88", bar: "bg-teal-500" },
  "PYQ":               { bg: "rgba(75,42,214,0.12)",  text: "#4B2AD6", bar: "bg-violet-600" },
  "Mock Test":         { bg: "rgba(163,96,9,0.12)",   text: "#A36009", bar: "bg-amber-500" },
  "General":           { bg: "rgba(133,127,160,0.12)",text: "#857FA0", bar: "bg-slate-400" },
};
const fallback = { bg: "rgba(100,116,139,0.12)", text: "#64748b", bar: "bg-slate-500" };
const getPalette = (s: string) => SUBJECT_PALETTE[s] ?? fallback;

export default function PerformanceTab() {
  const { getQuizStats, attempts: rawAttempts } = useQuizStore();
  const { confidenceStats } = useMistakeStore();
  const stats = getQuizStats();

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyQuizzes = stats.recentAttempts.filter(a => Date.now() - a.completedAt <= oneWeekMs).length;

  const trendData = useMemo(() =>
    [...rawAttempts]
      .sort((a, b) => a.completedAt - b.completedAt)
      .slice(-10)
      .map((a, i) => ({ idx: i + 1, score: Math.round(a.score) })),
    [rawAttempts]
  );

  const subjectRows = useMemo(() =>
    Object.values(stats.attemptsBySubject)
      .sort((a, b) => b.totalAttempts - a.totalAttempts)
      .slice(0, 6)
      .map(s => ({ subject: s.subject, avg: Math.round(s.averageScore), count: s.totalAttempts })),
    [stats.attemptsBySubject]
  );

  const bestSubject = subjectRows[0];
  const worstSubject = [...subjectRows].sort((a, b) => a.avg - b.avg)[0];

  return (
    <div className="space-y-6">

      {/* KPI Cards — same style as ConsistencyTab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Accuracy</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{Math.round(stats.averageScore)}%</p>
                {stats.weeklyChange !== 0 ? (
                  <p className={`text-xs ${stats.weeklyChange > 0 ? "text-green-600" : "text-red-500"}`}>
                    {stats.weeklyChange > 0 ? "+" : ""}{stats.weeklyChange}% this week
                  </p>
                ) : <p className="text-xs text-gray-500">No change this week</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalAttempts}</p>
                <p className="text-xs text-green-600">+{weeklyQuizzes} this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{Math.round(stats.passRate)}%</p>
                <p className="text-xs text-gray-500">{stats.passedCount} of {stats.totalAttempts} passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stats.weeklyChange >= 0 ? "bg-orange-100 dark:bg-orange-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                {stats.weeklyChange >= 0
                  ? <TrendingUp className="h-5 w-5 text-orange-500" />
                  : <TrendingDown className="h-5 w-5 text-red-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trend vs Last Week</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats.weeklyChange >= 0 ? "+" : ""}{stats.weeklyChange}%
                </p>
                <p className="text-xs text-gray-500">score change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📈 Score Trend
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last {trendData.length} quiz attempts</p>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                Complete quizzes to see your score trend
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400">
                  {[100, 75, 50, 25, 0].map(v => <span key={v}>{v}</span>)}
                </div>
                <div className="ml-6 flex items-end gap-1.5 h-40">
                  {trendData.map((d, i) => {
                    const h = Math.max((d.score / 100) * 100, 4);
                    const color = d.score >= 75 ? "#22c55e" : d.score >= 60 ? "#f59e0b" : "#ef4444";
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                        className="flex-1 rounded-t-lg cursor-pointer group relative"
                        style={{ backgroundColor: color, opacity: 0.85 }}
                        title={`Quiz ${d.idx}: ${d.score}%`}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {d.score}%
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="ml-6 flex gap-1.5 mt-1">
                  {trendData.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] text-gray-400">#{d.idx}</div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /><span>≥75%</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400" /><span>60–74%</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400" /><span>&lt;60%</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📊 Subject Accuracy
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Average score per subject</p>
          </CardHeader>
          <CardContent>
            {subjectRows.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                Complete quizzes to see subject breakdown
              </div>
            ) : (
              <div className="space-y-3.5">
                {subjectRows.map(({ subject, avg, count }) => {
                  const pal = getPalette(subject);
                  return (
                    <div key={subject}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-semibold" style={{ color: pal.text }}>{subject}</span>
                          <span className="text-[10px] text-gray-400">({count})</span>
                        </div>
                        <span className="text-[12px] font-bold text-gray-800 dark:text-gray-100">{avg}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${avg}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-2 rounded-full ${pal.bar}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {stats.totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bestSubject && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Strongest Subject</span>
              </div>
              <p className="text-base font-bold text-green-800 dark:text-green-200">{bestSubject.subject}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{bestSubject.avg}% average score</p>
            </div>
          )}
          {worstSubject && worstSubject.subject !== bestSubject?.subject && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">Needs Focus</span>
              </div>
              <p className="text-base font-bold text-red-800 dark:text-red-200">{worstSubject.subject}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{worstSubject.avg}% — review this subject</p>
            </div>
          )}
          {stats.weeklyChange !== 0 && (
            <div className={`p-4 rounded-lg border ${
              stats.weeklyChange > 0
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`h-4 w-4 ${stats.weeklyChange > 0 ? "text-blue-600" : "text-orange-600"}`} />
                <span className={`text-sm font-medium ${stats.weeklyChange > 0 ? "text-blue-800 dark:text-blue-300" : "text-orange-800 dark:text-orange-300"}`}>
                  {stats.weeklyChange > 0 ? "Weekly Improvement" : "Weekly Dip"}
                </span>
              </div>
              <p className={`text-base font-bold ${stats.weeklyChange > 0 ? "text-blue-800 dark:text-blue-200" : "text-orange-800 dark:text-orange-200"}`}>
                {stats.weeklyChange > 0 ? "+" : ""}{stats.weeklyChange}% vs last week
              </p>
              <p className={`text-xs ${stats.weeklyChange > 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
                {stats.weeklyChange > 0 ? "Great momentum!" : "Try more practice this week"}
              </p>
            </div>
          )}
          {confidenceStats.length > 0 && (() => {
            const cs = confidenceStats[0];
            const acc = cs.correct_confident > 0
              ? Math.round((cs.correct_confident / Math.max(1, cs.correct_confident + cs.wrong_confident)) * 100)
              : null;
            if (!acc) return null;
            return (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Confidence Accuracy</span>
                </div>
                <p className="text-base font-bold text-purple-800 dark:text-purple-200">{acc}% when confident</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {acc >= 80 ? "Excellent calibration!" : acc >= 60 ? "Good intuition" : "Review topics before marking confident"}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
