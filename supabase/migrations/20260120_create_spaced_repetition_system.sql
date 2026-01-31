-- Create spaced_repetition_schedules table
create table if not exists spaced_repetition_schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    quiz_id uuid not null references attached_quizzes(id) on delete cascade,
    
    current_stage_index smallint not null default 0,
    -- 0=Transition/Day1, 1=Day3, 2=Day7, etc.
    
    next_due_at timestamp with time zone not null,
    -- The definitive "date" this item appears on the calendar
    
    last_completed_at timestamp with time zone,
    -- Reference point for calculating the next interval
    
    status text not null default 'active' check (status in ('active', 'completed', 'archived')),
    
    meta_stats jsonb default '{}'::jsonb,
    -- Cache for weighted selection stats (derived, not authoritative)
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    -- Ensure one schedule per user+quiz
    unique(user_id, quiz_id)
);

-- Enable RLS
alter table spaced_repetition_schedules enable row level security;

-- Policies
-- READ: Users can see their own schedules (for Calendar UI)
create policy "Users can view own spaced repetition schedules"
    on spaced_repetition_schedules for select
    using (auth.uid() = user_id);

-- WRITE behaviors are handled via Server-Side API (Service Role),
-- but we can add a policy for authenticated users just in case we switch strategies later,
-- though strictly adhering to "Backend API" is safer. 
-- I will add DELETE policy for self-cleanup if matched.
create policy "Users can delete own spaced repetition schedules"
    on spaced_repetition_schedules for delete
    using (auth.uid() = user_id);

-- Indexes for Calendar Performance
create index idx_schedules_user_due on spaced_repetition_schedules(user_id, next_due_at);
create index idx_schedules_quiz_id on spaced_repetition_schedules(quiz_id);
