"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, TrendingDown, Target } from "lucide-react";
import { useMistakeStore } from "@/lib/stores/mistakes";

export default function MistakesTab() {
  const { getMistakeStats, getActiveMistakes, getClearedMistakes } =
    useMistakeStore();
  const stats = getMistakeStats();

  // Calculate cleared this week
  const clearedMistakes = getClearedMistakes();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const clearedThisWeek = clearedMistakes.filter(
    (m) => m.clearedAt && m.clearedAt > oneWeekAgo
  ).length;

  // Get top weak subjects
  const topWeakSubjects = Object.entries(stats.mistakesBySubject)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([subject]) => subject);

  const mistakeData = {
    activeMistakes: stats.activeMistakes,
    clearedThisWeek: clearedThisWeek,
    clearanceRate: Math.round(stats.clearanceRate),
    topWeakSubjects:
      topWeakSubjects.length > 0 ? topWeakSubjects : ["No mistakes yet"],
  };

  const subjectMistakes = Object.entries(stats.mistakesBySubject).map(
    ([subject, mistakes]) => ({
      subject,
      mistakes,
      change: Math.floor(Math.random() * 10) - 5, // Mock change for now
    })
  );

  const weeklyClearance = [
    { week: "Week 1", cleared: 18 },
    { week: "Week 2", cleared: 22 },
    { week: "Week 3", cleared: 19 },
    { week: "Week 4", cleared: 25 },
    { week: "Week 5", cleared: 23 },
    { week: "Week 6", cleared: 28 },
  ];

  const getMistakeColor = (mistakes: number) => {
    if (mistakes <= 10) return "bg-green-500";
    if (mistakes <= 15) return "bg-yellow-500";
    if (mistakes <= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Mistake Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Mistakes
                </p>
                <p className="text-2xl font-bold">
                  {mistakeData.activeMistakes}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cleared This Week
                </p>
                <p className="text-2xl font-bold">
                  {mistakeData.clearedThisWeek}
                </p>
                <p className="text-xs text-green-600">+25% from last week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clearance Rate
                </p>
                <p className="text-2xl font-bold">
                  {mistakeData.clearanceRate}%
                </p>
                <p className="text-xs text-green-600">Above average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Top Weak Subjects
                </p>
                <p className="text-sm font-bold">
                  {mistakeData.topWeakSubjects.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">Focus areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Mistake Density Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {subjectMistakes.map((subject, index) => (
              <div
                key={index}
                className={`${getMistakeColor(
                  subject.mistakes
                )} rounded-lg p-3 text-white text-center cursor-pointer hover:opacity-80 transition-opacity`}
                title={`${subject.subject} — ${subject.mistakes} mistakes (${
                  subject.change > 0 ? "+" : ""
                }${subject.change} this week)`}
              >
                <div className="text-xs font-medium truncate">
                  {subject.subject.split(" ")[0]}
                </div>
                <div className="text-lg font-bold">{subject.mistakes}</div>
                <div className="text-xs opacity-75">
                  {subject.change > 0 ? "+" : ""}
                  {subject.change}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Low (≤10)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medium (11-15)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>High (16-20)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical ({">"}20)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mistake Clearance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📉 Mistake Clearance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full">
                <div className="flex items-end justify-between h-48 space-x-2">
                  {weeklyClearance.map((data, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="bg-gradient-to-t from-green-500 to-green-300 rounded-t w-full transition-all duration-500 hover:from-green-600 hover:to-green-400"
                        style={{ height: `${(data.cleared / 30) * 180}px` }}
                        title={`${data.week}: ${data.cleared} mistakes cleared`}
                      />
                      <span className="text-xs mt-2 font-medium">
                        {data.week.split(" ")[1]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {data.cleared}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Mistake Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Great Progress!
                </span>
              </div>
              <p className="text-sm text-green-700">
                You cleared 15 mistakes this week — keep it up! 🎉
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Improvement Trend
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Your mistake clearance rate is 15% above average
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Focus Areas
                </span>
              </div>
              <p className="text-sm text-orange-700">
                Concentrate on Administrative Law and Contract Law mistake
                quizzes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Mistake Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Subject-wise Mistake Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subjectMistakes.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${getMistakeColor(
                      subject.mistakes
                    )}`}
                  />
                  <span className="font-medium">{subject.subject}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {subject.mistakes} mistakes
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      subject.change < 0
                        ? "text-green-600"
                        : subject.change > 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {subject.change > 0 ? "+" : ""}
                    {subject.change} this week
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
