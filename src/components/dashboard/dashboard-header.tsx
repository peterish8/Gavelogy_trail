"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, BookOpen, Plus, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useQuizStore } from "@/lib/stores/quiz";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { userStreak, loadUserStreak } = useStreakStore();
  const { mistakes } = useMistakeStore();
  const { getQuizStats } = useQuizStore();

  useEffect(() => {
    loadUserStreak();
  }, [loadUserStreak]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";
  const initials = (profile?.full_name ?? "ST")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const streak = userStreak?.current_streak ?? 0;
  const cardsDue = mistakes?.filter((m) => !m.is_mastered).length ?? 0;
  const quizStats = getQuizStats();
  const avgScore = Math.round(quizStats.averageScore);
  const totalQuizzes = quizStats.totalAttempts;

  const pills = [
    ...(streak > 0 ? [{ icon: Flame, label: `${streak} day streak`, color: "text-orange-500", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" }] : []),
    ...(cardsDue > 0 ? [{ icon: BookOpen, label: `${cardsDue} due`, color: "text-violet-600 dark:text-violet-400", bg: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.22)" }] : []),
    ...(totalQuizzes > 0 ? [{ icon: null, label: `${avgScore}% avg`, color: "text-teal-600 dark:text-teal-400", bg: "rgba(20,138,136,0.10)", border: "rgba(20,138,136,0.22)" }] : []),
  ];

  return (
    <header className="w-full mb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(28px) saturate(1.8)",
          WebkitBackdropFilter: "blur(28px) saturate(1.8)",
          boxShadow: "0 2px 20px rgba(75,42,214,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* Dark mode override layer */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none transition-opacity duration-200"
          style={{
            background: "#000000",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        />
        {/* Top luminous line */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px dark:opacity-30"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.85) 70%, transparent)" }} />

        {/* Content */}
        <div className="relative z-10 px-5 py-4 flex items-center justify-between gap-4">

          {/* Left — avatar + greeting + pills */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 select-none bg-white dark:bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-none"
              style={{
                border: "1px solid rgba(124,58,237,0.35)",
                color: "var(--brand)",
              }}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-3)]">
                {getGreeting()}
              </p>
              <h1
                className="text-base font-bold leading-snug text-[var(--ink)] truncate"
                style={{ fontFamily: "var(--display-family)", letterSpacing: "-0.02em" }}
              >
                {firstName}
              </h1>
            </div>

            {/* Stat pills */}
            {pills.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                {pills.map((pill, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${pill.color}`}
                    style={{
                      background: pill.bg,
                      border: `1px solid ${pill.border}`,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    {pill.icon && <pill.icon className="h-3 w-3" />}
                    {pill.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right — glassmorphism buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {cardsDue > 0 && (
              <button
                onClick={() => router.push("/mistake-quiz")}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(124,58,237,0.10)",
                  color: "var(--brand)",
                }}
              >
                {cardsDue} due
                <ArrowRight className="h-3 w-3" />
              </button>
            )}

            <button
              onClick={() => router.push("/quiz")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(75,42,214,0.7)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(124,58,237,0.4)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(75,42,214,0.3)",
              }}
            >
              <Plus className="h-4 w-4" />
              Start Quiz
            </button>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
