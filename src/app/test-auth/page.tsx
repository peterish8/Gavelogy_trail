"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TestAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-bold">Auth Test</h1>
      <p>Authenticated: {isAuthenticated ? "✓ Yes" : "✗ No"}</p>
      {me && (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(me, null, 2)}
        </pre>
      )}
    </div>
  );
}
