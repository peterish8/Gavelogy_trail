"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Target, TrendingUp, Award } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

interface Attempt {
  id: string;
  score: number;
  subject?: string;
  completedAt: number;
}

interface PerformancePanelProps {
  attempts: Attempt[];
}

export function PerformancePanel({ attempts }: PerformancePanelProps) {
  const stats = useMemo(() => {
    if (attempts.length === 0) return null;

    const totalAttempts = attempts.length;
    const avgScore = Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalAttempts);
    const bestScore = Math.max(...attempts.map((a) => a.score));

    // Subject breakdown
    const subjectMap: Record<string, { total: number; count: number }> = {};
    attempts.forEach((a) => {
      const s = a.subject || "Unknown";
      if (!subjectMap[s]) subjectMap[s] = { total: 0, count: 0 };
      subjectMap[s].total += a.score;
      subjectMap[s].count++;
    });
    const subjectStats = Object.entries(subjectMap)
      .map(([name, { total, count }]) => ({
        name,
        avg: Math.round(total / count),
        count,
      }))
      .sort((a, b) => b.avg - a.avg);

    // Trend: diff between first half and second half average
    const sorted = [...attempts].sort((a, b) => a.completedAt - b.completedAt);
    const half = Math.ceil(sorted.length / 2);
    const older = sorted.slice(0, half).reduce((s, a) => s + a.score, 0) / half;
    const newer = sorted.slice(half).reduce((s, a) => s + a.score, 0) / Math.max(sorted.length - half, 1);
    const trend = Math.round(newer - older);

    return { totalAttempts, avgScore, bestScore, subjectStats, trend };
  }, [attempts]);

  const getSubjectColor = (name: string) => {
    if (name === "Contemporary Cases") return { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" };
    if (name === "PYQ") return { bar: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" };
    if (name === "Mock Test") return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" };
    return { bar: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20" };
  };

  if (!stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-border bg-card">
        <Award className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No stats yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Complete quizzes to see your performance overview here.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="flex flex-col gap-3 h-full"
    >
      {/* Top card: Overall Accuracy */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <CircularProgress value={stats.avgScore} size={64} strokeWidth={6} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Avg Accuracy</p>
          <p className="text-2xl font-bold text-foreground leading-none">{stats.avgScore}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span></p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className={`w-3 h-3 ${stats.trend >= 0 ? "text-green-500" : "text-red-500"}`} />
            <span className={`text-[11px] font-medium ${stats.trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {stats.trend >= 0 ? "+" : ""}{stats.trend}% recent trend
            </span>
          </div>
        </div>
      </div>

      {/* Quick stat row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: BookOpen, label: "Total", value: stats.totalAttempts, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Trophy, label: "Best", value: `${stats.bestScore}%`, color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Flame, label: "Streak", value: "—", color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-border bg-card shadow-xs text-center">
            <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-base font-bold text-foreground leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Subject mastery bars */}
      <div className="flex-1 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Breakdown</p>
        </div>

        <div className="space-y-3">
          {stats.subjectStats.slice(0, 4).map(({ name, avg, count }) => {
            const colors = getSubjectColor(name);
            // Shorter display name
            const shortName = name === "Contemporary Cases" ? "Cont. Cases" : name;
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${colors.text} truncate max-w-[110px]`}>{shortName}</span>
                    <span className="text-[10px] text-muted-foreground/60">({count})</span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{avg}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avg}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full ${colors.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
