import { getConvexHttpClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[] | Record<string, string>;
  correct_answer: string;
  explanation: string;
  passage?: string;
  question_type: "single_choice" | "multiple_choice";
  order_index: number;
}

export interface AttachedQuiz {
  id: string;
  title: string;
  passing_score: number;
  note_item_id: string;
  questions: QuizQuestion[];
}

export const QuizLoader = {
  async hasQuiz(noteItemId: string): Promise<boolean> {
    try {
      const client = getConvexHttpClient();
      const quizzes = await client.query(api.content.getAttachedQuizzes, {
        noteItemId: noteItemId as Id<"structure_items">,
      });
      return quizzes.length > 0;
    } catch {
      return false;
    }
  },

  async getQuizForNote(noteItemId: string): Promise<AttachedQuiz | null> {
    try {
      const client = getConvexHttpClient();
      const quizzes = await client.query(api.content.getAttachedQuizzes, {
        noteItemId: noteItemId as Id<"structure_items">,
      });
      if (!quizzes.length) return null;
      const quiz = quizzes[0];

      const questionsData = await client.query(api.content.getQuizQuestions, {
        quizId: quiz._id,
      });

      const questions: QuizQuestion[] = questionsData.map((q) => ({
        id: q._id,
        question_text: q.question_text,
        options: q.options as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? "",
        question_type: "single_choice",
        order_index: q.order_index ?? 0,
      }));

      return {
        id: quiz._id,
        title: quiz.title ?? "Lesson Quiz",
        passing_score: quiz.passing_score ?? 70,
        note_item_id: quiz.noteItemId,
        questions,
      };
    } catch {
      return null;
    }
  },

  async getSpacedRepetitionQuiz(quizId: string): Promise<AttachedQuiz | null> {
    try {
      const client = getConvexHttpClient();

      // Try to get recall questions from API
      const response = await fetch("/api/quiz/get-recall-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      let questionIds: string[] | null = null;

      if (response.ok) {
        const body = await response.json();
        questionIds = body.questionIds ?? null;
      } else if (response.status === 404) {
        // No memory states yet — fall through to standard quiz
      }

      // Get quiz info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quiz: any = await client.query(api.content.getAttachedQuizById, {
        quizId: quizId as Id<"attached_quizzes">,
      }).catch(() => null);

      // Get all questions for this quiz
      const allQuestions = await client.query(api.content.getQuizQuestions, {
        quizId: quizId as Id<"attached_quizzes">,
      });

      if (!allQuestions.length) return null;

      const filtered = questionIds
        ? allQuestions.filter((q) => questionIds!.includes(q._id))
        : allQuestions;

      const questions: QuizQuestion[] = filtered.map((q) => ({
        id: q._id,
        question_text: q.question_text,
        options: q.options as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? "",
        question_type: "single_choice",
        order_index: q.order_index ?? 0,
      }));

      return {
        id: quizId,
        title: quiz?.title ? `${quiz.title} (Spaced Repetition)` : "Spaced Repetition Quiz",
        passing_score: quiz?.passing_score ?? 70,
        note_item_id: quiz?.noteItemId ?? "",
        questions,
      };
    } catch {
      return null;
    }
  },

  async saveQuizAttempt(
    quizId: string,
    _userId: string,
    score: number,
    passed: boolean,
    answers: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>,
    totalQuestions?: number,
    isSpacedRepetition?: boolean,
    subject?: string,
    topic?: string,
    authToken?: string
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/quiz/save-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          quizId,
          score,
          passed,
          answers,
          totalQuestions: totalQuestions || answers.length,
          isSpacedRepetition: isSpacedRepetition || false,
          subject,
          topic,
          localDate: (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          })(),
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async saveMistake(
    _userId: string,
    question: QuizQuestion,
    userAnswer: string,
    subject: string,
    topic?: string
  ): Promise<boolean> {
    try {
      let optionA = "", optionB = "", optionC = "", optionD = "";
      if (Array.isArray(question.options)) {
        const opts = question.options as Array<{ letter?: string; text?: string }>;
        optionA = opts.find((o) => o.letter === "A")?.text ?? opts[0]?.text ?? "";
        optionB = opts.find((o) => o.letter === "B")?.text ?? opts[1]?.text ?? "";
        optionC = opts.find((o) => o.letter === "C")?.text ?? opts[2]?.text ?? "";
        optionD = opts.find((o) => o.letter === "D")?.text ?? opts[3]?.text ?? "";
      } else if (typeof question.options === "object") {
        const opts = question.options as Record<string, string>;
        optionA = opts["A"] ?? "";
        optionB = opts["B"] ?? "";
        optionC = opts["C"] ?? "";
        optionD = opts["D"] ?? "";
      }
      const response = await fetch("/api/quiz/save-mistake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          explanation: question.explanation,
          subject,
          topic: topic ?? null,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async saveConfidenceRating(params: {
    userId: string;
    quizId: string;
    questionId: string;
    confidenceLevel: "confident" | "50/50" | "fluke";
    wasCorrect: boolean;
  }): Promise<boolean> {
    try {
      const response = await fetch("/api/quiz/save-confidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
