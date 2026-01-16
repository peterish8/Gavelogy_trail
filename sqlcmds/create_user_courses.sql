-- Create user_courses table for tracking purchased courses
create table if not exists public.user_courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  status text default 'active',
  purchase_date timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_courses enable row level security;

-- Policies
create policy "Users can view their own courses"
  on public.user_courses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own courses"
  on public.user_courses for insert
  with check (auth.uid() = user_id);
  
create policy "Users can update their own courses"
  on public.user_courses for update
  using (auth.uid() = user_id);
