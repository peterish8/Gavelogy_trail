-- Enable RLS on mistakes table
alter table mistakes enable row level security;

-- Drop existing policies to ensure clean slate
drop policy if exists "Users can insert their own mistakes" on mistakes;
drop policy if exists "Users can update their own mistakes" on mistakes;
drop policy if exists "Users can select their own mistakes" on mistakes;
drop policy if exists "Enable access to own mistakes" on mistakes;
drop policy if exists "Authenticated users can insert mistakes" on mistakes;
drop policy if exists "Authenticated users can update mistakes" on mistakes;

-- Create comprehensive policy for all operations
create policy "Enable access to own mistakes"
  on mistakes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Explicitly ensure quiz_answer_confidence has policies too (just in case)
alter table quiz_answer_confidence enable row level security;

drop policy if exists "Enable access to own confidence ratings" on quiz_answer_confidence;

create policy "Enable access to own confidence ratings"
  on quiz_answer_confidence for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
