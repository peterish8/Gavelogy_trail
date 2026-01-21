create table if not exists daily_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  activity_date date not null,
  quizzes_completed integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, activity_date)
);

alter table daily_activity enable row level security;

create policy "Users can view own daily activity"
  on daily_activity for select
  using (auth.uid() = user_id);
