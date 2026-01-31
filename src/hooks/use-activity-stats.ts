import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';

export type ActivityData = {
  date: string;
  count: number;
  label: string; // "Jan 21"
};

export function useActivityStats(days: number) {
  const { user } = useAuthStore();
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setIsLoading(true);
      const endDate = new Date();
      // Set end date to end of today
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      // Set start date to X days ago
      startDate.setDate(endDate.getDate() - days + 1); // +1 so if days=7, we include today and going back 6 days
      startDate.setHours(0, 0, 0, 0);

      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (error) {
        console.error('Error fetching activity stats:', error);
      } else {
        // Group by day
        const counts: Record<string, number> = {};
        attempts?.forEach((a) => {
           if (!a.completed_at) return;
           const d = new Date(a.completed_at);
           // Use local date string YYYY-MM-DD
           const year = d.getFullYear();
           const month = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           const key = `${year}-${month}-${day}`;
           counts[key] = (counts[key] || 0) + 1;
        });

        // Fill gaps and format
        const result: ActivityData[] = [];
        for (let i = 0; i < days; i++) {
           const d = new Date(startDate);
           d.setDate(d.getDate() + i);
           
           const year = d.getFullYear();
           const month = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           const key = `${year}-${month}-${day}`;
           
           // Format label e.g., "Jan 21"
           const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

           result.push({
             date: key,
             count: counts[key] || 0,
             label
           });
        }
        setData(result);
        setTotalAttempts(attempts?.length || 0);
      }
      setIsLoading(false);
    };

    fetchStats();
  }, [user, days]);

  return { data, isLoading, totalAttempts };
}
