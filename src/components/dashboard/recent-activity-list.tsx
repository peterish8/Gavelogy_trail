"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Target, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@/components/ui/circular-progress";

interface Attempt {
  id: string;
  score: number;
  totalQuestions?: number;
  subject?: string;
  topic?: string;
  completedAt: number;
}

interface RecentActivityListProps {
  attempts: Attempt[];
}

const SUBJECT_STYLES: Record<string, {
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  iconText: string;
  glowHover: string;
  strip: string;
}> = {
  "Contemporary Cases": {
    icon: <BookOpen className="w-4 h-4" />,
    accentColor: "#148A88",
    iconBg: "rgba(20,138,136,0.12)",
    iconText: "#148A88",
    glowHover: "hover:shadow-[0_6px_24px_rgba(20,138,136,0.18)]",
    strip: "#148A88",
  },
  "PYQ": {
    icon: <Clock className="w-4 h-4" />,
    accentColor: "#4B2AD6",
    iconBg: "rgba(75,42,214,0.12)",
    iconText: "#4B2AD6",
    glowHover: "hover:shadow-[0_6px_24px_rgba(75,42,214,0.18)]",
    strip: "#4B2AD6",
  },
  "Mock Test": {
    icon: <Target className="w-4 h-4" />,
    accentColor: "#A36009",
    iconBg: "rgba(163,96,9,0.12)",
    iconText: "#A36009",
    glowHover: "hover:shadow-[0_6px_24px_rgba(163,96,9,0.18)]",
    strip: "#A36009",
  },
};

const DEFAULT_STYLE = {
  icon: <BookOpen className="w-4 h-4" />,
  accentColor: "#857FA0",
  iconBg: "rgba(133,127,160,0.12)",
  iconText: "#857FA0",
  glowHover: "hover:shadow-[0_6px_24px_rgba(133,127,160,0.15)]",
  strip: "#857FA0",
};

function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

function formatTopic(subject: string, topic: string) {
  if (subject === "Contemporary Cases") {
    const parts = topic.split(". ");
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      return parts.slice(1).join(". ");
    }
  }
  return topic;
}

export function RecentActivityList({ attempts }: RecentActivityListProps) {
  const router = useRouter();

  if (attempts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      >
        <div className="relative w-16 h-16 mb-5 flex items-center justify-center rounded-2xl bg-[var(--brand-soft)] dark:bg-[rgba(167,139,250,0.12)] border border-[var(--brand-border)] dark:border-[rgba(167,139,250,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <Target className="h-8 w-8 text-[var(--brand)]" />
        </div>
        <h3 className="text-base font-semibold mb-1.5 text-[var(--ink)]">No recent activity yet</h3>
        <p className="text-[var(--ink-3)] max-w-[260px] mb-7 text-sm leading-relaxed">
          Complete quizzes to track your progress and accuracy here.
        </p>
        <Button onClick={() => router.push("/courses")} variant="outline" className="rounded-xl px-6">
          Browse Courses <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attempts.map((attempt, idx) => {
        const subjectStr = attempt.subject || "Course Quiz";
        const style = SUBJECT_STYLES[subjectStr] ?? DEFAULT_STYLE;
        const topic = formatTopic(subjectStr, attempt.topic || "Quiz Session");
        const accuracy = attempt.score;
        const totalQs = attempt.totalQuestions || 0;
        const correct = totalQs > 0 ? Math.round((accuracy / 100) * totalQs) : null;
        const wrong = correct !== null ? totalQs - correct : null;

        return (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.28 }}
            className={`
              group relative flex items-center gap-3 md:gap-4 p-3 md:p-3.5
              rounded-xl overflow-hidden activity-row card-interactive cursor-default
              ${style.glowHover}
            `}
          >
            {/* Left accent strip */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ background: style.strip }}
            />

            {/* Icon box */}
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ml-1"
              style={{
                background: style.iconBg,
                backdropFilter: "blur(8px)",
                border: `1px solid ${style.accentColor}22`,
                color: style.iconText,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px ${style.accentColor}18`,
              }}
            >
              {style.icon}
            </div>

            {/* Subject + topic */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-[var(--ink)] truncate">{subjectStr}</span>
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--ink-3)] bg-white/50 dark:bg-white/[0.06] border border-white/60 dark:border-white/[0.10] px-1.5 py-0.5 rounded-md shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTimeAgo(attempt.completedAt)}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)] truncate leading-snug">{topic}</p>
              <div className="flex sm:hidden items-center gap-1 mt-0.5 text-[10px] text-[var(--ink-3)]">
                <Clock className="w-2.5 h-2.5" />
                {formatTimeAgo(attempt.completedAt)}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="shrink-0 flex items-center gap-2.5 md:gap-3">
              {correct !== null && (
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1F7A52] dark:text-emerald-400 bg-[#E6F2EC] dark:bg-emerald-500/12 border border-[#1F7A52]/15 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {correct}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A11D2E] dark:text-red-400 bg-[#F7E4E6] dark:bg-red-500/12 border border-[#A11D2E]/15 dark:border-red-500/20 px-1.5 py-0.5 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <XCircle className="w-2.5 h-2.5" />
                    {wrong}
                  </div>
                </div>
              )}

              <div className="shrink-0 group-hover:scale-105 transition-transform duration-200 ease-out">
                <CircularProgress value={accuracy} size={42} strokeWidth={4} />
              </div>
            </div>

          </motion.div>
        );
      })}
    </div>
  );
}
