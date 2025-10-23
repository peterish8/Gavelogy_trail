"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, FileText, Clock, Flame } from "lucide-react";

export default function ConsistencyTab() {
  // Mock data
  const streakData = {
    currentStreak: 8,
    longestStreak: 15,
    milestoneDays: 10,
  };

  const weeklySummary = {
    quizzesCompleted: 12,
    mockTestsAttempted: 2,
    mistakeQuizzes: 5,
    studyTime: "4h 20m",
    activeDays: "6/7",
  };

  const engagementTrend = {
    currentWeek: 22,
    lastWeek: 18,
    twoWeeksAgo: 15,
    threeWeeksAgo: 12,
  };

  // Generate activity data for the last 30 days
  const generateActivityData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        activity: Math.floor(Math.random() * 5), // 0-4 activity level
      });
    }
    return data;
  };

  const activityData = generateActivityData();

  // Color Mapping Function (GitHub-style green gradient)
  const getActivityColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted"; // No activity - gray
      case 1:
        return "bg-green-200 dark:bg-green-900"; // Light activity
      case 2:
        return "bg-green-400 dark:bg-green-700"; // Medium activity
      case 3:
        return "bg-green-600 dark:bg-green-500"; // High activity
      case 4:
        return "bg-green-700 dark:bg-green-400"; // Very high activity
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Study Consistency Tracker
          </h1>
        </div>
        <p className="text-gray-600">
          Your learning activity over the past 30 days
        </p>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800">
          Activity Heatmap (Last 30 Days)
        </h4>

        {/* The Grid - 10 columns of squares */}
        <div className="grid grid-cols-10 gap-2 mb-4">
          {activityData.map((day, index) => (
            <div
              key={index}
              className={`aspect-square rounded ${getActivityColor(
                day.activity
              )} transition-all hover:scale-110 cursor-pointer`}
              title={`${day.date}: ${
                day.activity === 0 ? "No activity" : `${day.activity} quizzes`
              }`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded ${getActivityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Quizzes Completed
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {weeklySummary.quizzesCompleted}
                </p>
                <p className="text-xs text-green-600">+3 vs last week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Mock Tests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {weeklySummary.mockTestsAttempted}
                </p>
                <p className="text-xs text-gray-500">Same as last week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold text-gray-800">
                  {weeklySummary.studyTime}
                </p>
                <p className="text-xs text-green-600">+45m vs last week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Days</p>
                <p className="text-2xl font-bold text-gray-800">
                  {weeklySummary.activeDays}
                </p>
                <p className="text-xs text-green-600">Great consistency!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                You&apos;re in the top 15% most consistent learners!
              </h3>
              <p className="text-sm text-gray-600">
                Keep up the amazing work! Consistency is key to success.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
