import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question_id, subject, source_type, source_id } = body;

    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fetchMutation(
      api.mistakes.upsertMistake,
      {
        questionId: question_id,
        subjectId: subject,
        source_type: (source_type ?? "quiz") as "quiz" | "mock",
        source_id: source_id ?? "",
      },
      { token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
