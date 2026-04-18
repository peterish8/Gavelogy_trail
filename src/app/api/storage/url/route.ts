import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(req: NextRequest) {
  const storageId = req.nextUrl.searchParams.get("storageId");
  if (!storageId) {
    return NextResponse.json({ error: "Missing storageId" }, { status: 400 });
  }
  try {
    const url = await fetchQuery(api.storage.getUrl, { storageId });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get URL" },
      { status: 500 }
    );
  }
}
