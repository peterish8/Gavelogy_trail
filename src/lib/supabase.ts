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
      attached_quizzes: {
        Row: {
          id: string;
          title: string | null;
          passing_score: number | null;
          note_item_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          passing_score?: number | null;
          note_item_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          passing_score?: number | null;
          note_item_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      draft_content_cache: {
        Row: {
          id: string;
          user_id: string | null;
          original_content_id: string;
          draft_data: Record<string, unknown> | null; // jsonb
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          original_content_id: string;
          draft_data?: Record<string, unknown> | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          original_content_id?: string;
          draft_data?: Record<string, unknown> | null;
          updated_at?: string | null;
        };
      };
      game_answers: {
        Row: {
          id: string;
          lobby_id: string;
          player_id: string;
          question_id: string;
          answer: string | null;
          is_correct: boolean;
          points_earned: number | null;
          time_taken_ms: number;
          round: number;
          question_order: number;
          answered_at: string | null;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          player_id: string;
          question_id: string;
          answer?: string | null;
          is_correct: boolean;
          points_earned?: number | null;
          time_taken_ms: number;
          round: number;
          question_order: number;
          answered_at?: string | null;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          player_id?: string;
          question_id?: string;
          answer?: string | null;
          is_correct?: boolean;
          points_earned?: number | null;
          time_taken_ms?: number;
          round?: number;
          question_order?: number;
          answered_at?: string | null;
        };
      };
      game_events: {
        Row: {
          id: string;
          lobby_id: string;
          event_type: string;
          payload: Record<string, unknown>; // jsonb
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          event_type: string;
          payload: Record<string, unknown>;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          event_type?: string;
          payload?: Record<string, unknown>;
          created_at?: string | null;
        };
      };
      game_lobbies: {
        Row: {
          id: string;
          status: string;
          mode: string;
          current_round: number | null;
          max_rounds: number | null;
          question_ids: string[]; // jsonb
          started_at: string | null;
          finished_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          status?: string;
          mode: string;
          current_round?: number | null;
          max_rounds?: number | null;
          question_ids: string[];
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          status?: string;
          mode?: string;
          current_round?: number | null;
          max_rounds?: number | null;
          question_ids?: string[];
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string | null;
        };
      };
      game_players: {
        Row: {
          id: string;
          lobby_id: string;
          user_id: string | null;
          display_name: string;
          avatar_url: string | null;
          score: number | null;
          current_question: number | null;
          is_bot: boolean | null;
          eliminated_round: number | null;
          final_rank: number | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          user_id?: string | null;
          display_name: string;
          avatar_url?: string | null;
          score?: number | null;
          current_question?: number | null;
          is_bot?: boolean | null;
          eliminated_round?: number | null;
          final_rank?: number | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          user_id?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          score?: number | null;
          current_question?: number | null;
          is_bot?: boolean | null;
          eliminated_round?: number | null;
          final_rank?: number | null;
          joined_at?: string | null;
        };
      };
      note_contents: {
        Row: {
          id: string;
          item_id: string | null;
          content_html: string | null;
          search_vector: string | null; // tsvector
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          item_id?: string | null;
          content_html?: string | null;
          search_vector?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          item_id?: string | null;
          content_html?: string | null;
          search_vector?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      quiz_answer_confidence: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string | null;
          question_id: string | null;
          confidence_level: string;
          answer_was_correct: boolean;
          is_initial_attempt: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id?: string | null;
          question_id?: string | null;
          confidence_level: string;
          answer_was_correct: boolean;
          is_initial_attempt?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string | null;
          question_id?: string | null;
          confidence_level?: string;
          answer_was_correct?: boolean;
          is_initial_attempt?: boolean | null;
          created_at?: string | null;
        };
      };
      streak_bonuses: {
        Row: {
          id: string;
          streak_days: number;
          bonus_points: number;
          badge_name: string | null;
          badge_emoji: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          streak_days: number;
          bonus_points: number;
          badge_name?: string | null;
          badge_emoji?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          streak_days?: number;
          bonus_points?: number;
          badge_name?: string | null;
          badge_emoji?: string | null;
          created_at?: string | null;
        };
      };
      structure_items: {
        Row: {
          id: string;
          course_id: string | null;
          parent_id: string | null;
          title: string;
          description: string | null;
          item_type: string;
          order_index: number | null;
          icon: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          item_type: string;
          order_index?: number | null;
          icon?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string | null;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          item_type?: string;
          order_index?: number | null;
          icon?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_completed_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          course_id: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          course_id?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          course_id?: string | null;
          completed_at?: string | null;
        };
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          all_time_points: number | null;
          monthly_points: number | null;
          month: string; // date
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          all_time_points?: number | null;
          monthly_points?: number | null;
          month: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          all_time_points?: number | null;
          monthly_points?: number | null;
          month?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_streaks: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          current_streak: number | null;
          longest_streak: number | null;
          last_activity_date: string | null; // date
          total_score: number | null;
          total_quizzes_completed: number | null;
          total_cases_studied: number | null;
          total_pyq_attempted: number | null;
          bonuses_claimed: number[] | null; // ARRAY
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          current_streak?: number | null;
          longest_streak?: number | null;
          last_activity_date?: string | null;
          total_score?: number | null;
          total_quizzes_completed?: number | null;
          total_cases_studied?: number | null;
          total_pyq_attempted?: number | null;
          bonuses_claimed?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          current_streak?: number | null;
          longest_streak?: number | null;
          last_activity_date?: string | null;
          total_score?: number | null;
          total_quizzes_completed?: number | null;
          total_cases_studied?: number | null;
          total_pyq_attempted?: number | null;
          bonuses_claimed?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}
