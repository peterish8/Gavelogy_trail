create table if not exists public.user_completed_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  item_id uuid references public.structure_items(id) not null,
  course_id uuid references public.courses(id), -- Optional denormalization for faster course-level queries
  completed_at timestamp with time zone default now(),
  
  unique(user_id, item_id)
);

-- Enable RLS
alter table public.user_completed_items enable row level security;

-- Policies
create policy "Users can view own completed items"
  on public.user_completed_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own completed items"
  on public.user_completed_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own completed items"
  on public.user_completed_items for delete
  using (auth.uid() = user_id);
