
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from "@/lib/stores/auth";

export interface SpacedRepetitionItem {
  id: string;
  quiz_id: string;
  current_stage_index: number;
  next_due_at: string; // ISO Date
  last_completed_at: string | null;
  status: 'active' | 'completed' | 'archived';
  quiz: {
    title: string;
    id: string; // Ensure we have ID
    course_id: string;
    note_item_id: string;
  };
}

export function useSpacedRepetition() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<SpacedRepetitionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = async () => {
     // 1. EAGER LOAD: Use cached version immediately if available
     const effectiveUserId = user?.id || localStorage.getItem('gavalogy-last-user-id');
     const cacheKey = effectiveUserId ? `srs_schedules_${effectiveUserId}` : null;
     
     if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached && schedules.length === 0) {
            try {
                setSchedules(JSON.parse(cached));
            } catch { /* ignore */ }
        }
        
        // If we have cache, we are not "loading" visually
        if (cached) setIsLoading(false);
     }

    if (!user?.id) return; // Only fetch fresh if we have a real user session
    
    // Don't set loading=true if we already showed cache
    if (!cacheKey || !localStorage.getItem(cacheKey!)) setIsLoading(true);

    try {
      // 1. Fetch Schedule + Basic Quiz Details (Safe Join)
      const { data: srsData, error: srsError } = await supabase
        .from('spaced_repetition_schedules')
        .select(`
          *,
          quiz:attached_quizzes!inner (
            title,
            id,
            note_item_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active') as { data: SpacedRepetitionItem[] | null, error: { message: string } | null };
        
      if (srsError) {
        throw srsError;
      }
      
      const rawItems = srsData || [];
      
      // 2. Resolve Course ID via Note Item -> Structure Item
      const noteItemIds = rawItems.map((item: SpacedRepetitionItem) => {
          const q = Array.isArray(item.quiz) ? item.quiz[0] : item.quiz;
          return q?.note_item_id;
      }).filter(Boolean);

      const noteItemMap: Record<string, string> = {}; // note_item_id -> course_id

      if (noteItemIds.length > 0) {
          const { data: structures, error: structError } = await supabase
            .from('structure_items')
            .select('id, course_id')
            .in('id', noteItemIds);
            
          if (!structError && structures) {
             structures.forEach((s: { id: string; course_id: string }) => {
                 noteItemMap[s.id] = s.course_id;
             });
          }
      }

      // 4. Merge Data
      const formatted = rawItems.map((item: SpacedRepetitionItem) => {
        const quizObj = Array.isArray(item.quiz) ? item.quiz[0] : item.quiz;
        const noteId = quizObj?.note_item_id;
        const courseId = noteItemMap[noteId];

        return {
           ...item,
           quiz: {
             ...quizObj,
             course_id: courseId,
           }
        };
      });

      console.log('Spaced Repetition Data (Safe Fetch):', formatted);
      setSchedules(formatted);
      
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(formatted));
        localStorage.setItem('gavalogy-last-user-id', user.id);
      }

    } catch (err) {
      console.error('Error fetching SR schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user?.id]);

  return { schedules, isLoading, refetch: fetchSchedules };
}
