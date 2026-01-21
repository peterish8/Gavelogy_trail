-- 1. Create user_sessions table (Base Session Tracking)
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

alter table public.user_sessions enable row level security;

create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_device_id on public.user_sessions(device_id);
create index if not exists idx_user_sessions_active on public.user_sessions(user_id) where logged_out_at is null;

create policy "Users can view their own sessions"
    on public.user_sessions for select
    using (auth.uid() = user_id);

-- 2. Create user_concurrency_state table (Strict Overlap Logic)
create table if not exists public.user_concurrency_state (
    user_id uuid primary key references auth.users(id) on delete cascade,
    concurrency_level int default 0,
    overlap_started_at timestamptz,
    updated_at timestamptz default now()
);

alter table public.user_concurrency_state enable row level security;

create policy "Users can view their own concurrency state"
    on public.user_concurrency_state for select
    using (auth.uid() = user_id);

-- 3. Functions

-- Helper: Manual Logout
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

-- Logic: Start Session (Active = Last 2 mins)
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
    -- STRICT CHECK: Only count sessions active in the last 2 minutes
    select count(*)
    into v_active_count
    from public.user_sessions
    where user_id = auth.uid()
    and logged_out_at is null
    and last_active_at >= (now() - interval '2 minutes');

    -- Enforce 3 device limit BEFORE insert
    if v_active_count >= 3 then
        raise exception 'DEVICE_LIMIT_REACHED' using hint = 'Maximum 3 devices allowed.';
    end if;

    insert into public.user_sessions (
        user_id,
        device_id,
        device_info,
        last_active_at,
        session_started_at
    )
    values (
        auth.uid(),
        p_device_id,
        p_device_info,
        now(),
        now()
    )
    returning id into v_session_id;

    return v_session_id;
end;
$$;

-- Logic: Heartbeat (Overlap Timer State Machine)
create or replace function public.heartbeat_session(
    p_session_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_count int;
    v_oldest_session_id uuid;
    v_session_exists boolean;
    
    v_state_record public.user_concurrency_state%rowtype;
    v_new_level int;
    v_overlap_start timestamptz;
    v_time_diff interval;
begin
    -- 1. Check if session is alive (not manually logged out)
    select exists(
        select 1 from public.user_sessions 
        where id = p_session_id 
        and user_id = auth.uid() 
        and logged_out_at is null
    ) into v_session_exists;

    if not v_session_exists then
        return jsonb_build_object('status', 'terminated', 'reason', 'session_not_found');
    end if;

    -- 2. Update THIS session's last_active_at
    update public.user_sessions
    set last_active_at = now()
    where id = p_session_id;

    -- 3. Calculate "Real" Active Count (Active within 2 min)
    select count(*)
    into v_count
    from public.user_sessions
    where user_id = auth.uid()
    and logged_out_at is null
    and last_active_at >= (now() - interval '2 minutes');

    v_new_level := v_count;

    -- 4. Manage Overlap State
    select * into v_state_record 
    from public.user_concurrency_state 
    where user_id = auth.uid();

    if not found then
        insert into public.user_concurrency_state (user_id, concurrency_level, overlap_started_at)
        values (auth.uid(), v_new_level, case when v_new_level >= 2 then now() else null end)
        returning * into v_state_record;
    end if;

    -- State Transition
    if v_new_level != v_state_record.concurrency_level then
        -- If we entered concurrent mode (>=2) or switched levels within it, RESET timer.
        if v_new_level >= 2 then
             v_overlap_start := now();
        else
             v_overlap_start := null;
        end if;
        
        update public.user_concurrency_state
        set concurrency_level = v_new_level,
            overlap_started_at = v_overlap_start,
            updated_at = now()
        where user_id = auth.uid();
    else
        -- Keep existing timer
        v_overlap_start := v_state_record.overlap_started_at;
    end if;

    -- 5. Enforce Grace Period
    if v_count >= 2 and v_overlap_start is not null then
        v_time_diff := now() - v_overlap_start;
        
        -- Case 2 Devices: 90 mins
        if v_count = 2 then
            if v_time_diff > interval '90 minutes' then
                -- Get oldest active session
                select id into v_oldest_session_id
                from public.user_sessions
                where user_id = auth.uid()
                and logged_out_at is null
                and last_active_at >= (now() - interval '2 minutes')
                order by session_started_at asc
                limit 1;
                
                update public.user_sessions
                set logged_out_at = now()
                where id = v_oldest_session_id;

                if v_oldest_session_id = p_session_id then
                    return jsonb_build_object('status', 'terminated', 'reason', 'grace_period_expired_2_devices');
                end if;
            end if;
            
            if v_time_diff > interval '80 minutes' then
                return jsonb_build_object('status', 'warning', 'message', '10 minutes remaining');
            end if;
        end if;

        -- Case 3 Devices: 25 mins
        if v_count = 3 then
            if v_time_diff > interval '25 minutes' then
                 -- Get oldest active session
                select id into v_oldest_session_id
                from public.user_sessions
                where user_id = auth.uid()
                and logged_out_at is null
                and last_active_at >= (now() - interval '2 minutes')
                order by session_started_at asc
                limit 1;
                
                update public.user_sessions
                set logged_out_at = now()
                where id = v_oldest_session_id;

                if v_oldest_session_id = p_session_id then
                    return jsonb_build_object('status', 'terminated', 'reason', 'grace_period_expired_3_devices');
                end if;
            end if;

            if v_time_diff > interval '20 minutes' then
                return jsonb_build_object('status', 'warning', 'message', '5 minutes remaining');
            end if;
        end if;
    end if;

    return jsonb_build_object('status', 'active');
end;
$$;
