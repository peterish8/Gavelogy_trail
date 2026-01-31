"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
// AppHeader import removed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { Trophy, Flame, Target, Award, Zap, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { leaderboard, userStreak, bonuses, loadLeaderboard, loadUserStreak, loadBonuses } =
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
      loadBonuses();
    }
  }, [isAuthenticated, loadLeaderboard, loadUserStreak, loadBonuses]);

  // Find current user's position in leaderboard
  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        {/* AppHeader removed */}
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
      {/* AppHeader removed */}

      <motion.div 
        className="container mx-auto px-4 py-8 no-copy max-w-4xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className="mb-8 text-center" variants={item}>
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {currentMonth} Rankings
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Resets on the 1st of each month
          </p>
        </motion.div>

        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] z-0" />
        <div className="absolute top-0 left-0 right-0 h-96 bg-linear-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 pointer-events-none z-0" />

        {/* User's Current Stats */}
        {(userStreak || currentUserEntry) && (
          <motion.div variants={item} className="mb-8">
          <Card className="border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="h-6 w-6 text-orange-500 mr-1" />
                    <span className="text-3xl font-bold text-orange-600">
                      {userStreak?.current_streak || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current Streak
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-purple-500 mr-1" />
                    <span className="text-3xl font-bold text-purple-600">
                      {currentUserEntry?.monthly_points || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Streak Points</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-green-500 mr-1" />
                    <span className="text-3xl font-bold text-green-600">
                      {currentUserEntry?.all_time_points || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">All-Time</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="h-6 w-6 text-yellow-500 mr-1" />
                    <span className="text-3xl font-bold text-yellow-600">
                      #{currentUserEntry?.rank || '-'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Bonus Milestones */}
        {bonuses.length > 0 && (
          <motion.div variants={item} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Streak Bonuses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {bonuses.map((bonus) => {
                  const earned = (userStreak?.bonuses_claimed || []).includes(bonus.streak_days);
                  return (
                    <div
                      key={bonus.streak_days}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        earned 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/30' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50'
                      }`}
                    >
                      <span className="text-lg">{bonus.badge_emoji}</span>
                      <div className="text-sm">
                        <span className="font-semibold">{bonus.streak_days} days</span>
                        <span className="text-muted-foreground ml-1">+{bonus.bonus_points}pts</span>
                      </div>
                      {earned && <Badge variant="secondary" className="text-xs bg-green-100">✓</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              Top 10 - {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  const rank = entry.rank;

                  // Define styles for top 3
                  const getRankStyle = (rank: number) => {
                    switch (rank) {
                      case 1:
                        return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-white shadow-lg";
                      case 2:
                        return "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white";
                      case 3:
                        return "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white";
                      default:
                        return "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
                    }
                  };

                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all ${getRankStyle(rank)} ${
                        isCurrentUser ? "ring-2 ring-blue-500 ring-offset-2" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            rank <= 3 ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          {rank <= 3 ? (
                            <span className="text-xl">
                              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                              {rank}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold text-lg ${rank <= 3 ? "" : "text-gray-900 dark:text-white"}`}>
                              {entry.username}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className={`flex items-center space-x-3 text-sm ${rank <= 3 ? "opacity-90" : "text-muted-foreground"}`}>
                            <span className="flex items-center">
                              <Flame className="h-4 w-4 mr-1" />
                              {entry.current_streak} day streak
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${rank <= 3 ? "" : "text-purple-600"}`}>
                          {entry.monthly_points}
                        </div>
                        <div className={`text-xs ${rank <= 3 ? "opacity-75" : "text-muted-foreground"}`}>
                          streak points
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
                  No Rankings Yet
                </h3>
                <p className="text-muted-foreground">
                  Be the first to earn streak points this month!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
