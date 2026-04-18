import { getConvexHttpClient } from "./convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuizQuestion } from "./quiz-loader";

interface WeightedQuestion extends QuizQuestion {
  weight: number;
  tags: string[];
}

export async function getWeightedQuestions(
  quizId: string,
  _userId: string,
  limit: number = 10
): Promise<QuizQuestion[]> {
  try {
    const client = getConvexHttpClient();

    const [questions, mistakes, confidence] = await Promise.all([
      client.query(api.content.getQuizQuestions, { quizId: quizId as Id<"attached_quizzes"> }),
      client.query(api.mistakes.getMistakes, {}),
      client.query(api.quiz.getConfidenceData, {}),
    ]);

    if (!questions.length) return [];

    const mistakesMap = new Set(
      mistakes.filter((m) => !m.is_mastered).map((m) => m.questionId)
    );
    const confidenceMap = new Set(
      confidence
        .filter((c) => ["guess", "fluke", "50/50"].includes(c.confidence_level ?? ""))
        .map((c) => c.questionId)
    );

    const weighted: WeightedQuestion[] = questions.map((q) => {
      let weight = 0;
      const tags: string[] = [];

      if (mistakesMap.has(q._id)) { weight += 50; tags.push("mistake"); }
      if (confidenceMap.has(q._id)) { weight += 30; tags.push("low_confidence"); }
      weight += Math.random() * 10;

      let parsedOptions = q.options;
      if (typeof parsedOptions === "string") {
        try { parsedOptions = JSON.parse(parsedOptions); } catch { parsedOptions = []; }
      }

      return {
        id: q._id,
        question_text: q.question_text,
        options: parsedOptions as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? "",
        question_type: "single_choice" as const,
        order_index: q.order_index ?? 0,
        weight,
        tags,
      };
    });

    weighted.sort((a, b) => b.weight - a.weight);
    return weighted.slice(0, limit);
  } catch {
    return [];
  }
}
