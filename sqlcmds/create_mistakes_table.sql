-- Create contemporary_mistakes table based on MistakeRecord interface

create table if not exists public.contemporary_mistakes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  question_id text not null, -- or uuid if it links to quiz_questions
  subject text not null,
  topic text,
  question_text text not null,
  user_answer text not null,
  user_answer_text text,
  correct_answer text not null,
  correct_answer_text text,
  explanation text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  confidence_level text check (confidence_level in ('confident', 'educated_guess', 'fluke')),
  is_mastered boolean default false,
  retake_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Prevent duplicate mistakes for the same question?
  unique(user_id, question_id)
);

-- Enable RLS
alter table public.contemporary_mistakes enable row level security;

-- Policies
create policy "Users can view own mistakes"
  on public.contemporary_mistakes for select
  using (auth.uid() = user_id);

create policy "Users can insert own mistakes"
  on public.contemporary_mistakes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mistakes"
  on public.contemporary_mistakes for update
  using (auth.uid() = user_id);

create policy "Users can delete own mistakes"
  on public.contemporary_mistakes for delete
  using (auth.uid() = user_id);
