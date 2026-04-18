"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Target, RefreshCw, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMistakeStore, MistakeRecord } from "@/lib/stores/mistakes";
import { useRouter } from "next/navigation";

export default function MistakesTab() {
  const { mistakes } = useMistakeStore();
  const router = useRouter();

  const stats = useMemo(() => {
    const total = mistakes.length;
    const mastered = mistakes.filter((m: MistakeRecord) => m.is_mastered).length;
    const active = total - mastered;
    const clearanceRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const clearedThisWeek = mistakes.filter(
      (m: MistakeRecord) => m.is_mastered && new Date(m.created_at).getTime() > oneWeekAgo
    ).length;

    const bySubject: Record<string, { active: number; mastered: number }> = {};
    mistakes.forEach((m: MistakeRecord) => {
      if (!bySubject[m.subject]) bySubject[m.subject] = { active: 0, mastered: 0 };
      if (m.is_mastered) bySubject[m.subject].mastered++;
      else bySubject[m.subject].active++;
    });

    const subjectRows = Object.entries(bySubject)
      .map(([subject, c]) => ({
        subject,
        active: c.active,
        mastered: c.mastered,
        total: c.active + c.mastered,
        clearRate: c.active + c.mastered > 0
          ? Math.round((c.mastered / (c.active + c.mastered)) * 100)
          : 0,
      }))
      .sort((a, b) => b.active - a.active);

    const topWeakSubjects = subjectRows.filter(s => s.active > 0).slice(0, 3);

    return { total, mastered, active, clearanceRate, clearedThisWeek, subjectRows, topWeakSubjects };
  }, [mistakes]);

  const getMistakeSeverityColor = (active: number) => {
    if (active <= 3) return "bg-green-500";
    if (active <= 8) return "bg-yellow-500";
    if (active <= 15) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Mistakes</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.active}</p>
                <p className="text-xs text-gray-500">need review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mastered</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.mastered}</p>
                <p className="text-xs text-green-600">+{stats.clearedThisWeek} this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clearance Rate</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.clearanceRate}%</p>
                <p className="text-xs text-gray-500">of all mistakes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <RefreshCw className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tracked</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500">all time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {stats.total === 0 && (
        <div className="bg-background border border-border rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">No mistakes tracked yet</p>
          <p className="text-xs text-gray-500 mt-1">Mistakes from quizzes will appear here for review</p>
        </div>
      )}

      {stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress bar card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🎯 Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stats.mastered} of {stats.total} cleared</p>
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.clearanceRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.clearanceRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400"
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>0%</span><span>100%</span>
              </div>

              {/* Top weak subjects */}
              {stats.topWeakSubjects.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Focus Areas</p>
                  <div className="space-y-2">
                    {stats.topWeakSubjects.map(s => (
                      <div key={s.subject} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.subject}</span>
                        </div>
                        <span className="text-xs font-bold text-red-600">{s.active} active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🗺️ Subject Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.subjectRows.slice(0, 7).map(({ subject, active, mastered, total, clearRate }) => (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getMistakeSeverityColor(active)}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject}</span>
                        <span className="text-[10px] text-gray-400">({total})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-500 font-semibold">{active} left</span>
                        <span className="text-gray-400">{clearRate}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${clearRate}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-green-500"
                      />
                      <div className="h-full flex-1 bg-red-400 opacity-60" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-green-500" /><span>Mastered</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-red-400 opacity-60" /><span>Active</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Practice CTA */}
      {stats.active > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {stats.active} mistake{stats.active > 1 ? "s" : ""} ready to practice
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Regular review sessions significantly improve retention
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/mistake-quiz")}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors shadow-sm"
              >
                Practice Now →
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
