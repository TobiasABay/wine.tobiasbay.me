-- Add ready status to players table
ALTER TABLE players ADD COLUMN is_ready BOOLEAN DEFAULT 0;

-- Create index for ready status
CREATE INDEX IF NOT EXISTS idx_players_ready_status ON players(event_id, is_ready);
