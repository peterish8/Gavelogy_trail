"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Target, TrendingUp, TrendingDown, Award } from "lucide-react";
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

    const subjectMap: Record<string, { total: number; count: number }> = {};
    attempts.forEach((a) => {
      const s = a.subject || "Unknown";
      if (!subjectMap[s]) subjectMap[s] = { total: 0, count: 0 };
      subjectMap[s].total += a.score;
      subjectMap[s].count++;
    });
    const subjectStats = Object.entries(subjectMap)
      .map(([name, { total, count }]) => ({ name, avg: Math.round(total / count), count }))
      .sort((a, b) => b.avg - a.avg);

    const sorted = [...attempts].sort((a, b) => a.completedAt - b.completedAt);
    const half = Math.ceil(sorted.length / 2);
    const older = sorted.slice(0, half).reduce((s, a) => s + a.score, 0) / half;
    const newer = sorted.slice(half).reduce((s, a) => s + a.score, 0) / Math.max(sorted.length - half, 1);
    const trend = Math.round(newer - older);

    return { totalAttempts, avgScore, bestScore, subjectStats, trend };
  }, [attempts]);

  const getSubjectColor = (name: string) => {
    if (name === "Contemporary Cases") return { bar: "bg-[#148A88]", text: "text-[#148A88] dark:text-teal-400" };
    if (name === "PYQ") return { bar: "bg-[#4B2AD6]", text: "text-[#4B2AD6] dark:text-violet-400" };
    if (name === "Mock Test") return { bar: "bg-[#A36009]", text: "text-[#A36009] dark:text-amber-400" };
    return { bar: "bg-[#857FA0]", text: "text-[#857FA0] dark:text-slate-400" };
  };

  if (!stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl glass-card">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-soft)] dark:bg-[rgba(167,139,250,0.12)] border border-[var(--brand-border)] dark:border-[rgba(167,139,250,0.2)] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <Award className="w-7 h-7 text-[var(--brand)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--ink)] mb-1">No stats yet</p>
        <p className="text-xs text-[var(--ink-3)]">Complete quizzes to see your performance overview.</p>
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
      {/* Avg accuracy — primary card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl tier-2-card">
        <CircularProgress value={stats.avgScore} size={64} strokeWidth={6} />
        <div className="flex-1 min-w-0">
          <p className="meta-label mb-1">Avg Accuracy</p>
          <p className="stat-number">
            {stats.avgScore}
            <span className="text-sm font-normal text-[var(--ink-3)] ml-0.5">%</span>
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            {stats.trend >= 0
              ? <TrendingUp className="w-3 h-3 text-[#1F7A52]" />
              : <TrendingDown className="w-3 h-3 text-[#A11D2E]" />
            }
            <span className={`text-[11px] font-semibold ${stats.trend >= 0 ? "text-[#1F7A52]" : "text-[#A11D2E]"}`}>
              {stats.trend >= 0 ? "+" : ""}{stats.trend}% recent trend
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: BookOpen,
            label: "Total",
            value: stats.totalAttempts,
            color: "text-[#4B2AD6] dark:text-violet-400",
            bg: "rgba(75,42,214,0.10)",
            border: "rgba(75,42,214,0.18)",
            iconGlow: "rgba(75,42,214,0.15)",
          },
          {
            icon: Trophy,
            label: "Best",
            value: `${stats.bestScore}%`,
            color: "text-[#A36009] dark:text-amber-400",
            bg: "rgba(163,96,9,0.10)",
            border: "rgba(163,96,9,0.18)",
            iconGlow: "rgba(163,96,9,0.15)",
          },
          {
            icon: Flame,
            label: "Streak",
            value: "—",
            color: "text-[#A23268] dark:text-pink-400",
            bg: "rgba(162,50,104,0.10)",
            border: "rgba(162,50,104,0.18)",
            iconGlow: "rgba(162,50,104,0.15)",
          },
        ].map(({ icon: Icon, label, value, color, bg, border, iconGlow }) => (
          <div
            key={label}
            className="stat-glass-card flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px ${iconGlow}`,
              }}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className={`text-lg font-extrabold leading-none ${color}`}>{value}</p>
            <p className="meta-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Subject mastery bars */}
      <div className="flex-1 p-4 rounded-2xl glass-card overflow-hidden">
        <div className="flex items-center gap-2 mb-3.5">
          <Target className="w-3.5 h-3.5 text-[var(--ink-3)]" />
          <p className="meta-label">Subject Breakdown</p>
        </div>
        <div className="space-y-3.5">
          {stats.subjectStats.slice(0, 4).map(({ name, avg, count }) => {
            const colors = getSubjectColor(name);
            const shortName = name === "Contemporary Cases" ? "Cont. Cases" : name;
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${colors.text} truncate max-w-[110px]`}>{shortName}</span>
                    <span className="text-[10px] text-[var(--ink-3)]/60">({count})</span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--ink)]">{avg}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(133,127,160,0.12)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avg}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full ${colors.bar}`}
                    style={{ boxShadow: `0 0 6px ${colors.bar.replace("bg-[", "").replace("]", "")}66` }}
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
