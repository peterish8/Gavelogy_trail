// Simple in-memory cache with localStorage persistence
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Load cache from localStorage on initialization
    this.loadFromStorage();
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(key, item);
    this.saveToStorage();
  }

  get(key: string) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
    localStorage.removeItem('gavalogy_cache');
  }

  private saveToStorage() {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('gavalogy_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('gavalogy_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }
}

export const cache = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
  CONTEMPORARY_CASES: (year: string) => `contemporary_cases_${year}`,
  CASE_NOTES: (year: string, caseNumber: string) => `case_notes_${year}_${caseNumber}`,
  QUIZ_QUESTIONS: (caseNumber: string) => `quiz_questions_${caseNumber}`,
  SUBJECTS: 'subjects_list',
  USER_PROGRESS: (userId: string) => `user_progress_${userId}`,
};