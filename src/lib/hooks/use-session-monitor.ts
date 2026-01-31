import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { supabase } from '@/lib/supabase';

export type SessionStatus = 'active' | 'warning' | 'terminated';

interface SessionState {
  status: SessionStatus;
  message?: string;
  reason?: string;
}

export function useSessionMonitor() {
  const { sessionId, isAuthenticated } = useAuthStore();
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'active' });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      setSessionState({ status: 'active' });
      return;
    }

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.rpc('heartbeat_session', {
            p_session_id: sessionId
        });

        if (error) {
            console.error('Heartbeat error:', error);
            // If RPC fails (e.g. 401), session might be invalid.
            // But usually RPC errors are about logic or connection.
            // We won't force logout on network error.
            return;
        }

        if (data) {
            const result = data as { status: string; reason?: string; message?: string }; // Type assertion for JSONB response
            
            if (result.status === 'terminated') {
                setSessionState({ 
                    status: 'terminated', 
                    reason: result.reason 
                });
                
                // Clear interval
                if (intervalRef.current) clearInterval(intervalRef.current);
                
                // We will let the UI handle the actual logout action (showing modal then logout)
                // Or we can logout immediately. 
                // Plan: Set state, UI shows modal "You have been logged out...", user clicks OK -> store.logout()
                // OR: store.logout() happens but we keep the modal visible?
                // Better: The UI component monitoring this state will trigger the logout flow.
            } else if (result.status === 'warning') {
                setSessionState({ 
                    status: 'warning', 
                    message: result.message 
                });
            } else {
                setSessionState({ status: 'active' });
            }
        }
      } catch (e) {
        console.error('Heartbeat exception:', e);
      }
    };

    // Initial check
    checkSession();

    // Poll every 60 seconds
    intervalRef.current = setInterval(checkSession, 60000);

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, sessionId]);

  return sessionState;
}
