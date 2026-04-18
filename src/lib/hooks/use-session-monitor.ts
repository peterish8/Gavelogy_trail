import { useEffect, useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthStore } from "@/lib/stores/auth";

export type SessionStatus = "active" | "warning" | "terminated";

interface SessionState {
  status: SessionStatus;
  message?: string;
  reason?: string;
}

export function useSessionMonitor() {
  const { isAuthenticated } = useConvexAuth();
  const { sessionId } = useAuthStore();
  const heartbeat = useMutation(api.sessions.heartbeatSession);
  const [sessionState, setSessionState] = useState<SessionState>({
    status: "active",
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      setSessionState({ status: "active" });
      return;
    }

    const checkSession = async () => {
      try {
        const result = await heartbeat({
          sessionId: sessionId as Id<"user_sessions">,
        });
        if (result.status === "terminated") {
          setSessionState({ status: "terminated", reason: result.reason });
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (result.status === "warning") {
          setSessionState({ status: "warning", message: result.reason });
        } else {
          setSessionState({ status: "active" });
        }
      } catch (e) {
        console.error("Heartbeat error:", e);
      }
    };

    checkSession();
    intervalRef.current = setInterval(checkSession, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, sessionId]);

  return sessionState;
}
