import { getConvexHttpClient } from "./convex-client";
import { api } from "@/convex/_generated/api";

export async function isAdmin(): Promise<boolean> {
  try {
    const client = getConvexHttpClient();
    return await client.query(api.admin.isAdmin, {});
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  return isAdmin();
}
