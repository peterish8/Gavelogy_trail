import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const body = await request.json();
    const { quizId } = body;

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
    }

    const hasStates = await fetchQuery(
      api.spacedRepetition.hasMemoryStates,
      { quizId: quizId as Id<"attached_quizzes"> },
      { token }
    );

    if (!hasStates) {
      return NextResponse.json(
        {
          error: "No memory states found",
          message: "Complete the initial quiz first to enable spaced repetition",
          requiresInitialQuiz: true,
        },
        { status: 404 }
      );
    }

    // Waterfall bucket selection: prioritise F→E→D→C→B→A
    const memoryStates = await fetchQuery(
      api.spacedRepetition.getMemoryStates,
      { quizId: quizId as Id<"attached_quizzes"> },
      { token }
    );

    const BUCKET_PRIORITY = ["F", "E", "D", "C", "B", "A"] as const;
    const MAX_RECALL = 20;
    const selected: string[] = [];

    for (const bucket of BUCKET_PRIORITY) {
      const inBucket = memoryStates
        .filter((s) => s.bucket === bucket)
        .map((s) => s.questionId);
      for (const id of inBucket) {
        if (selected.length >= MAX_RECALL) break;
        selected.push(id);
      }
      if (selected.length >= MAX_RECALL) break;
    }

    if (selected.length === 0) {
      return NextResponse.json(
        { error: "No questions available for recall" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionIds: selected,
      recallSize: selected.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
