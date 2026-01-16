import { supabase } from './supabase';
import { cache, CACHE_KEYS } from './cache';

// Cached data loader with instant fallback
export class DataLoader {
  
  // Load contemporary cases with caching
  static async loadContemporaryCases(year: string) {
    const cacheKey = CACHE_KEYS.CONTEMPORARY_CASES(year);
    
    // Return cached data immediately if available
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    try {
      const { data, error } = await supabase
        .from('contemprory_case_notes')
        .select('case_number, overall_content')
        .like('case_number', `CS-${year.slice(-2)}-%`)
        .order('case_number');

      if (error) {
        console.warn('Contemporary cases not found for year:', year);
        return { data: [], fromCache: false };
      }

      // Cache for 10 minutes
      cache.set(cacheKey, data || [], 10 * 60 * 1000);
      
      return { data: data || [], fromCache: false };
    } catch (error) {
      console.warn('Error loading contemporary cases:', error);
      return { data: [], fromCache: false };
    }
  }

  // Load case notes with caching
  static async loadCaseNotes(year: string, caseNumber: string) {
    const cacheKey = CACHE_KEYS.CASE_NOTES(year, caseNumber);
    
    // Return cached data immediately
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    try {
      // Handle different case number formats
      let notesCaseNumber = caseNumber;
      
      // For 2025 cases, handle different subject categories
      if (year === '2025') {
        if (caseNumber.startsWith('CQ-25-')) {
          // Convert CQ-25-A-XX to CS-25-A-XX (Constitutional Law)
          // Convert CQ-25-C-XX to CS-25-C-XX (Family Law)
          notesCaseNumber = caseNumber.replace('CQ-25-', 'CS-25-');
        } else if (caseNumber.startsWith('CS-25-') && !caseNumber.includes('-A-') && !caseNumber.includes('-B-') && !caseNumber.includes('-C-')) {
          notesCaseNumber = caseNumber.replace('CS-25-', 'CS-25-A-');
        }
      } else {
        // For other years, convert CQ- to CS-
        notesCaseNumber = caseNumber.replace('CQ-', 'CS-');
      }
      
      const { data, error } = await supabase
        .from('contemprory_case_notes')
        .select('*')
        .eq('case_number', notesCaseNumber)
        .single();

      if (error) {
        console.warn('Case notes not found:', notesCaseNumber);
        // Return placeholder data for missing cases
        const placeholderData = {
          case_number: notesCaseNumber,
          overall_content: `This case will be available soon. We're working on adding comprehensive notes for this case.\n\nPlease check back later for detailed case analysis, key legal principles, and important takeaways.`
        };
        return { data: placeholderData, fromCache: false };
      }

      // Cache for 15 minutes (notes don't change often)
      cache.set(cacheKey, data, 15 * 60 * 1000);
      
      return { data, fromCache: false };
    } catch (error) {
      console.error('Error loading case notes:', error);
      return { data: null, fromCache: false };
    }
  }

  // Load quiz questions with caching
  static async loadQuizQuestions(caseNumber: string) {
    const cacheKey = CACHE_KEYS.QUIZ_QUESTIONS(caseNumber);
    
    // Return cached data immediately
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    try {
      // Handle different case number formats for quiz questions
      let quizCaseNumber = caseNumber;
      
      // Convert CS-25-A-XX to CQ-25-A-XX (Constitutional Law)
      // Convert CS-25-C-XX to CQ-25-C-XX (Family Law)
      // CS-25-B-XX (Criminal Law) has no quizzes
      if (caseNumber.includes('CS-25-C-')) {
        quizCaseNumber = caseNumber.replace('CS-25-C-', 'CQ-25-C-');
      } else {
        quizCaseNumber = caseNumber.replace('CS-', 'CQ-');
      }
      
      const { data, error } = await supabase
        .from('contemporary_case_quizzes')
        .select('*')
        .eq('case_number', quizCaseNumber)
        .order('created_at');

      if (error) {
        console.warn('Quiz questions not found:', quizCaseNumber);
        // Return placeholder quiz data
        const placeholderQuiz = [{
          id: `placeholder-${quizCaseNumber}`,
          case_number: quizCaseNumber,
          case_name: 'Quiz Coming Soon',
          question: 'This quiz is being prepared and will be available soon. Please check back later.',
          option_a: 'Coming Soon',
          option_b: 'Coming Soon', 
          option_c: 'Coming Soon',
          option_d: 'Coming Soon',
          correct_answer: 'A',
          explanation: 'This quiz content is being prepared and will be available soon.'
        }];
        return { data: placeholderQuiz, fromCache: false };
      }

      // Cache for 10 minutes
      cache.set(cacheKey, data, 10 * 60 * 1000);
      
      return { data, fromCache: false };
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      throw error;
    }
  }

