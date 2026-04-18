import { getConvexHttpClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

export async function fetchUserCoursesWithFolders() {
  try {
    const client = getConvexHttpClient();
    return await client.query(api.content.getUserCoursesWithFolders, {});
  } catch {
    return [];
  }
}

export async function fetchSpeedCourtQuestions(folderIds: string[]) {
  if (!folderIds.length) return [];
  try {
    const client = getConvexHttpClient();
    const questions = await client.query(api.content.getSpeedCourtQuestions, { folderIds });
    const arr = [...questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  } catch {
    return [];
  }
}
