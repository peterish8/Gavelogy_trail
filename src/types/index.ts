// Production-ready TypeScript types and interfaces

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  xp: number;
  total_coins: number;
  streak_count: number;
  longest_streak: number;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  qid: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  subject?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  questions: string[];
  answers: Record<string, string>;
  correct_answers: Record<string, string>;
  score: number;
  total_questions: number;
  time_spent: number;
  wrong_questions: string[];
  confidence: Record<string, "confident" | "guess" | "fluke">;
  attempted_at: string;
  completed_at: string;
}

export interface Mistake {
  id: string;
  user_id: string;
  question_id: string;
  subject: string;
  topic: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  created_at: string;
  is_cleared: boolean;
  cleared_at?: string;
  attempts: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  purchased_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface GamificationData {
  user_id: string;
  total_coins: number;
  streak_count: number;
  longest_streak: number;
  last_activity_date: string;
  total_quizzes_completed: number;
  total_mistakes_cleared: number;
  achievements: string[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_coins: number;
  streak_count: number;
  rank: number;
}

export interface AnalyticsData {
  user_id: string;
  total_attempts: number;
  average_score: number;
  total_questions_answered: number;
  total_correct_answers: number;
  total_time_spent: number;
  attempts_by_subject: Record<string, number>;
  attempts_by_topic: Record<string, number>;
  mistakes_by_subject: Record<string, number>;
  mistakes_by_topic: Record<string, number>;
  weekly_progress: Array<{
    week: string;
    quizzes_completed: number;
    mistakes_cleared: number;
    time_spent: number;
  }>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
}

export interface ProfileUpdateForm {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

// Quiz types
export interface QuizState {
  currentQuestion: number;
  answers: Record<string, string>;
  timeSpent: number;
  isCompleted: boolean;
  isReviewMode: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  wrongQuestions: string[];
  confidence: Record<string, "confident" | "guess" | "fluke">;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Store types
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface QuizStoreState {
  attempts: QuizAttempt[];
  currentQuiz: QuizState | null;
  isLoading: boolean;
  error: string | null;
}

export interface MistakeStoreState {
  mistakes: Mistake[];
  isLoading: boolean;
  error: string | null;
}

export interface GamificationStoreState {
  data: GamificationData | null;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface PaymentStoreState {
  courses: Course[];
  userCourses: UserCourse[];
  isLoading: boolean;
  error: string | null;
}

// Component prop types
export interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

// Judgment mode types
export interface NotePdfLink {
  id: string;
  item_id: string;
  link_id: string;
  pdf_page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  created_at: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types
export interface QuizEvent {
  type:
    | "quiz_started"
    | "quiz_completed"
    | "question_answered"
    | "mistake_made";
  data: unknown;
  timestamp: string;
}

export interface AnalyticsEvent {
  type: "page_view" | "quiz_attempt" | "mistake_cleared" | "course_purchased";
  data: unknown;
  timestamp: string;
}
