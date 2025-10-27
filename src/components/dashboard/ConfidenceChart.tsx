"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMistakeStore, ConfidenceStats } from "@/lib/stores/mistakes";

interface ConfidenceChartProps {
  subject?: string;
}

export function ConfidenceChart({ subject }: ConfidenceChartProps) {
  const { confidenceStats, loadConfidenceStats } = useMistakeStore();

  useEffect(() => {
    loadConfidenceStats();
  }, [loadConfidenceStats]);

  const filteredStats = subject 
    ? confidenceStats.filter(stat => stat.subject === subject)
    : confidenceStats;

  const totalStats = filteredStats.reduce((acc, stat) => ({
    total_questions: acc.total_questions + stat.total_questions,
    correct_confident: acc.correct_confident + stat.correct_confident,
    correct_educated_guess: acc.correct_educated_guess + stat.correct_educated_guess,
    correct_fluke: acc.correct_fluke + stat.correct_fluke,
    wrong_confident: acc.wrong_confident + stat.wrong_confident,
    wrong_educated_guess: acc.wrong_educated_guess + stat.wrong_educated_guess,
    wrong_fluke: acc.wrong_fluke + stat.wrong_fluke,
  }), {
    total_questions: 0,
    correct_confident: 0,
    correct_educated_guess: 0,
    correct_fluke: 0,
    wrong_confident: 0,
    wrong_educated_guess: 0,
    wrong_fluke: 0,
  });

  const getPercentage = (value: number) => 
    totalStats.total_questions > 0 
      ? Math.round((value / totalStats.total_questions) * 100) 
      : 0;

  const confidenceData = [
    {
      label: "Confident",
      correct: totalStats.correct_confident,
      wrong: totalStats.wrong_confident,
      color: "bg-blue-500",
      lightColor: "bg-blue-100",
    },
    {
      label: "Educated Guess", 
      correct: totalStats.correct_educated_guess,
      wrong: totalStats.wrong_educated_guess,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-100",
    },
    {
      label: "Fluke",
      correct: totalStats.correct_fluke,
      wrong: totalStats.wrong_fluke,
      color: "bg-orange-500", 
      lightColor: "bg-orange-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          How confident you were in your answers
        </p>
      </CardHeader>
      <CardContent>
        {totalStats.total_questions === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No quiz data available yet.</p>
            <p className="text-sm">Start taking quizzes to see your confidence analysis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {confidenceData.map((item) => {
              const total = item.correct + item.wrong;
              const accuracy = total > 0 ? Math.round((item.correct / total) * 100) : 0;
              const percentage = getPercentage(total);
              
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {percentage}% • {accuracy}% accuracy
                    </div>
                  </div>
                  
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
                    {/* Correct answers */}
                    <div 
                      className={`${item.color} transition-all duration-300`}
                      style={{ 
                        width: `${getPercentage(item.correct)}%` 
                      }}
                    ></div>
                    {/* Wrong answers */}
                    <div 
                      className={`${item.lightColor} transition-all duration-300`}
                      style={{ 
                        width: `${getPercentage(item.wrong)}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>✓ {item.correct} correct</span>
                    <span>✗ {item.wrong} wrong</span>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground text-center">
                Total Questions: {totalStats.total_questions}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}