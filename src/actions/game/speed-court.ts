'use server';

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function fetchUserCoursesWithFolders(token?: string) {
  const opts = token ? { token } : {};
  try {
    return await fetchQuery(api.content.getUserCoursesWithFolders, {}, opts);
  } catch {
    return [];
  }
}

export async function fetchSpeedCourtQuestions(folderIds: string[], token?: string) {
  const opts = token ? { token } : {};
  try {
    const questions = await fetchQuery(
      api.content.getSpeedCourtQuestions,
      { folderIds },
      opts
    );

    // Shuffle (Fisher-Yates)
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