  // Preload data for better UX
  static async preloadCaseData(year: string, caseNumber: string) {
    // Preload both notes and quiz questions in parallel
    const promises = [
      this.loadCaseNotes(year, caseNumber).catch(() => null),
      this.loadQuizQuestions(caseNumber).catch(() => null)
    ];

    await Promise.all(promises);
  }

  // Preload all cases for a year
  static async preloadYearCases(year: string) {
    try {
      const { data } = await this.loadContemporaryCases(year);
      
      if (!data || data.length === 0) return;
      
      // Preload first 3 cases for instant access
      const firstThreeCases = data.slice(0, 3);
      
      const preloadPromises = firstThreeCases.map((caseItem: { case_number: string }) => 
        this.preloadCaseData(year, caseItem.case_number).catch(() => null)
      );

      await Promise.all(preloadPromises);
    } catch (error) {
      // Silent fail for preloading
    }
  }
  // Dynamic Course Data Methods
  
  // Get all active courses
  static async getCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  // Get hierarchical structure for a course
  static async getCourseStructure(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('structure_items')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      // Build tree
      const items = data || [];
      const itemMap = new Map();
      const rootItems: any[] = [];

      // First pass: Create map and initialize children
      items.forEach(item => {
        item.children = [];
        itemMap.set(item.id, item);
      });

      // Second pass: Link parents and children
      items.forEach(item => {
        if (item.parent_id) {
          const parent = itemMap.get(item.parent_id);
          if (parent) {
            parent.children.push(item);
          } else {
            // Orphaned item, maybe treat as root or ignore? 
            // Treating as root for safety
            rootItems.push(item);
          }
        } else {
          rootItems.push(item);
        }
      });

      return rootItems;
    } catch (error) {
      console.error('Error fetching course structure:', error);
      return [];
    }
  }

  // Get content for a specific note item
  static async getNoteContent(itemId: string) {
    // Check cache first?
    // For now, fetch direct
    try {
      const { data, error } = await supabase
        .from('note_contents')
        .select('content_html')
        .eq('item_id', itemId)
        .single();
        
      if (error) throw error;
      return data?.content_html || '';
    } catch (error) {
      console.error('Error fetching note content:', error);
      return null;
    }
  }

  // Get user's completed items for a course
  static async getUserCompletedItems(courseId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_completed_items')
        .select('item_id')
        .eq('user_id', user.id);
        // We could filter by course_id if we added it, but item_id is unique enough for now
        
      if (error) throw error;
      return data.map(row => row.item_id); // Return array of item IDs
    } catch (error) {
      console.error('Error fetching completed items:', error);
      return [];
    }
  }

  // Toggle item completion status
  static async toggleItemCompletion(itemId: string, isCompleted: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (isCompleted) {
        // Remove from completed
        const { error } = await supabase
          .from('user_completed_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId);
          
        if (error) throw error;
      } else {
        // Add to completed
        const { error } = await supabase
          .from('user_completed_items')
          .insert({
            user_id: user.id,
            item_id: itemId
          });
          
        if (error) {
          // Ignore unique violation (already completed)
          if (error.code === '23505') return true;
          throw error;
        }
      }
      return true;
    } catch (error: any) {
      console.error('Error toggling completion:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        itemId
      });
      return false;
    }
  }


}