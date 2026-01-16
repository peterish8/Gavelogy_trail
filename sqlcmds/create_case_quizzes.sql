-- Create the contemporary_case_quizzes table
create table if not exists public.contemporary_case_quizzes (
  id uuid default gen_random_uuid() primary key,
  case_number text not null,
  case_name text not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null, -- 'A', 'B', 'C', 'D'
  explanation text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contemporary_case_quizzes enable row level security;

-- Policies
create policy "Enable read access for all users" on public.contemporary_case_quizzes
  for select using (true);
  
create policy "Enable insert for admins only" on public.contemporary_case_quizzes
  for insert with check (
    exists (
      select 1 from public.users 
      where id = auth.uid() and is_admin = true
    )
  );

-- Create table for quiz attempts if it doesn't exist (referenced in the code)
create table if not exists public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  quiz_id text not null,
  score integer not null,
  passed boolean default false,
  answers jsonb default '{}'::jsonb,
  subject text,
  topic text,
  total_questions integer default 0,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for attempts
alter table public.quiz_attempts enable row level security;

-- Policies for attempts
create policy "Users can view their own attempts" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own attempts" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);
