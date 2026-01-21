-- Create table to track concurrency state per user
create table if not exists public.user_concurrency_state (
    user_id uuid primary key references auth.users(id) on delete cascade,
    concurrency_level int default 0,
    overlap_started_at timestamptz,
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_concurrency_state enable row level security;

-- RLS: Only system/functions interact, but user can view for debug? No, keep private strictly.
-- But the function is security definer, so it's fine.
-- Let's allow select for user just in case.
create policy "Users can view their own concurrency state"
    on public.user_concurrency_state for select
    using (auth.uid() = user_id);


-- REWRITE start_session with Correct Logic
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
    -- Definition of Active: logged_out_at IS NULL AND last_active_at >= NOW() - 2 mins
    select count(*)
    into v_active_count
    from public.user_sessions
    where user_id = auth.uid()
    and logged_out_at is null
    and last_active_at >= (now() - interval '2 minutes');

    -- Enforce 3 device limit
    if v_active_count >= 3 then
        raise exception 'DEVICE_LIMIT_REACHED' using hint = 'Maximum 3 devices allowed.';
    end if;

    -- Create new session
    insert into public.user_sessions (
        user_id,
        device_id,
        device_info,
        last_active_at, -- Initialize active time
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

    -- Note: Heartbeat will handle the Concurrency State update immediately after login 
    -- because the client usually calls data loading or heartbeat soon? 
    -- OR we should ideally update it here.
    -- But let's let the first heartbeat (which happens on mount) handle the state transition 
    -- to keep logic centralized in heartbeat_session.
    
    return v_session_id;
end;
$$;


-- REWRITE heartbeat_session with Correct Logic
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
    v_oldest_session_id uuid;
    v_session_exists boolean;
    
    v_state_record public.user_concurrency_state%rowtype;
    v_new_level int;
    v_overlap_start timestamptz;
    v_time_diff interval;
begin
    -- 1. Verify session exists and is conceptually "not dead" (not logged out explicitly)
    select exists(
        select 1 from public.user_sessions 
        where id = p_session_id 
        and user_id = auth.uid() 
        and logged_out_at is null
    ) into v_session_exists;

    if not v_session_exists then
        return jsonb_build_object('status', 'terminated', 'reason', 'session_not_found');
    end if;

    -- 2. Update last_active_at for THIS session
    update public.user_sessions
    set last_active_at = now()
    where id = p_session_id;

    -- 3. Calculate "Real" Active Count
    -- (All sessions active within last 2 minutes)
    select array_agg(row(id, session_started_at))
    into v_active_sessions
    from (
        select id, session_started_at
        from public.user_sessions
        where user_id = auth.uid()
        and logged_out_at is null
        and last_active_at >= (now() - interval '2 minutes') -- Strict Active Def
        order by session_started_at asc
    ) s;

    v_count := coalesce(array_length(v_active_sessions, 1), 0);
    v_new_level := v_count;

    -- 4. Manage State (Overlap Timer)
    select * into v_state_record 
    from public.user_concurrency_state 
    where user_id = auth.uid();

    if not found then
        -- Initialize state
        insert into public.user_concurrency_state (user_id, concurrency_level, overlap_started_at)
        values (auth.uid(), v_new_level, case when v_new_level >= 2 then now() else null end)
        returning * into v_state_record;
    end if;

    -- State Transition Logic
    if v_new_level != v_state_record.concurrency_level then
        -- Level changed
        if v_new_level >= 2 then
             -- Entered (or changed between) concurrent states -> Reset Timer
             -- User said: "Set it: When... crosses". "Reset it: When count drops...".
             -- We chose: Any change in concurrency level >= 2 resets the timer 
             -- to ensure fairness and simplicity, and avoid "stale" timers from a different mode.
             v_overlap_start := now();
        else
             -- Dropped below 2 -> Clear Timer
             v_overlap_start := null;
        end if;
        
        -- Update State
        update public.user_concurrency_state
        set concurrency_level = v_new_level,
            overlap_started_at = v_overlap_start,
            updated_at = now()
        where user_id = auth.uid();
        
    else
        -- Level matched, keep existing timer
        v_overlap_start := v_state_record.overlap_started_at;
    end if;


    -- 5. Enforce Grace Period
    if v_count >= 2 and v_overlap_start is not null then
        v_time_diff := now() - v_overlap_start;
        
        -- Case 2 Devices: 90 mins
        if v_count = 2 then
            if v_time_diff > interval '90 minutes' then
                -- Kill Oldest
                v_oldest_session_id := (v_active_sessions[1]).id;
                
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
                 -- Kill Oldest
                v_oldest_session_id := (v_active_sessions[1]).id;
                
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
