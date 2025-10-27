import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be generated from Supabase later)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          total_coins: number;
          streak_count: number;
          longest_streak: number;
          last_activity_date: string | null;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          total_coins?: number;
          streak_count?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          total_coins?: number;
          streak_count?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_courses: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          purchased_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          purchased_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          purchased_at?: string;
          expires_at?: string | null;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          description: string;
          course_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          course_id: string;
          order_index: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          course_id?: string;
          order_index?: number;
        };
      };
      quizzes: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          description: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          subject_id: string;
          title: string;
          description: string;
          order_index: number;
        };
        Update: {
          id?: string;
          subject_id?: string;
          title?: string;
          description?: string;
          order_index?: number;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string;
          order_index: number;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_answer?: string;
          explanation?: string;
          order_index?: number;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          score?: number;
          total_questions?: number;
          time_taken?: number;
          completed_at?: string;
        };
      };
      quiz_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          confidence: "confident" | "guess" | "fluke";
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          confidence: "confident" | "guess" | "fluke";
          is_correct: boolean;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_answer?: string;
          confidence?: "confident" | "guess" | "fluke";
          is_correct?: boolean;
        };
      };
      mistakes: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          subject_id: string;
          review_count: number;
          source_type: "quiz" | "mock";
          source_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          subject_id: string;
          review_count: number;
          source_type: "quiz" | "mock";
          source_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          subject_id?: string;
          review_count?: number;
          source_type?: "quiz" | "mock";
          source_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mock_tests: {
        Row: {
          id: string;
          title: string;
          description: string;
          total_questions: number;
          duration_minutes: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          total_questions: number;
          duration_minutes: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          total_questions?: number;
          duration_minutes?: number;
          is_active?: boolean;
        };
      };
      mock_attempts: {
        Row: {
          id: string;
          user_id: string;
          mock_test_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mock_test_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mock_test_id?: string;
          score?: number;
          total_questions?: number;
          time_taken?: number;
          completed_at?: string;
        };
      };
      contemporary_cases: {
        Row: {
          id: string;
          title: string;
          description: string;
          year: number;
          month: number;
          subject: string;
          case_summary: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          year: number;
          month: number;
          subject: string;
          case_summary: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          year?: number;
          month?: number;
          subject?: string;
          case_summary?: string;
        };
      };
      contemprory_case_notes: {
        Row: {
          id: string;
          case_number: string;
          overall_content: string;
        };
        Insert: {
          id?: string;
          case_number: string;
          overall_content: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          overall_content?: string;
        };
      };
      contemporary_case_quizzes: {
        Row: {
          id: string;
          case_number: string;
          case_name: string;
          passage: string;
          case_question_id: string;
          question: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number: string;
          case_name: string;
          passage: string;
          case_question_id: string;
          question: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          case_name?: string;
          passage?: string;
          case_question_id?: string;
          question?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_answer?: string;
          explanation?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source?: string;
          description?: string;
          created_at?: string;
        };
      };
      payment_orders: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          course_id: string;
          amount: number;
          status: "pending" | "success" | "failed";
          payment_method: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          course_id: string;
          amount: number;
          status?: "pending" | "success" | "failed";
          payment_method?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          course_id?: string;
          amount?: number;
          status?: "pending" | "success" | "failed";
          payment_method?: string;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          user_id: string;
          badge_type:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          badge_level: "bronze" | "silver" | "gold";
          achieved_at: string;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          badge_level: "bronze" | "silver" | "gold";
          achieved_at?: string;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_type?:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          badge_level?: "bronze" | "silver" | "gold";
          achieved_at?: string;
          metadata?: Record<string, unknown>;
        };
      };
      badge_progress: {
        Row: {
          id: string;
          user_id: string;
          badge_type:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          current_value: number;
          bronze_achieved: boolean;
          silver_achieved: boolean;
          gold_achieved: boolean;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          current_value?: number;
          bronze_achieved?: boolean;
          silver_achieved?: boolean;
          gold_achieved?: boolean;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_type?:
            | "accuracy_champ"
            | "speedster"
            | "consistent_learner"
            | "insight_seeker";
          current_value?: number;
          bronze_achieved?: boolean;
          silver_achieved?: boolean;
          gold_achieved?: boolean;
          last_updated?: string;
        };
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          quizzes_completed: number;
          mocks_completed: number;
          mistakes_cleared: number;
          time_spent: number;
          coins_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          quizzes_completed?: number;
          mocks_completed?: number;
          mistakes_cleared?: number;
          time_spent?: number;
          coins_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          quizzes_completed?: number;
          mocks_completed?: number;
          mistakes_cleared?: number;
          time_spent?: number;
          coins_earned?: number;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type:
            | "quiz"
            | "mock"
            | "mistake_quiz"
            | "explanation_viewed";
          activity_id: string | null;
          subject: string | null;
          duration: number | null;
          coins_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type:
            | "quiz"
            | "mock"
            | "mistake_quiz"
            | "explanation_viewed";
          activity_id?: string | null;
          subject?: string | null;
          duration?: number | null;
          coins_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?:
            | "quiz"
            | "mock"
            | "mistake_quiz"
            | "explanation_viewed";
          activity_id?: string | null;
          subject?: string | null;
          duration?: number | null;
          coins_earned?: number;
          created_at?: string;
        };
      };
      subject_performance: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          total_attempts: number;
          total_correct: number;
          total_questions: number;
          average_accuracy: number;
          average_time_per_question: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          total_attempts?: number;
          total_correct?: number;
          total_questions?: number;
          average_accuracy?: number;
          average_time_per_question?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          total_attempts?: number;
          total_correct?: number;
          total_questions?: number;
          average_accuracy?: number;
          average_time_per_question?: number;
          last_updated?: string;
        };
      };
      weekly_performance: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          quizzes_completed: number;
          mocks_completed: number;
          total_questions: number;
          total_correct: number;
          average_accuracy: number;
          time_spent: number;
          coins_earned: number;
          active_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          quizzes_completed?: number;
          mocks_completed?: number;
          total_questions?: number;
          total_correct?: number;
          average_accuracy?: number;
          time_spent?: number;
          coins_earned?: number;
          active_days?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          quizzes_completed?: number;
          mocks_completed?: number;
          total_questions?: number;
          total_correct?: number;
          average_accuracy?: number;
          time_spent?: number;
          coins_earned?: number;
          active_days?: number;
          created_at?: string;
        };
      };
      mock_test_questions: {
        Row: {
          id: string;
          mock_test_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          subject: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          mock_test_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation?: string | null;
          subject?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          mock_test_id?: string;
          question_text?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_answer?: string;
          explanation?: string | null;
          subject?: string | null;
          order_index?: number;
        };
      };
      mock_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          confidence: "confident" | "guess" | "fluke";
          is_correct: boolean;
          time_spent: number | null;
          subject: string | null;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          confidence: "confident" | "guess" | "fluke";
          is_correct: boolean;
          time_spent?: number | null;
          subject?: string | null;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_answer?: string;
          confidence?: "confident" | "guess" | "fluke";
          is_correct?: boolean;
          time_spent?: number | null;
          subject?: string | null;
        };
      };
    };
  };
}
