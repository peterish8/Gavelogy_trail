import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST() {
  try {
    const uploadUrl = await fetchMutation(api.storage.generateUploadUrl, {});
    return NextResponse.json({ uploadUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
