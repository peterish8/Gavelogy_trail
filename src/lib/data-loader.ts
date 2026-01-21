import { supabase } from './supabase';
import { cache, CACHE_KEYS } from './cache';

// Cached data loader with instant fallback
export class DataLoader {
  
  // Check if we have the Contemporary Cases course ID cached
  private static contemporaryCourseId: string | null = null;

  private static async getContemporaryCourseId() {
    if (this.contemporaryCourseId) return this.contemporaryCourseId;
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id')
        .eq('name', 'Contemporary Cases')
        .single();
        
      if (error || !data) {
        console.warn('Contemporary Cases course not found');
        return null;
      }
      
      this.contemporaryCourseId = data.id;
      return data.id;
    } catch (e) {
      return null;
    }
  }

  // Load contemporary cases with caching
  static async loadContemporaryCases(year: string) {
    const cacheKey = CACHE_KEYS.CONTEMPORARY_CASES(year);
    
    // Return cached data immediately if available
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    try {
      const courseId = await this.getContemporaryCourseId();
      if (!courseId) return { data: [], fromCache: false };

      // Fetch structure items (cases) for this year
      // Assuming case titles start with CS-{YY}- or similar pattern matching the year
      const yearPattern = `CS-${year.slice(-2)}-%`;
      
      const { data: items, error } = await supabase
        .from('structure_items')
        .select(`
          id,
          title,
          note_contents (
            content_html
          )
        `)
        .eq('course_id', courseId)
        .ilike('title', yearPattern)
        .order('title');

      if (error) {
        console.warn('Contemporary cases not found for year:', year);
        return { data: [], fromCache: false };
      }

      // Map to legacy format
      const mappedData = items.map((item) => ({
        case_number: item.title,
        overall_content: item.note_contents?.[0]?.content_html || ''
      }));

      // Cache for 10 minutes
      cache.set(cacheKey, mappedData || [], 10 * 60 * 1000);
      
      return { data: mappedData || [], fromCache: false };
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
      
      const courseId = await this.getContemporaryCourseId();
      if (!courseId) return { data: null, fromCache: false };

      // Find the structure item
      const { data: item, error: itemError } = await supabase
        .from('structure_items')
        .select('id, title')
        .eq('course_id', courseId)
        .eq('title', notesCaseNumber)
        .single();
        
      if (itemError || !item) {
        console.warn('Case notes item not found:', notesCaseNumber);
        // Return placeholder data for missing cases
        const placeholderData = {
          case_number: notesCaseNumber,
          overall_content: `This case will be available soon. We're working on adding comprehensive notes for this case.\n\nPlease check back later for detailed case analysis, key legal principles, and important takeaways.`
        };
        return { data: placeholderData, fromCache: false };
      }

      // Fetch content
      const { data: content, error: contentError } = await supabase
        .from('note_contents')
        .select('content_html')
        .eq('item_id', item.id)
        .single();

      if (contentError) {
         // It's possible item exists but content doesn't
         const placeholderData = {
          case_number: notesCaseNumber,
          overall_content: `This case will be available soon. We're working on adding comprehensive notes for this case.\n\nPlease check back later for detailed case analysis, key legal principles, and important takeaways.`
        };
        return { data: placeholderData, fromCache: false };
      }

      const resultData = {
        case_number: notesCaseNumber,
        overall_content: content.content_html
      };

      // Cache for 15 minutes (notes don't change often)
      cache.set(cacheKey, resultData, 15 * 60 * 1000);
      
      return { data: resultData, fromCache: false };
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

      // We need to find the structure item first, but quiz numbering (CQ) might differ from note numbering (CS).
      // Or maybe we find the note item (CS-...) and look for an attached quiz?
      // The previous code looked up `contemporary_case_quizzes` by `case_number` = `CQ-...`.
      // The new system likely attaches quizzes to the *Note* item (CS-...).
      // Or maybe there is a separate structure item for the quiz?
      // Assuming quizzes are *attached* to the Case Note item (CS-...), let's try finding the CS item.
      
      let noteCaseNumber = quizCaseNumber.replace('CQ-', 'CS-'); // Convert back to CS for lookup
      if (quizCaseNumber.includes('CQ-25-C-')) noteCaseNumber = quizCaseNumber.replace('CQ-25-C-', 'CS-25-C-');

      const courseId = await this.getContemporaryCourseId();
      if (!courseId) throw new Error("Course not found");

      const { data: item, error: itemError } = await supabase
        .from('structure_items')
        .select('id')
        .eq('course_id', courseId)
        .eq('title', noteCaseNumber)
        .single();

      // If we can't find the item, we can't find the quiz
      if (itemError || !item) {
         // Fallback: Return placeholder
         console.warn('Quiz item/note not found:', noteCaseNumber);
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

      // Now find the attached quiz
      // We look in attached_quizzes for this item
      const { data: attachedQuiz } = await supabase
        .from('attached_quizzes')
        .select('id')
        .eq('note_item_id', item.id) // Assuming note_item_id links to structure_items.id
        .single();

      if (!attachedQuiz) {
         // No quiz attached
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

      // Fetch questions for the quiz
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', attachedQuiz.id)
        // .order('order_index') // Dictionary says order_index exists
        .order('id'); // Fallback or use id

      if (error) {
        console.warn('Quiz questions not found for quiz:', attachedQuiz.id);
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

  // Get a single course by ID
  static async getCourseById(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
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
        
      if (error) {
        // PGRST116 = Row not found, which might be expected for new items
        if (error.code === 'PGRST116') {
          console.warn(`Note content not found for item: ${itemId}`);
          return null;
        }
        console.error('Error fetching note content:', error);
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        throw error;
      }
      return data?.content_html || '';
    } catch (error: any) {
      console.error('Error fetching note content (catch):', error?.message || error);
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

  // Check which items have notes content and quizzes available
  // Returns { itemsWithNotes: Set<string>, itemsWithQuizzes: Set<string> }
  static async getContentAvailability(itemIds: string[]): Promise<{
    itemsWithNotes: Set<string>;
    itemsWithQuizzes: Set<string>;
  }> {
    const itemsWithNotes = new Set<string>();
    const itemsWithQuizzes = new Set<string>();

    if (itemIds.length === 0) {
      return { itemsWithNotes, itemsWithQuizzes };
    }

    try {
      // Check notes content in batch
      const { data: notesData } = await supabase
        .from('note_contents')
        .select('item_id')
        .in('item_id', itemIds);
      
      if (notesData) {
        notesData.forEach(row => itemsWithNotes.add(row.item_id));
      }

      // Check quizzes in batch - using attached_quizzes table with note_item_id
      const { data: quizzesData } = await supabase
        .from('attached_quizzes')
        .select('note_item_id')
        .in('note_item_id', itemIds);
      
      if (quizzesData) {
        quizzesData.forEach(row => {
          if (row.note_item_id) itemsWithQuizzes.add(row.note_item_id);
        });
      }

    } catch (error) {
      console.error('Error checking content availability:', error);
    }

    return { itemsWithNotes, itemsWithQuizzes };
  }

}