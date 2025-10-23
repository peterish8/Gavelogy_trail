"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Crown,
  Clock,
  Play,
  Pause,
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  time_limit?: number; // Time limit in seconds for this question
}

interface QuizSettings {
  countdownDuration: number; // Countdown before quiz starts (3-2-1)
  defaultTimeLimit: number; // Default time per question in seconds
  showTimer: boolean; // Whether to show timer
  autoSubmit: boolean; // Auto-submit when time runs out
}

export default function QuizPage({ params }: { params: { quizId: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    Record<
      number,
      { selected: string; confidence: "confident" | "guess" | "fluke" }
    >
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Quiz state
  const [quizState, setQuizState] = useState<
    "preparing" | "countdown" | "active" | "paused" | "completed"
  >("preparing");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);

  // Quiz settings
  const [settings, setSettings] = useState<QuizSettings>({
    countdownDuration: 3,
    defaultTimeLimit: 60, // 1 minute per question
    showTimer: true,
    autoSubmit: true,
  });

  // Demo questions with time limits
  const questions: Question[] = [
    {
      id: "1",
      question_text:
        "Which Article of the Indian Constitution deals with the Right to Equality?",
      option_a: "Article 14",
      option_b: "Article 19",
      option_c: "Article 21",
      option_d: "Article 32",
      correct_answer: "A",
      explanation:
        "Article 14 guarantees equality before law and equal protection of laws to all persons within the territory of India.",
      time_limit: 45,
    },
    {
      id: "2",
      question_text:
        "What is the maximum punishment for murder under Section 302 of IPC?",
      option_a: "Life imprisonment",
      option_b: "Death penalty",
      option_c: "Either death penalty or life imprisonment",
      option_d: "10 years imprisonment",
      correct_answer: "C",
      explanation:
        "Section 302 IPC provides that whoever commits murder shall be punished with death, or imprisonment for life.",
      time_limit: 60,
    },
    {
      id: "3",
      question_text: "In contract law, what is consideration?",
      option_a: "Something of value exchanged between parties",
      option_b: "The intention to create legal relations",
      option_c: "The capacity to contract",
      option_d: "The offer and acceptance",
      correct_answer: "A",
      explanation:
        "Consideration is something of value that is exchanged between parties to a contract, making the contract legally binding.",
      time_limit: 50,
    },
  ];

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (quizState === "countdown") {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setQuizState("active");
            startQuestionTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (quizState === "active" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizState, timeLeft]);

  // Start quiz countdown
  const startQuiz = () => {
    setQuizState("countdown");
    setCountdown(settings.countdownDuration);
  };

  // Start question timer
  const startQuestionTimer = () => {
    const currentQ = questions[currentQuestion];
    const timeLimit = currentQ.time_limit || settings.defaultTimeLimit;
    setTimeLeft(timeLimit);
    setQuestionStartTime(Date.now());
  };

  // Handle time up
  const handleTimeUp = () => {
    if (settings.autoSubmit) {
      // Auto-submit current question if no answer selected
      if (!answers[currentQuestion]?.selected) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion]: {
            selected: "",
            confidence: "fluke",
          },
        }));
      }
      handleNext();
    } else {
      // Just pause the quiz
      setQuizState("paused");
    }
  };

  // Pause/Resume quiz
  const togglePause = () => {
    if (quizState === "active") {
      setQuizState("paused");
    } else if (quizState === "paused") {
      setQuizState("active");
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        selected: answer,
      },
    }));
  };

  const handleConfidenceSelect = (
    confidence: "confident" | "guess" | "fluke"
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        confidence,
      },
    }));
  };

  const handleNext = () => {
    // Record time used for current question
    if (questionStartTime > 0) {
      const timeUsed = Math.floor((Date.now() - questionStartTime) / 1000);
      setTotalTimeUsed((prev) => prev + timeUsed);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      if (quizState === "active") {
        startQuestionTimer();
      }
    } else {
      // Calculate score
      let correct = 0;
      questions.forEach((q, index) => {
        if (answers[index]?.selected === q.correct_answer) {
          correct++;
        }
      });
      setScore(correct);
      setQuizState("completed");
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      if (quizState === "active") {
        startQuestionTimer();
      }
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    const currentQ = questions[currentQuestion];
    const timeLimit = currentQ.time_limit || settings.defaultTimeLimit;
    const percentage = (timeLeft / timeLimit) * 100;

    if (percentage <= 20) return "text-red-500";
    if (percentage <= 40) return "text-orange-500";
    return "text-green-500";
  };

  const currentAnswer = answers[currentQuestion];
  const currentQ = questions[currentQuestion];

  // Quiz preparation screen
  if (quizState === "preparing") {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Quiz Preparation</CardTitle>
              <CardDescription>
                Configure your quiz settings before starting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quiz Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Timer Settings</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Countdown Duration (seconds)
                    </label>
                    <select
                      value={settings.countdownDuration}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          countdownDuration: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value={3}>3 seconds</option>
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Default Time per Question (seconds)
                    </label>
                    <select
                      value={settings.defaultTimeLimit}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          defaultTimeLimit: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={45}>45 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={90}>1.5 minutes</option>
                      <option value={120}>2 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quiz Options</h3>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showTimer"
                      checked={settings.showTimer}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          showTimer: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <label htmlFor="showTimer" className="text-sm">
                      Show timer during quiz
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoSubmit"
                      checked={settings.autoSubmit}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoSubmit: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <label htmlFor="autoSubmit" className="text-sm">
                      Auto-submit when time runs out
                    </label>
                  </div>
                </div>
              </div>

              {/* Quiz Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Quiz Information</h4>
                <ul className="text-sm space-y-1">
                  <li>• Total Questions: {questions.length}</li>
                  <li>
                    • Estimated Time:{" "}
                    {Math.ceil(
                      questions.reduce(
                        (acc, q) =>
                          acc + (q.time_limit || settings.defaultTimeLimit),
                        0
                      ) / 60
                    )}{" "}
                    minutes
                  </li>
                  <li>• Question Types: Multiple Choice</li>
                  <li>• Confidence Tracking: Enabled</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={startQuiz} className="px-8">
                  <Play className="h-5 w-5 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Countdown screen
  if (quizState === "countdown") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold text-primary mb-4 animate-pulse">
            {countdown}
          </div>
          <h2 className="text-2xl font-semibold mb-2">Get Ready!</h2>
          <p className="text-muted-foreground">
            Quiz starting in {countdown} second{countdown !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Quiz Complete! 🎉</CardTitle>
              <CardDescription>
                You scored {score}/{questions.length} (
                {Math.round((score / questions.length) * 100)}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Summary */}
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">
                  {score}/{questions.length}
                </div>
                <div className="text-lg text-muted-foreground mb-4">
                  {score === questions.length
                    ? "Perfect Score! 🏆"
                    : score >= questions.length * 0.8
                    ? "Excellent! 🌟"
                    : score >= questions.length * 0.6
                    ? "Good Job! 👍"
                    : "Keep Practicing! 💪"}
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-background/50 p-3 rounded">
                    <div className="font-semibold text-muted-foreground">
                      Total Time
                    </div>
                    <div className="text-lg font-bold">
                      {formatTime(totalTimeUsed)}
                    </div>
                  </div>
                  <div className="bg-background/50 p-3 rounded">
                    <div className="font-semibold text-muted-foreground">
                      Avg per Question
                    </div>
                    <div className="text-lg font-bold">
                      {formatTime(Math.round(totalTimeUsed / questions.length))}
                    </div>
                  </div>
                  <div className="bg-background/50 p-3 rounded">
                    <div className="font-semibold text-muted-foreground">
                      Accuracy
                    </div>
                    <div className="text-lg font-bold">
                      {Math.round((score / questions.length) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Mistake Tracking Demo */}
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200">
                    🧠 Intelligent Mistake Tracking Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-700 dark:text-orange-300 mb-4">
                    This is how our intelligent mistake tracking works:
                  </p>
                  <div className="space-y-3">
                    {questions.map((q, index) => {
                      const answer = answers[index];
                      const isCorrect = answer?.selected === q.correct_answer;
                      const confidence = answer?.confidence;

                      return (
                        <div
                          key={q.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium">Question {index + 1}</p>
                            <p className="text-sm text-muted-foreground">
                              {q.question_text}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="text-sm">
                              {confidence === "confident"
                                ? "😊 Confident"
                                : confidence === "guess"
                                ? "🤔 Guess"
                                : "🎲 Fluke"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Key Insight:</strong> Even if you got a question
                      right by guessing, our system will add it to your mistake
                      review until you're confident about it!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">
                    Experience the Full System!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    This was just a demo. Get full access to all quizzes, mock
                    tests, and our intelligent mistake tracking system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={() => router.push("/dashboard")}>
                      <Crown className="h-5 w-5 mr-2" />
                      Purchase Full Access
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push("/subjects")}
                    >
                      Try More Free Quizzes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => router.push("/subjects")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Button>

              <div className="flex items-center space-x-4">
                {/* Timer Display */}
                {settings.showTimer && quizState === "active" && (
                  <div
                    className={`flex items-center space-x-2 ${getTimerColor()}`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg font-bold">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}

                {/* Pause Button */}
                {quizState === "active" || quizState === "paused" ? (
                  <Button variant="outline" size="sm" onClick={togglePause}>
                    {quizState === "active" ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {quizState === "active" ? "Pause" : "Resume"}
                  </Button>
                ) : null}

                <div className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paused State */}
            {quizState === "paused" && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Quiz Paused
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Click Resume to continue, or use the timer settings to adjust
                  your pace.
                </p>
              </div>
            )}

            {/* Question */}
            <div>
              <h2 className="text-xl font-semibold mb-6">
                {currentQ.question_text}
              </h2>

              <div className="space-y-3">
                {[
                  { key: "A", text: currentQ.option_a },
                  { key: "B", text: currentQ.option_b },
                  { key: "C", text: currentQ.option_c },
                  { key: "D", text: currentQ.option_d },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(option.key)}
                    disabled={quizState === "paused"}
                    className={`w-full p-4 text-left border rounded-lg transition-colors ${
                      currentAnswer?.selected === option.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    } ${
                      quizState === "paused"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <span className="font-medium mr-3">{option.key}.</span>
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Selection */}
            {currentAnswer?.selected && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-3">
                  How confident are you about this answer?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleConfidenceSelect("confident")}
                    disabled={quizState === "paused"}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      currentAnswer?.confidence === "confident"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border hover:border-green-300"
                    } ${
                      quizState === "paused"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">😊</div>
                      <div className="font-medium">Confident</div>
                      <div className="text-xs text-muted-foreground">
                        I'm certain this is correct
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleConfidenceSelect("guess")}
                    disabled={quizState === "paused"}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      currentAnswer?.confidence === "guess"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-border hover:border-yellow-300"
                    } ${
                      quizState === "paused"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🤔</div>
                      <div className="font-medium">Educated Guess</div>
                      <div className="text-xs text-muted-foreground">
                        I think this is right
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleConfidenceSelect("fluke")}
                    disabled={quizState === "paused"}
                    className={`flex-1 p-3 border rounded-lg transition-colors ${
                      currentAnswer?.confidence === "fluke"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-border hover:border-red-300"
                    } ${
                      quizState === "paused"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎲</div>
                      <div className="font-medium">Fluke</div>
                      <div className="text-xs text-muted-foreground">
                        I guessed randomly
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || quizState === "paused"}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={
                  !currentAnswer?.selected ||
                  !currentAnswer?.confidence ||
                  quizState === "paused"
                }
              >
                {currentQuestion === questions.length - 1
                  ? "Submit Quiz"
                  : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Time Warning */}
            {settings.showTimer &&
              quizState === "active" &&
              timeLeft <= 10 &&
              timeLeft > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    ⚠️ Only {timeLeft} second{timeLeft !== 1 ? "s" : ""} left!
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
