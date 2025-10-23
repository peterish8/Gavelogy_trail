"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubjectsPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const { getMistakesByTopic } = useMistakeStore();

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(["jurisprudence"])
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  // Mapping from topic names to quiz IDs
  const topicToQuizId: Record<string, string> = {
    "Introduction to Jurisprudence": "550e8400-e29b-41d4-a716-446655440206",
    "Sources of Law": "550e8400-e29b-41d4-a716-446655440207",
    "Schools of Jurisprudence": "550e8400-e29b-41d4-a716-446655440209",
    "General Principles": "550e8400-e29b-41d4-a716-446655440206", // Using Introduction quiz for General Principles
  };

  const startQuiz = (topicName: string) => {
    const quizId = topicToQuizId[topicName];
    if (quizId) {
      router.push(`/quiz?quizId=${encodeURIComponent(quizId)}`);
    } else {
      console.error(`No quiz ID found for topic: ${topicName}`);
    }
  };

  const startReviewQuiz = (topicName: string) => {
    const quizId = topicToQuizId[topicName];
    if (quizId) {
      router.push(`/quiz?quizId=${encodeURIComponent(quizId)}&review=true`);
    } else {
      console.error(`No quiz ID found for topic: ${topicName}`);
    }
  };

  const getTopicState = (topicName: string) => {
    const mistakes = getMistakesByTopic("Jurisprudence", topicName);
    const activeMistakes = mistakes.filter((m) => !m.isCleared);

    if (activeMistakes.length === 0 && mistakes.length > 0) return "completed";
    if (activeMistakes.length > 0) return "needs-review";
    return "not-started";
  };

  // Mock data for all subjects with subtopics
  const subjectsData = {
    "constitutional-law": {
      title: "Constitutional Law",
      progress: 33,
      timeSpent: "0h 00m",
      subtopics: [
        "General Principles",
        "Specific Rights",
        "Right to Equality",
        "Right to Freedom",
        "Right Against Exploitation",
        "Right to Freedom of Religion",
        "Cultural and Educational Rights",
        "Right to Constitutional Remedies",
      ],
    },
    "criminal-law": {
      title: "Criminal Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Indian Penal Code (IPC)",
        "Code of Criminal Procedure (CrPC)",
        "Indian Evidence Act",
        "Offenses Against Person",
        "Property Offenses",
        "Arrest Procedures",
        "Bail Provisions",
        "Trial Procedures",
      ],
    },
    "contract-law": {
      title: "Contract Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Contract Formation",
        "Offer and Acceptance",
        "Consideration",
        "Capacity to Contract",
        "Free Consent",
        "Legality of Object",
        "Performance of Contract",
        "Breach of Contract",
      ],
    },
    torts: {
      title: "Law of Torts",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Tort Basics",
        "Negligence",
        "Defamation",
        "Nuisance",
        "Trespass",
        "Strict Liability",
        "Vicarious Liability",
        "Remedies",
      ],
    },
    "administrative-law": {
      title: "Administrative Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Administrative Process",
        "Judicial Review",
        "Administrative Tribunals",
        "Delegated Legislation",
        "Administrative Discretion",
        "Natural Justice",
        "Public Interest Litigation",
        "Administrative Accountability",
      ],
    },
    jurisprudence: {
      title: "Jurisprudence",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Introduction to Jurisprudence",
        "Sources of Law",
        "Schools of Jurisprudence",
      ],
    },
    "family-law": {
      title: "Family Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Hindu Law",
        "Muslim Law",
        "Christian Law",
        "Marriage and Divorce",
        "Succession and Inheritance",
        "Adoption",
        "Maintenance",
        "Guardianship",
      ],
    },
    "property-law": {
      title: "Property Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Transfer of Property",
        "Sale and Gift",
        "Mortgage",
        "Lease",
        "Easements",
        "Trusts",
        "Succession",
        "Partition",
      ],
    },
    "labour-law": {
      title: "Labour Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Industrial Disputes",
        "Strikes and Lockouts",
        "Trade Unions",
        "Minimum Wages",
        "Workmen's Compensation",
        "Factories Act",
        "Industrial Employment",
        "Social Security",
      ],
    },
    "environmental-law": {
      title: "Environmental Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Environment Protection",
        "Pollution Control",
        "Forest Conservation",
        "Wildlife Protection",
        "Water Resources",
        "Air Quality",
        "Environmental Impact Assessment",
        "Climate Change",
      ],
    },
    "cyber-law": {
      title: "Cyber Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Information Technology Act",
        "Cyber Crimes",
        "Digital Signatures",
        "Data Protection",
        "E-Commerce",
        "Cyber Security",
        "Electronic Evidence",
        "Online Disputes",
      ],
    },
    "intellectual-property": {
      title: "Intellectual Property Law",
      progress: 0,
      timeSpent: "0h 00m",
      subtopics: [
        "Copyright and Patent",
        "Copyright Law",
        "Patent Law",
        "Trademark Law",
        "Design Law",
        "Geographical Indications",
        "Trade Secrets",
        "IP Enforcement",
      ],
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading subjects...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CLAT PG Subjects</h1>
          <p className="text-muted-foreground">
            Master all 13 law subjects with our hierarchical quiz system.
            Complete quizzes to unlock progress tracking and intelligent mistake
            analysis.
          </p>
        </div>

        {/* Filter and Summary Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">
              Filter
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                All (9)
              </button>
              <button className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full border">
                Due (8)
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-right">
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-lg font-bold">26.11%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
              <div className="text-lg font-bold">4h 20m</div>
            </div>
          </div>
        </div>

        {/* Main Subject Cards */}
        <div className="space-y-6">
          {Object.entries(subjectsData).map(([subjectId, subjectData]) => {
            const isExpanded = expandedSubjects.has(subjectId);
            const progressDashArray =
              subjectData.progress > 0
                ? `${subjectData.progress}, 100`
                : "0, 100";

            return (
              <Card key={subjectId} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {/* Left: Circular Progress */}
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-muted"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-orange-500"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={progressDashArray}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {subjectData.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Center: Title and Details */}
                    <div className="flex-1 px-4">
                      <h2 className="text-xl font-bold">{subjectData.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {subjectData.timeSpent}
                      </p>
                      <button
                        onClick={() => toggleSubject(subjectId)}
                        className="flex items-center mt-1 hover:text-primary transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">
                          {isExpanded ? "Hide Details" : "Show Details"}
                        </span>
                        <svg
                          className={`w-4 h-4 ml-1 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Right: Play Button */}
                    <Button
                      size="lg"
                      className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full p-0"
                    >
                      <svg
                        className="w-6 h-6 ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </div>

                  {/* Subtopic List - Only show when expanded */}
                  {isExpanded && (
                    <div className="space-y-3">
                      {subjectData.subtopics.map((subtopic, index) => {
                        const state = getTopicState(subtopic);
                        const mistakes = getMistakesByTopic(
                          "Jurisprudence",
                          subtopic
                        );
                        const activeMistakes = mistakes.filter(
                          (m) => !m.isCleared
                        );
                        const progress =
                          mistakes.length > 0
                            ? ((mistakes.length - activeMistakes.length) /
                                mistakes.length) *
                              100
                            : 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center flex-1">
                              <span className="text-sm">{subtopic}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Progress Bar */}
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {Math.round(progress)}%
                              </span>

                              {/* State-based buttons */}
                              {state === "completed" ? (
                                // Completed state - show checkmark
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : state === "needs-review" ? (
                                // Needs review state - show quiz button for wrong questions
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-6 h-6 border-2 border-orange-500 rounded-full p-0 hover:bg-orange-50"
                                  onClick={() => startReviewQuiz(subtopic)}
                                >
                                  <svg
                                    className="w-3 h-3 text-orange-500 ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </Button>
                              ) : (
                                // Not started state - show play button
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-6 h-6 border-2 border-orange-500 rounded-full p-0 hover:bg-orange-50"
                                  onClick={() => startQuiz(subtopic)}
                                >
                                  <svg
                                    className="w-3 h-3 text-orange-500 ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add New Topic Button */}
                      <div className="mt-6 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center py-3"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            Add New Topic
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
