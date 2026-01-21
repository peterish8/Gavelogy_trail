-- ============================================
-- Award Coins RPC
-- ============================================
-- secure function to be called by server action
create or replace function award_coins(
  p_user_id uuid,
  p_lobby_id uuid,
  p_amount int
)
returns void
language plpgsql
security definer -- runs with owner privileges (service role)
as $$
begin
  -- 1. Check if already awarded (idempotency)
  if exists (
    select 1 from coin_transactions 
    where user_id = p_user_id and lobby_id = p_lobby_id
  ) then
    raise exception 'Coins already awarded for this lobby';
  end if;

  -- 2. Insert transaction record
  insert into coin_transactions (user_id, lobby_id, amount, reason)
  values (p_user_id, p_lobby_id, p_amount, 'BarArena Reward');

  -- 3. Update user balance
  -- Check if coins column exists, it should as per previous migration
  update users
  set coins = coalesce(coins, 0) + p_amount
  where id = p_user_id;

end;
$$;
