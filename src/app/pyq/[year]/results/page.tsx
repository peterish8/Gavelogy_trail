"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DottedBackground } from "@/components/DottedBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, MinusCircle, Clock, Trophy, RotateCcw, LayoutDashboard } from "lucide-react";

interface PYQQuestion {
  id: number;
  passage_number: number;
  passage?: string;
  question_no: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface PYQResults {
  score: number;
  total: number;
  percentage: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  answers: Record<number, string>;
  questions: PYQQuestion[];
  timestamp: string;
}

export default function PYQResultsPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = React.use(params);
  const router = useRouter();
  const [results, setResults] = useState<PYQResults | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pyq-mock-results");
    if (!stored) {
      router.replace(`/dashboard`);
      return;
    }
    try {
      setResults(JSON.parse(stored));
    } catch {
      router.replace(`/dashboard`);
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DottedBackground />
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { score, total, percentage, correct, incorrect, unanswered, questions, answers } = results;
  const passed = percentage >= 70;

  // CLAT PG marking: +1 correct, -0.25 wrong, 0 unattempted
  const clatScore = correct * 1 + incorrect * -0.25;
  const maxClatScore = total;

  // Section-wise breakdown (by passage_number)
  const passageMap: Record<number, { correct: number; total: number; incorrect: number }> = {};
  for (const q of questions) {
    const p = q.passage_number;
    if (!passageMap[p]) passageMap[p] = { correct: 0, total: 0, incorrect: 0 };
    passageMap[p].total++;
    const ans = answers[q.question_no];
    if (ans === q.correct_answer) passageMap[p].correct++;
    else if (ans) passageMap[p].incorrect++;
  }

  const timeTaken = (() => {
    // We store timestamp of submit; estimate from 3hr - remaining not available here
    // Just show exam date
    return new Date(results.timestamp).toLocaleTimeString();
  })();

  const optionLabel = (q: PYQQuestion, key: string) => {
    switch (key) {
      case "a": return q.option_a;
      case "b": return q.option_b;
      case "c": return q.option_c;
      case "d": return q.option_d;
      default: return key;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DottedBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
            <Trophy className={`h-10 w-10 ${passed ? "text-green-600" : "text-red-500"}`} />
          </div>
          <h1 className="text-3xl font-bold mb-1">
            CLAT PG {year} — Mock Test Results
          </h1>
          <p className={`text-lg font-medium ${passed ? "text-green-600" : "text-red-500"}`}>
            {passed ? "Well done! You passed the threshold." : "Keep practising — you're almost there!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Submitted at {timeTaken}</p>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500 text-center">
            <CardContent className="p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 text-center">
            <CardContent className="p-4">
              <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{incorrect}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-400 text-center">
            <CardContent className="p-4">
              <MinusCircle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-500">{unanswered}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{Math.round(percentage)}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </CardContent>
          </Card>
        </div>

        {/* CLAT Score Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">CLAT PG Scaled Score (+1 / −0.25)</p>
            <p className="text-5xl font-bold text-blue-600 mb-1">
              {clatScore.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">out of {maxClatScore}</p>
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${passed ? "bg-green-500" : "bg-orange-500"}`}
                style={{ width: `${Math.max(0, (clatScore / maxClatScore) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Passage-wise Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Passage-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(passageMap).map(([pNum, pStats]) => {
                const pct = Math.round((pStats.correct / pStats.total) * 100);
                return (
                  <div key={pNum} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Passage {pNum}</span>
                      <span className="text-muted-foreground">
                        {pStats.correct}/{pStats.total} correct ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Answer Review Toggle */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowReview(!showReview)}
            className="w-full"
          >
            {showReview ? "Hide" : "Show"} Answer Review ({total} questions)
          </Button>
        </div>

        {showReview && (
          <div className="space-y-4 mb-8">
            {questions.map((q) => {
              const userAns = answers[q.question_no];
              const isCorrect = userAns === q.correct_answer;
              const isSkipped = !userAns;
              return (
                <Card
                  key={q.question_no}
                  className={`border-l-4 ${isCorrect ? "border-l-green-500" : isSkipped ? "border-l-gray-400" : "border-l-red-500"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      ) : isSkipped ? (
                        <MinusCircle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <p className="text-sm font-medium">
                        Q{q.question_no}. {q.question}
                      </p>
                    </div>
                    {q.passage && (
                      <p className="text-xs text-muted-foreground mb-2 pl-6 italic line-clamp-2">
                        {q.passage}
                      </p>
                    )}
                    <div className="pl-6 space-y-1 text-xs">
                      <p>
                        <span className="font-medium">Your answer: </span>
                        <span className={isCorrect ? "text-green-600" : isSkipped ? "text-gray-500" : "text-red-600"}>
                          {userAns ? `(${userAns.toUpperCase()}) ${optionLabel(q, userAns)}` : "Not answered"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">
                            ({q.correct_answer.toUpperCase()}) {optionLabel(q, q.correct_answer)}
                          </span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => router.push(`/pyq/${year}/mock`)}
          >
            <RotateCcw className="h-4 w-4" />
            Retake Mock
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
