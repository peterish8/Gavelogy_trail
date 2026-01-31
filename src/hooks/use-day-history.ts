import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';

export type CompletedQuizAttempt = {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  quiz: {
    title: string;
  }
};

export function useDayHistory(date: Date) {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<CompletedQuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 0. OPTIMISTIC LOADING: Try to load from cache using LAST KNOWN user if current user is loading
    // This bridges the 1-2s gap while useAuthStore initializes
    const effectiveUserId = user?.id || localStorage.getItem('gavalogy-last-user-id');
    
    // Fix: Use local date string for cache key instead of toISOString (which shifts day)
    const yKey = date.getFullYear();
    const mKey = String(date.getMonth() + 1).padStart(2, '0');
    const dKey = String(date.getDate()).padStart(2, '0');
    const dateKey = `${yKey}-${mKey}-${dKey}`;
    
    const cacheKey = `day_history_${effectiveUserId}_${dateKey}`;
    
    // Attempt cache load immediately
    const cached = localStorage.getItem(cacheKey);
    if (cached && history.length === 0) {
        try {
            setHistory(JSON.parse(cached));
        } catch { console.warn("Failed to parse history cache"); }
    }

    if (!effectiveUserId) return; // Can't fetch if we don't know who we are (even historically)

    const fetchHistory = async () => {
      // Only show loading if we didn't hit cache
      if (!cached) setIsLoading(true);

      const start = new Date(date); 
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      // Notes on Timezone:
      // start.toISOString() converts local midnight to UTC.
      // Example: IST Midnight (Jan 21 00:00) -> UTC (Jan 20 18:30).
      // This IS the correct UTC timestamp that opens the day in local time.
      // So no manual offset calculation is needed.

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
            id,
            quiz_id,
            score,
            passed,
            completed_at,
            quiz:attached_quizzes (
                title
            )
        `)
        .eq('user_id', effectiveUserId)
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching day history:', error);
      } else {
        const rawAttempts = data || [];
        const attempts: CompletedQuizAttempt[] = rawAttempts.map((item: {
          id: string;
          quiz_id: string;
          score: number;
          passed: boolean;
          completed_at: string;
          quiz: { title: string } | { title: string }[];
        }) => ({
             ...item,
             quiz: Array.isArray(item.quiz) ? item.quiz[0] : item.quiz
        }));
        
        // Deduplicate: keep latest per quiz_id
        const uniqueAttempts = new Map<string, CompletedQuizAttempt>();
        attempts.forEach(attempt => {
            if (!uniqueAttempts.has(attempt.quiz_id)) {
                uniqueAttempts.set(attempt.quiz_id, attempt);
            }
        });
        
        const result = Array.from(uniqueAttempts.values());
        setHistory(result);
        
        // Update cache & last user pointer
        localStorage.setItem(cacheKey, JSON.stringify(result));
        localStorage.setItem('gavalogy-last-user-id', effectiveUserId);
      }
      setIsLoading(false);
    };

    // Only run fetch if we have a real user (or if we trust the optimistic ID enough to try fetching? 
    // No, fetching requires real RLS auth. So we only fetch if `user` is present. 
    // But we SHOW cache if `effectiveUserId` is present.)
    
    if (user) {
        fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date]);

  return { history, isLoading };
}
