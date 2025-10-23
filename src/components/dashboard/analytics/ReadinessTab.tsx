"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";

export default function ReadinessTab() {
  // Mock data
  const readinessScore = 78;
  const readinessLevel =
    readinessScore >= 75
      ? "Strong"
      : readinessScore >= 50
      ? "Moderate"
      : "Weak";
  const readinessEmoji =
    readinessScore >= 75 ? "🚀" : readinessScore >= 50 ? "👍" : "⚠️";

  const subjectMastery = [
    {
      subject: "Constitutional Law",
      accuracy: 85,
      status: "Strong",
      icon: "✅",
    },
    { subject: "Criminal Law", accuracy: 78, status: "Good", icon: "👍" },
    { subject: "Contract Law", accuracy: 72, status: "Good", icon: "👍" },
    { subject: "Torts", accuracy: 68, status: "Moderate", icon: "⚠️" },
    { subject: "Administrative Law", accuracy: 54, status: "Weak", icon: "⚠️" },
    { subject: "Jurisprudence", accuracy: 76, status: "Good", icon: "👍" },
    { subject: "Family Law", accuracy: 69, status: "Moderate", icon: "⚠️" },
    { subject: "Property Law", accuracy: 71, status: "Good", icon: "👍" },
    { subject: "Labour Law", accuracy: 63, status: "Moderate", icon: "⚠️" },
    {
      subject: "Environmental Law",
      accuracy: 67,
      status: "Moderate",
      icon: "⚠️",
    },
    { subject: "Cyber Law", accuracy: 73, status: "Good", icon: "👍" },
    {
      subject: "Intellectual Property",
      accuracy: 70,
      status: "Good",
      icon: "👍",
    },
  ];

  const progressStats = {
    subjectsAbove75: subjectMastery.filter((s) => s.accuracy >= 75).length,
    totalSubjects: subjectMastery.length,
    subjectsBelow60: subjectMastery.filter((s) => s.accuracy < 60).length,
  };

  const getReadinessColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessBgColor = (score: number) => {
    if (score >= 75) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Readiness Gauge */}
      <Card className={`${getReadinessBgColor(readinessScore)} border-2`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{readinessEmoji}</div>
            <h2 className="text-4xl font-bold mb-2">
              <span className={getReadinessColor(readinessScore)}>
                {readinessScore}/100
              </span>
            </h2>
            <h3 className="text-2xl font-semibold mb-4">
              {readinessLevel} —{" "}
              {readinessScore >= 75
                ? "On Track"
                : readinessScore >= 50
                ? "Getting There"
                : "Needs Focus"}
            </h3>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getReadinessColor(readinessScore)}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${readinessScore}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{readinessScore}%</span>
              </div>
            </div>

            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Weak (0-49)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Moderate (50-74)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Strong (75-100)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subjects Above 75%
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {progressStats.subjectsAbove75}/{progressStats.totalSubjects}
                </p>
                <p className="text-xs text-green-600">✅ Strong</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subjects 60-75%
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {progressStats.totalSubjects -
                    progressStats.subjectsAbove75 -
                    progressStats.subjectsBelow60}
                </p>
                <p className="text-xs text-yellow-600">👍 Good</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subjects Below 60%
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {progressStats.subjectsBelow60}
                </p>
                <p className="text-xs text-red-600">⚠️ Weak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Mastery Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Subject Mastery Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subjectMastery.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{subject.icon}</span>
                  <span className="font-medium">{subject.subject}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {subject.accuracy}%
                  </span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      subject.status === "Strong"
                        ? "bg-green-100 text-green-800"
                        : subject.status === "Good"
                        ? "bg-blue-100 text-blue-800"
                        : subject.status === "Moderate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subject.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Focus Areas
                </span>
              </div>
              <p className="text-sm text-orange-700">
                Focus on Administrative Law Mock 2 & Contract Mistake Quiz to
                boost readiness.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Performance Goal
                </span>
              </div>
              <p className="text-sm text-blue-700">
                You&apos;re close to top 20% scorers — just 5% more improvement
                needed!
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Strengths
                </span>
              </div>
              <p className="text-sm text-green-700">
                Constitutional Law and Criminal Law are your strongest subjects
                — leverage them!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">
                  Review Weak Subjects
                </span>
                <Button size="sm" variant="outline">
                  Start Review →
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Take Mock Test</span>
                <Button size="sm" variant="outline">
                  Start Mock →
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Mistake Quizzes</span>
                <Button size="sm" variant="outline">
                  Review Mistakes →
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">
                🚀 Ready for CLAT PG?
              </p>
              <p className="text-sm text-blue-700">
                With {readinessScore}% readiness, you&apos;re well-prepared!
                Keep practicing weak areas to reach 85%+.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
