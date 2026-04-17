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

export function RecentActivityList({ attempts }: RecentActivityListProps) {
  const router = useRouter();

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTopicData = (subject: string) => {
    switch (subject) {
      case 'Contemporary Cases':
        return { icon: <BookOpen className="w-5 h-5" />, bg: "from-blue-600/20 to-indigo-600/20", border: "border-blue-500/20", glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]", text: "text-blue-400" };
      case 'PYQ':
        return { icon: <Clock className="w-5 h-5" />, bg: "from-purple-600/20 to-pink-600/20", border: "border-purple-500/20", glow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]", text: "text-purple-400" };
      case 'Mock Test':
        return { icon: <Target className="w-5 h-5" />, bg: "from-amber-600/20 to-orange-600/20", border: "border-amber-500/20", glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]", text: "text-amber-400" };
      default:
        return { icon: <BookOpen className="w-5 h-5" />, bg: "from-slate-600/20 to-zinc-600/20", border: "border-slate-500/20", glow: "group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]", text: "text-slate-400" };
    }
  };

  const formatTopicName = (subject: string, topic: string) => {
    if (subject === 'Contemporary Cases') {
      const parts = topic.split('. ');
      if (parts.length > 1) {
        const firstPart = parts[0];
        const isNumber = !isNaN(Number(firstPart));
        if (isNumber) {
          return parts.slice(1).join('. ');
        }
      }
    }
    return topic;
  };

  if (attempts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative overflow-hidden rounded-2xl border border-white/5 bg-background/30 backdrop-blur-xl p-12 flex flex-col items-center justify-center text-center"
      >
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Target className="h-10 w-10 text-primary animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground">No recent activity yet</h3>
        <p className="text-muted-foreground max-w-[300px] mb-8 text-sm leading-relaxed">
          Your journey awaits. Start taking quizzes to see your beautiful progress visualizations here.
        </p>
        
        <Button 
          onClick={() => router.push('/subjects')}
          className="rounded-full px-8 py-6 text-sm font-medium tracking-wide bg-primary/90 hover:bg-primary transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)]"
        >
          Browse Subjects <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {attempts.map((attempt, idx) => {
        const accuracy = attempt.score; 
        const totalQs = attempt.totalQuestions || 0;
        const correctCount = totalQs > 0 ? Math.round((accuracy / 100) * totalQs) : Math.round(accuracy/10); 
        const displayCorrect = totalQs > 0 ? correctCount : '-'; 
        const displayWrong = totalQs > 0 ? totalQs - correctCount : '-';

        const subjectStr = attempt.subject || 'Unknown Subject';
        const displayTopic = formatTopicName(subjectStr, attempt.topic || 'Unknown Session');
        const visualData = getTopicData(subjectStr);

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            key={attempt.id}
            className={`group relative flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-card dark:bg-zinc-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${visualData.glow}`}
          >
            {/* Left Section: Icon & Info */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              {/* Glowing Icon Box */}
              <div className={`shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg border bg-linear-to-br ${visualData.bg} ${visualData.border} ${visualData.text}`}>
                {visualData.icon}
              </div>

              {/* Central Info Column */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-sm text-foreground tracking-tight truncate">
                    {subjectStr}
                  </h4>
                  <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-medium bg-muted/50 border border-border/50">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(attempt.completedAt)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate opacity-90 group-hover:opacity-100 transition-opacity">
                  {displayTopic}
                </p>
                
                {/* Mobile Time Ago (hidden on sm) */}
                <div className="flex sm:hidden items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Clock className="w-[10px] h-[10px]" />
                  {formatTimeAgo(attempt.completedAt)}
                </div>
              </div>
            </div>

            {/* Right Section: Data Vis */}
            <div className="shrink-0 flex items-center gap-3 md:gap-5 pl-2">
              
              {/* Score Breakdown (Hidden on mobile) */}
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-500 bg-green-500/10 dark:bg-green-500/15 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{displayCorrect}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-500 bg-red-500/10 dark:bg-red-500/15 px-1.5 py-0.5 rounded">
                  <XCircle className="w-3 h-3" />
                  <span>{displayWrong}</span>
                </div>
              </div>

              {/* Magical SVG Progress Ring */}
              <div className="shrink-0 group-hover:scale-105 transition-transform duration-300 ease-out">
                <CircularProgress value={accuracy} size={42} strokeWidth={4} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
