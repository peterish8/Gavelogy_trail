"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BookOpen, Award } from "lucide-react";
import { useQuizStore } from "@/lib/stores/quiz";
import { useMistakeStore } from "@/lib/stores/mistakes";

export default function PerformanceTab() {
  const { getQuizStats } = useQuizStore();
  const { confidenceStats } = useMistakeStore();
  const stats = getQuizStats();

  const weeklyChange = stats.weeklyChange;
  const weeklyQuizzes = stats.recentAttempts.filter(
    (a) => Date.now() - a.completedAt <= 7 * 24 * 60 * 60 * 1000
  ).length;

  // Real mock test scores — last 6 quiz attempts sorted oldest→newest
  const recentScores = [...stats.recentAttempts]
    .sort((a, b) => a.completedAt - b.completedAt)
    .slice(-6)
    .map((a, i) => ({ mock: i + 1, score: Math.round(a.score) }));

  // Subject accuracy from real data
  const subjectAccuracy = Object.values(stats.attemptsBySubject)
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
    .slice(0, 6)
    .map((s) => ({
      subject: s.subject,
      accuracy: Math.round(s.averageScore),
    }));

  // Confidence data from store (filled by loadConfidenceStats)
  const totalConfidence = confidenceStats.reduce(
    (sum, s) => sum + s.total_questions,
    0
  );
  const confidenceData = confidenceStats.map((s) => {
    const correct = s.correct_confident + s.correct_educated_guess + s.correct_fluke;
    const total = s.total_questions;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const pct = totalConfidence > 0 ? Math.round((total / totalConfidence) * 100) : 0;
    return { type: s.subject, value: pct, accuracy };
  });

  // Performance insights from real data
  const bestSubject = Object.values(stats.attemptsBySubject).sort(
    (a, b) => b.averageScore - a.averageScore
  )[0];
  const worstSubject = Object.values(stats.attemptsBySubject).sort(
    (a, b) => a.averageScore - b.averageScore
  )[0];
  const confidentAccuracy =
    confidenceStats.length > 0
      ? Math.round(
          (confidenceStats[0].correct_confident /
            Math.max(
              1,
              confidenceStats[0].correct_confident +
                confidenceStats[0].wrong_confident
            )) *
            100
        )
      : null;

  const hasAttempts = stats.totalAttempts > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Accuracy
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.averageScore)}%
                </p>
                {weeklyChange !== 0 ? (
                  <p
                    className={`text-xs ${weeklyChange > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {weeklyChange > 0 ? "+" : ""}
                    {weeklyChange}% this week
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No change this week</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Quizzes
                </p>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                <p className="text-xs text-green-600">
                  +{weeklyQuizzes} this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pass Rate
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.passRate)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.passedCount} of {stats.totalAttempts} passed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Improvement Trend
                </p>
                <p className="text-2xl font-bold">
                  {weeklyChange >= 0 ? "+" : ""}
                  {weeklyChange}%
                </p>
                <p className="text-xs text-muted-foreground">vs last week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quiz Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Recent Quiz Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {recentScores.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No quiz attempts yet
                </p>
              ) : (
                <div className="w-full">
                  <div className="flex items-end justify-between h-48 space-x-2">
                    {recentScores.map((data, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t w-full transition-all duration-500 hover:from-blue-600 hover:to-blue-400"
                          style={{ height: `${(data.score / 100) * 180}px` }}
                          title={`Quiz ${data.mock}: ${data.score}%`}
                        />
                        <span className="text-xs mt-2 font-medium">
                          #{data.mock}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {data.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Subject-wise Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectAccuracy.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Complete quizzes with subject tags to see breakdown
              </p>
            ) : (
              <div className="space-y-3">
                {subjectAccuracy.map((subject, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <span className="text-muted-foreground">
                        {subject.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          subject.accuracy >= 75
                            ? "bg-green-500"
                            : subject.accuracy >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${subject.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confidence vs Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Confidence vs Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {confidenceData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No confidence data yet — answer quizzes to see patterns
              </p>
            ) : (
              <div className="space-y-4">
                {confidenceData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.type}</span>
                      <span className="text-muted-foreground">
                        {data.value}% of answers • {data.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                        style={{ width: `${data.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasAttempts ? (
              <p className="text-muted-foreground text-sm">
                Complete some quizzes to see personalised insights
              </p>
            ) : (
              <>
                {confidentAccuracy !== null && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      🔥 Your confident answers are {confidentAccuracy}% accurate!
                    </p>
                  </div>
                )}
                {worstSubject && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      ⚠️ Weakest subject: {worstSubject.subject} (
                      {Math.round(worstSubject.averageScore)}%)
                    </p>
                  </div>
                )}
                {bestSubject && bestSubject.subject !== worstSubject?.subject && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      📈 Strongest subject: {bestSubject.subject} (
                      {Math.round(bestSubject.averageScore)}%)
                    </p>
                  </div>
                )}
                {weeklyChange > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      🚀 You improved by {weeklyChange}% compared to last week!
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
