// Singleton Convex clients for use outside of React (Zustand stores, server actions)
import { ConvexHttpClient } from "convex/browser";

let _httpClient: ConvexHttpClient | null = null;

// Returns the authenticated React client created in ConvexClientProvider.
// This is the SAME instance ConvexAuthProvider sets the JWT on, so queries
// made through it carry the user's auth token.
export function getConvexClient() {
  if (typeof window === "undefined") {
    throw new Error("getConvexClient() can only be called in a browser context");
  }
  // Lazy import to avoid circular deps at module init time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { convex } = require("@/components/convex-provider");
  return convex;
}

// For unauthenticated queries/mutations (server actions, public endpoints)
export function getConvexHttpClient(): ConvexHttpClient {
  if (!_httpClient) {
    _httpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return _httpClient;
}
