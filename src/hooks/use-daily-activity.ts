import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';

export type DailyActivity = {
  activity_date: string;
  quizzes_completed: number;
};

export function useDailyActivity(year: number, month: number) {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. EAGER LOAD: Use last known user ID if current user isn't ready
    const effectiveUserId = user?.id || localStorage.getItem('gavalogy-last-user-id');
    const cacheKey = effectiveUserId ? `daily_activity_${effectiveUserId}_${year}_${month}` : null;
    
    const cached = cacheKey ? localStorage.getItem(cacheKey) : null;
    if (cached && activities.length === 0) {
        try {
            setActivities(JSON.parse(cached));
        } catch {
            console.warn("Failed to parse daily activity cache");
        }
    }

    if (!user) return; // Stop here if no actual user to fetch fresh data

    const fetchActivities = async () => {
      // Don't set loading true if we have cache, to avoid flickering
      if (!cached) setIsLoading(true);

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); 
      
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      const { data, error } = await supabase
        .from('daily_activity')
        .select('activity_date, quizzes_completed')
        .eq('user_id', user.id)
        .gte('activity_date', startStr)
        .lte('activity_date', endStr);
      
      if (error) {
        console.error('Error fetching daily activity:', error);
      } else {
        const result = data || [];
        setActivities(result);
        
        // Save to cache & update last user
        if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(result));
        localStorage.setItem('gavalogy-last-user-id', user.id);
      }
      setIsLoading(false);
    };

    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, year, month]);

  return { activities, isLoading };
}
