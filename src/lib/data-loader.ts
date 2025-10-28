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
        return { data: null, fromCache: false };
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
        .order('case_question_id');

      if (error) throw error;

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
      
      const preloadPromises = firstThreeCases.map(caseItem => 
        this.preloadCaseData(year, caseItem.case_number).catch(() => null)
      );

      await Promise.all(preloadPromises);
    } catch (error) {
      // Silent fail for preloading
    }
  }
}

// Auto-preload popular content
export const initializeCache = () => {
  // Preload 2024 and 2025 cases
  setTimeout(() => {
    DataLoader.preloadYearCases('2024').catch(() => null);
    DataLoader.preloadYearCases('2025').catch(() => null);
  }, 1000); // Delay to not block initial load
};