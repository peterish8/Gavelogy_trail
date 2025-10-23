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
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Target,
  BookOpen,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";

interface Mistake {
  id: string;
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  confidence: "confident" | "guess" | "fluke";
  subject: string;
  quiz_title: string;
  created_at: string;
  time_spent: number;
  explanation: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  retake_count: number;
  mastered: boolean;
}

interface MistakeStats {
  total_mistakes: number;
  confident_mistakes: number;
  guess_mistakes: number;
  fluke_mistakes: number;
  mastered_count: number;
  avg_time_per_mistake: number;
  most_difficult_subject: string;
  improvement_rate: number;
}

export default function MistakesPage() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [stats, setStats] = useState<MistakeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "confident" | "guess" | "fluke" | "mastered"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);

  // Demo data for development
  const loadMistakes = async () => {
    try {
      // Demo mode - use mock data
      if (process.env.NODE_ENV === "development") {
        const mockMistakes: Mistake[] = [
          {
            id: "1",
            question_id: "q1",
            question_text:
              "Which Article of the Indian Constitution deals with the Right to Equality?",
            user_answer: "B",
            correct_answer: "A",
            confidence: "confident",
            subject: "Constitutional Law",
            quiz_title: "Fundamental Rights - Part 1",
            created_at: "2024-01-15T10:30:00Z",
            time_spent: 45,
            explanation:
              "Article 14 guarantees equality before law and equal protection of laws to all persons within the territory of India.",
            option_a: "Article 14",
            option_b: "Article 19",
            option_c: "Article 21",
            option_d: "Article 32",
            retake_count: 0,
            mastered: false,
          },
          {
            id: "2",
            question_id: "q2",
            question_text:
              "What is the maximum punishment for murder under Section 302 of IPC?",
            user_answer: "A",
            correct_answer: "C",
            confidence: "guess",
            subject: "Criminal Law",
            quiz_title: "IPC Basics",
            created_at: "2024-01-14T15:20:00Z",
            time_spent: 30,
            explanation:
              "Section 302 IPC provides that whoever commits murder shall be punished with death, or imprisonment for life.",
            option_a: "Life imprisonment",
            option_b: "Death penalty",
            option_c: "Either death penalty or life imprisonment",
            option_d: "10 years imprisonment",
            retake_count: 1,
            mastered: false,
          },
          {
            id: "3",
            question_id: "q3",
            question_text: "In contract law, what is consideration?",
            user_answer: "D",
            correct_answer: "A",
            confidence: "fluke",
            subject: "Contract Law",
            quiz_title: "Contract Formation",
            created_at: "2024-01-13T09:15:00Z",
            time_spent: 20,
            explanation:
              "Consideration is something of value that is exchanged between parties to a contract, making the contract legally binding.",
            option_a: "Something of value exchanged between parties",
            option_b: "The intention to create legal relations",
            option_c: "The capacity to contract",
            option_d: "The offer and acceptance",
            retake_count: 2,
            mastered: true,
          },
        ];

        const mockStats: MistakeStats = {
          total_mistakes: 3,
          confident_mistakes: 1,
          guess_mistakes: 1,
          fluke_mistakes: 1,
          mastered_count: 1,
          avg_time_per_mistake: 32,
          most_difficult_subject: "Constitutional Law",
          improvement_rate: 33,
        };

        setMistakes(mockMistakes);
        setStats(mockStats);
        setLoading(false);
        return;
      }

      // TODO: Implement actual Supabase fetch
      // const { data, error } = await supabase
      //   .from('mistakes')
      //   .select('*')
      //   .order('created_at', { ascending: false });
    } catch (error) {
      console.error("Error loading mistakes:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const filteredMistakes = mistakes.filter((mistake) => {
    const matchesFilter =
      filter === "all" ||
      mistake.confidence === filter ||
      (filter === "mastered" && mistake.mastered);
    const matchesSearch =
      mistake.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mistake.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case "confident":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "guess":
        return <Target className="h-4 w-4 text-yellow-600" />;
      case "fluke":
        return <RefreshCw className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case "confident":
        return "Confident Mistake";
      case "guess":
        return "Educated Guess";
      case "fluke":
        return "Random Guess";
      default:
        return "Unknown";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "confident":
        return "bg-green-50 border-green-200 text-green-800";
      case "guess":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "fluke":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const retakeQuestion = (mistake: Mistake) => {
    // Navigate to quiz with specific question
    router.push(`/quiz/retake/${mistake.question_id}`);
  };

  const markAsMastered = (mistakeId: string) => {
    setMistakes((prev) =>
      prev.map((mistake) =>
        mistake.id === mistakeId
          ? { ...mistake, mastered: !mistake.mastered }
          : mistake
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mistake Tracking</h1>
            <p className="text-muted-foreground mt-2">
              Review and learn from your mistakes with intelligent tracking
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/subjects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Mistakes
                    </p>
                    <p className="text-2xl font-bold">{stats.total_mistakes}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Mastered
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.mastered_count}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg Time
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.avg_time_per_mistake}s
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Improvement
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.improvement_rate}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search mistakes by question or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {["all", "confident", "guess", "fluke", "mastered"].map(
                  (filterType) => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(filterType as "all" | "confident" | "guess" | "fluke" | "mastered")}
                      className="capitalize"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {filterType}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mistakes List */}
        <div className="space-y-4">
          {filteredMistakes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Mistakes Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Great job! You haven't made any mistakes yet. Keep practicing to build your mistake tracking data."}
                </p>
                <Button onClick={() => router.push("/subjects")}>
                  Start Practicing
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredMistakes.map((mistake) => (
              <Card
                key={mistake.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(
                            mistake.confidence
                          )}`}
                        >
                          {getConfidenceIcon(mistake.confidence)}
                          <span className="ml-1">
                            {getConfidenceText(mistake.confidence)}
                          </span>
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {mistake.subject}
                        </span>
                        {mistake.mastered && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Mastered
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold mb-2">
                        {mistake.question_text}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Your Answer:
                          </p>
                          <p
                            className={`font-medium ${
                              mistake.user_answer === mistake.correct_answer
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {mistake.user_answer}.{" "}
                            {
                              mistake[
                                `option_${mistake.user_answer.toLowerCase()}` as keyof Mistake
                              ]
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Correct Answer:
                          </p>
                          <p className="font-medium text-green-600">
                            {mistake.correct_answer}.{" "}
                            {
                              mistake[
                                `option_${mistake.correct_answer.toLowerCase()}` as keyof Mistake
                              ]
                            }
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm">{mistake.explanation}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Quiz: {mistake.quiz_title}</span>
                        <span>Time: {mistake.time_spent}s</span>
                        <span>Retakes: {mistake.retake_count}</span>
                        <span>
                          {new Date(mistake.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => retakeQuestion(mistake)}
                        disabled={mistake.mastered}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsMastered(mistake.id)}
                      >
                        {mistake.mastered ? "Unmark" : "Mark as Mastered"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Insight Card */}
        {stats && stats.total_mistakes > 0 && (
          <Card className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200">
                🧠 Intelligent Mistake Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-700 dark:text-orange-300">
                  Based on your mistake patterns, here are some insights:
                </p>
                <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                  <li>
                    • <strong>Most Difficult Subject:</strong>{" "}
                    {stats.most_difficult_subject}
                  </li>
                  <li>
                    • <strong>Confident Mistakes:</strong>{" "}
                    {stats.confident_mistakes} - These need immediate attention
                  </li>
                  <li>
                    • <strong>Guess Mistakes:</strong> {stats.guess_mistakes} -
                    Focus on understanding concepts
                  </li>
                  <li>
                    • <strong>Fluke Mistakes:</strong> {stats.fluke_mistakes} -
                    Review basic knowledge
                  </li>
                  <li>
                    • <strong>Mastery Rate:</strong>{" "}
                    {Math.round(
                      (stats.mastered_count / stats.total_mistakes) * 100
                    )}
                    %
                  </li>
                </ul>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Recommendation:</strong> Focus on retaking confident
                    mistakes first, as these indicate overconfidence in
                    incorrect knowledge.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
