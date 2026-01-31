"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BookOpen, Award } from "lucide-react";
import { useQuizStore } from "@/lib/stores/quiz";

export default function PerformanceTab() {
  const { getQuizStats, getSubjectStats } = useQuizStore();
  const stats = getQuizStats();

  // Calculate KPIs from real data
  const kpiData = {
    accuracy: {
      value: Math.round(stats.averageScore),
      change: 4, // Mock change for now
      label: "Overall Accuracy",
    },
    totalQuizzes: {
      value: stats.totalAttempts,
      change: 12, // Mock change for now
      label: "Total Quizzes",
    },
    avgMockScore: {
      value: Math.round(stats.averageScore),
      change: 3, // Mock change for now
      label: "Avg Mock Score",
    },
    improvement: {
      value: 12, // Mock improvement
      change: 2,
      label: "Improvement Trend",
    },
  };

  const mockScores = [
    { mock: 1, score: 65 },
    { mock: 2, score: 68 },
    { mock: 3, score: 74 },
    { mock: 4, score: 71 },
    { mock: 5, score: 78 },
    { mock: 6, score: 82 },
  ];

  const subjectAccuracy = Object.entries(stats.attemptsBySubject).map(
    ([subject]) => {
      const subjectStats = getSubjectStats(subject);
      return {
        subject,
        accuracy: Math.round(subjectStats.averageScore) || 0,
      };
    }
  );

  const confidenceData = [
    { type: "Confident", value: 45, accuracy: 82 },
    { type: "Guess", value: 30, accuracy: 65 },
    { type: "Fluke", value: 25, accuracy: 58 },
  ];

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
                  {kpiData.accuracy.label}
                </p>
                <p className="text-2xl font-bold">{kpiData.accuracy.value}%</p>
                <p className="text-xs text-green-600">
                  +{kpiData.accuracy.change}% this week
                </p>
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
                  {kpiData.totalQuizzes.label}
                </p>
                <p className="text-2xl font-bold">
                  {kpiData.totalQuizzes.value}
                </p>
                <p className="text-xs text-green-600">
                  +{kpiData.totalQuizzes.change} completed
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
                  {kpiData.avgMockScore.label}
                </p>
                <p className="text-2xl font-bold">
                  {kpiData.avgMockScore.value}%
                </p>
                <p className="text-xs text-green-600">
                  +{kpiData.avgMockScore.change}% improvement
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
                  {kpiData.improvement.label}
                </p>
                <p className="text-2xl font-bold">
                  +{kpiData.improvement.value}%
                </p>
                <p className="text-xs text-green-600">since last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Test Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Mock Test Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full">
                <div className="flex items-end justify-between h-48 space-x-2">
                  {mockScores.map((data, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t w-full transition-all duration-500 hover:from-blue-600 hover:to-blue-400"
                        style={{ height: `${(data.score / 100) * 180}px` }}
                        title={`Mock ${data.mock}: ${data.score}%`}
                      />
                      <span className="text-xs mt-2 font-medium">
                        Mock {data.mock}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {data.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
            <div className="space-y-4">
              {confidenceData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{data.type}</span>
                    <span className="text-muted-foreground">
                      {data.value}% • {data.accuracy}% accuracy
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
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">
                🔥 Your confident answers are 82% accurate!
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">
                ⚠️ Weakest subject: Administrative Law (54%)
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">
                📈 Fastest improvement: Jurisprudence (+10%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
