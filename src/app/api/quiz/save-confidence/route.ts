import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quizId, questionId, confidenceLevel, wasCorrect } = body;

    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fetchMutation(
      api.quiz.saveConfidence,
      {
        quizId: quizId as Id<"attached_quizzes">,
        questionId,
        confidence_level: confidenceLevel,
        answer_was_correct: wasCorrect,
        is_initial_attempt: true,
      },
      { token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
