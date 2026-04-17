-- Drop the existing constraint
ALTER TABLE game_lobbies DROP CONSTRAINT IF EXISTS game_lobbies_mode_check;

-- Add the new constraint with all 4 modes
ALTER TABLE game_lobbies ADD CONSTRAINT game_lobbies_mode_check CHECK (mode IN ('duel', 'arena', 'tagteam', 'speed_court'));
