-- Create user_sessions table
create table if not exists public.user_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    device_id text not null,
    device_info jsonb default '{}'::jsonb,
    session_started_at timestamptz default now() not null,
    last_active_at timestamptz default now() not null,
    logged_out_at timestamptz,
    ip_address inet,
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.user_sessions enable row level security;

-- Create indexes
create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_device_id on public.user_sessions(device_id);
create index if not exists idx_user_sessions_active on public.user_sessions(user_id) where logged_out_at is null;

-- RLS Policies
create policy "Users can view their own sessions"
    on public.user_sessions for select
    using (auth.uid() = user_id);

-- Only allow system/functions to insert/update usually, but for now allow strict control via RPC
-- actually, we'll force use of RPCs for creation to ensure limits check
-- so no INSERT policy for users.

-- Function to start a session
create or replace function public.start_session(
    p_device_id text,
    p_device_info jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_active_count int;
    v_session_id uuid;
begin
    -- Check active sessions count
    select count(*)
    into v_active_count
    from public.user_sessions
    where user_id = auth.uid()
    and logged_out_at is null;

    -- Enforce 3 device limit
    if v_active_count >= 3 then
        raise exception 'DEVICE_LIMIT_REACHED' using hint = 'Maximum 3 devices allowed.';
    end if;

    -- Create new session
    insert into public.user_sessions (
        user_id,
        device_id,
        device_info
    )
    values (
        auth.uid(),
        p_device_id,
        p_device_info
    )
    returning id into v_session_id;

    return v_session_id;
end;
$$;

-- Function to heartbeat and enforce rules
create or replace function public.heartbeat_session(
    p_session_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_active_sessions record[];
    v_count int;
    v_newest_started_at timestamptz;
    v_oldest_session_id uuid;
    v_status text := 'active';
    v_message text := null;
    v_session_exists boolean;
begin
    -- 1. Verify session ownership and aliveness
    select exists(
        select 1 from public.user_sessions 
        where id = p_session_id 
        and user_id = auth.uid() 
        and logged_out_at is null
    ) into v_session_exists;

    if not v_session_exists then
        return jsonb_build_object('status', 'terminated', 'reason', 'session_not_found');
    end if;

    -- 2. Update last_active_at
    update public.user_sessions
    set last_active_at = now()
    where id = p_session_id;

    -- 3. Get all active sessions for this user, ordered by started_at ASC (Oldest first)
    select array_agg(row(id, session_started_at))
    into v_active_sessions
    from (
        select id, session_started_at
        from public.user_sessions
        where user_id = auth.uid()
        and logged_out_at is null
        order by session_started_at asc
    ) s;

    v_count := array_length(v_active_sessions, 1);

    -- 4. Enforce Logic
    
    -- Case 1: 1 Device (Unlimited)
    if v_count = 1 then
        return jsonb_build_object('status', 'active');
    end if;

    -- Case 2: 2 Devices (90 mins allowed)
    if v_count = 2 then
        -- Newest session is the 2nd one (index 2 because ordered ASC)
        v_newest_started_at := (v_active_sessions[2]).session_started_at;
        
        -- Check if 90 mins passed since overlap began
        if now() - v_newest_started_at > interval '90 minutes' then
            -- Kill oldest (index 1)
            v_oldest_session_id := (v_active_sessions[1]).id;
            
            update public.user_sessions
            set logged_out_at = now()
            where id = v_oldest_session_id;

            -- If the current session is the one we just killed
            if v_oldest_session_id = p_session_id then
                return jsonb_build_object('status', 'terminated', 'reason', 'grace_period_expired_2_devices');
            end if;
        end if;
        
        -- Warning check (e.g. at 80 mins)
        if now() - v_newest_started_at > interval '80 minutes' then
             return jsonb_build_object('status', 'warning', 'message', '10 minutes remaining');
        end if;
    end if;

    -- Case 3: 3 Devices (25 mins allowed)
    if v_count = 3 then
        -- Newest session is 3rd
        v_newest_started_at := (v_active_sessions[3]).session_started_at;
        
        -- Check if 25 mins passed
        if now() - v_newest_started_at > interval '25 minutes' then
             -- Kill oldest (index 1)
            v_oldest_session_id := (v_active_sessions[1]).id;
            
            update public.user_sessions
            set logged_out_at = now()
            where id = v_oldest_session_id;

            -- If the current session is the one we just killed
            if v_oldest_session_id = p_session_id then
                return jsonb_build_object('status', 'terminated', 'reason', 'grace_period_expired_3_devices');
            end if;
        end if;

         -- Warning check (e.g. at 20 mins)
        if now() - v_newest_started_at > interval '20 minutes' then
             return jsonb_build_object('status', 'warning', 'message', '5 minutes remaining');
        end if;
    end if;

    return jsonb_build_object('status', 'active');
end;
$$;

-- Function to manually logout (useful to free up slots)
create or replace function public.logout_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    update public.user_sessions
    set logged_out_at = now()
    where id = p_session_id
    and user_id = auth.uid();
end;
$$;
