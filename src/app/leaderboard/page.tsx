"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { Trophy, Flame, Target, BookOpen, Award } from "lucide-react";

export default function LeaderboardPage() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { leaderboard, userStreak, loadLeaderboard, loadUserStreak } =
    useStreakStore();

  // Enable copy protection
  useCopyProtection();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeaderboard();
      loadUserStreak();
    }
  }, [isAuthenticated, loadLeaderboard, loadUserStreak]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      <Header />

      <div className="container mx-auto px-4 py-8 no-copy">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Compete with other CLAT PG aspirants and climb the ranks!
          </p>
        </div>

        {/* User's Current Stats */}
        {userStreak && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Your Current Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="h-6 w-6 text-orange-500 mr-1" />
                    <span className="text-2xl font-bold text-orange-600">
                      {userStreak.current_streak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current Streak
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-purple-500 mr-1" />
                    <span className="text-2xl font-bold text-purple-600">
                      {userStreak.longest_streak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-6 w-6 text-green-500 mr-1" />
                    <span className="text-2xl font-bold text-green-600">
                      {userStreak.total_quizzes_completed}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Quizzes Done</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-6 w-6 text-blue-500 mr-1" />
                    <span className="text-2xl font-bold text-blue-600">
                      {userStreak.total_score}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              Top 10 Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.map((user, index) => {
                  const isCurrentUser = user.user_id === user?.id;
                  const rank = index + 1;

                  // Define gradient classes for top 3
                  const getRankGradient = (rank: number) => {
                    switch (rank) {
                      case 1:
                        return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white";
                      case 2:
                        return "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white";
                      case 3:
                        return "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white";
                      default:
                        return "bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 text-gray-800 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 dark:text-white";
                    }
                  };

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isCurrentUser
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-gray-200 dark:border-gray-700"
                      } ${getRankGradient(rank)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            rank <= 3
                              ? "bg-white/20 backdrop-blur-sm"
                              : "bg-white dark:bg-gray-800"
                          }`}
                        >
                          {rank <= 3 ? (
                            <span className="text-xl font-bold">
                              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <span className="text-sm font-bold">{rank}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">
                              {user.username}
                            </span>
                            {isCurrentUser && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-white/20 text-white border-white/30"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm opacity-90">
                            <span className="flex items-center">
                              <Flame className="h-4 w-4 mr-1" />
                              {user.current_streak} days
                            </span>
                            <span className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              {user.total_score} pts
                            </span>
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {user.total_quizzes_completed} quizzes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Data Yet
                </h3>
                <p className="text-muted-foreground">
                  Start completing quizzes and studying cases to appear on the
                  leaderboard!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
