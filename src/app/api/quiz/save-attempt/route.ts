import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  calculateNextIntervalDays,
  MAX_STAGE_INDEX,
} from "@/lib/spaced-repetition-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      quizId,
      userId,
      score,
      passed,
      answers,
      totalQuestions,
      localDate,
      isSpacedRepetition,
    } = body;

    const completionTime = new Date();
    const dateStr = localDate || completionTime.toISOString().split("T")[0];

    // Convex IDs are passed as strings from the client
    const convexQuizId = quizId as Id<"attached_quizzes">;

    // Get auth token from Authorization header
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const opts = token ? { token } : {};

    // 1. Get prior attempt count for is_initial_attempt flag
    const priorCount = await fetchQuery(
      api.quiz.getAttemptCount,
      { quizId: convexQuizId },
      opts
    );
    const isInitialAttempt = priorCount === 0;

    // 2. Save the attempt
    const attemptAnswers = Array.isArray(answers)
      ? answers.map((a: { questionId: string; selected_answer: string; confidence: string; is_correct: boolean }) => ({
          questionId: a.questionId,
          selected_answer: a.selected_answer,
          confidence: (a.confidence ?? "guess") as "confident" | "guess" | "fluke",
          is_correct: !!a.is_correct,
        }))
      : [];

    await fetchMutation(
      api.quiz.saveAttempt,
      {
        quizId: convexQuizId,
        score: Math.round(score),
        total_questions: totalQuestions || attemptAnswers.length,
        time_taken: 0,
        answers: attemptAnswers,
      },
      opts
    );

    // 3. Increment retake counts on mistakes (non-initial attempts)
    if (!isInitialAttempt && attemptAnswers.length > 0) {
      const questionIds = attemptAnswers.map((a) => a.questionId).filter(Boolean);
      if (questionIds.length > 0) {
        await fetchMutation(
          api.mistakes.incrementRetakeCounts,
          { questionIds },
          opts
        );
      }
    }

    // 4. Handle bucket classification / SR memory state updates
    if (isSpacedRepetition) {
      const hasStates = await fetchQuery(
        api.spacedRepetition.hasMemoryStates,
        { quizId: convexQuizId },
        opts
      );

      if (!hasStates && isInitialAttempt) {
        // Initial quiz — classify into buckets using confidence data
        const confidenceData = await fetchQuery(
          api.quiz.getConfidenceData,
          { quizId: convexQuizId },
          opts
        );

        if (confidenceData && confidenceData.length > 0) {
          const results = confidenceData.map((c) => ({
            questionId: c.questionId ?? "",
            is_correct: c.answer_was_correct,
            confidence: c.confidence_level,
          }));
          await fetchMutation(
            api.spacedRepetition.classifyQuestionsAfterQuiz,
            { quizId: convexQuizId, results },
            opts
          );
        }
      } else if (hasStates && !isInitialAttempt) {
        // SR attempt — update memory states per question
        const recentConf = await fetchQuery(
          api.quiz.getConfidenceData,
          { quizId: convexQuizId },
          opts
        );
        if (recentConf) {
          for (const c of recentConf.slice(0, attemptAnswers.length)) {
            await fetchMutation(
              api.spacedRepetition.updateMemoryStateAfterReview,
              {
                quizId: convexQuizId,
                questionId: c.questionId ?? "",
                is_correct: c.answer_was_correct,
                confidence: c.confidence_level,
              },
              opts
            );
          }
        }
      }
    }

    // 5. Update daily activity (first attempt of this quiz today only)
    const todayAttempts = await fetchQuery(
      api.quiz.getDayHistory,
      { date: dateStr },
      opts
    );
    const firstTodayForThisQuiz =
      todayAttempts?.filter((a) => a.quizId === convexQuizId).length === 1;

    if (firstTodayForThisQuiz) {
      await fetchMutation(
        api.analytics.upsertDailyActivity,
        {
          activity_date: dateStr,
          quizzes_completed: 1,
        },
        opts
      );
    }

    // 6. Update spaced repetition schedule
    const existingSchedule = await fetchQuery(
      api.spacedRepetition.getSchedule,
      { quizId: convexQuizId },
      opts
    );

    let nextStageIndex = 0;
    let nextDueAt: string | undefined;
    let status: "active" | "completed" | "archived" = "active";

    if (passed) {
      if (!existingSchedule) {
        const gap = calculateNextIntervalDays(-1);
        if (gap !== null) {
          const d = new Date(completionTime);
          d.setDate(d.getDate() + gap);
          nextDueAt = d.toISOString();
          nextStageIndex = 0;
        }
      } else {
        const currentStage = existingSchedule.current_stage_index;
        if (currentStage >= MAX_STAGE_INDEX) {
          status = "completed";
        } else {
          const gap = calculateNextIntervalDays(currentStage);
          if (gap === null) {
            status = "completed";
          } else {
            nextStageIndex = currentStage + 1;
            const d = new Date(completionTime);
            d.setDate(d.getDate() + gap);
            nextDueAt = d.toISOString();
          }
        }
      }
    } else {
      nextStageIndex = 0;
      const d = new Date(completionTime);
      d.setDate(d.getDate() + 1);
      nextDueAt = d.toISOString();
    }

    await fetchMutation(
      api.spacedRepetition.upsertSchedule,
      {
        quizId: convexQuizId,
        current_stage_index: nextStageIndex,
        next_due_at: nextDueAt,
        last_completed_at: completionTime.toISOString(),
        status,
      },
      opts
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
