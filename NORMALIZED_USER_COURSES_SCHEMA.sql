-- ============================================
-- NORMALIZED USER_COURSES SCHEMA
-- Refactoring the user_courses table for better data integrity
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE purchase_status AS ENUM ('pending', 'success', 'failed');

-- ============================================
-- NORMALIZED USER_COURSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_courses_normalized (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT, -- Can be linked to a payment_orders table
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status purchase_status DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_courses_normalized_user_id ON public.user_courses_normalized(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_normalized_course_id ON public.user_courses_normalized(course_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.user_courses_normalized ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own course enrollments"
ON public.user_courses_normalized
FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_courses_normalized table
CREATE TRIGGER update_user_courses_normalized_updated_at
  BEFORE UPDATE ON public.user_courses_normalized
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.user_courses_normalized IS 'A normalized table for tracking user course enrollments, linking to the courses table.';
COMMENT ON COLUMN public.user_courses_normalized.course_id IS 'Foreign key to the courses table, eliminating data duplication.';
