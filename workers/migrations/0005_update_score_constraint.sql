-- Update wine scores constraint to allow 1-5 instead of 1-10
-- Note: This migration updates the constraint for the wine_scores table

-- Drop the existing constraint (SQLite doesn't support ALTER TABLE DROP CONSTRAINT directly)
-- We need to recreate the table with the new constraint

-- Create a backup of existing data
CREATE TABLE IF NOT EXISTS wine_scores_backup AS SELECT * FROM wine_scores;

-- Drop the existing table
DROP TABLE IF EXISTS wine_scores;

-- Recreate the table with the updated constraint
CREATE TABLE wine_scores (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    wine_number INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    UNIQUE(event_id, player_id, wine_number)
);

-- Restore the data (only scores that are 1-5)
INSERT INTO wine_scores (id, event_id, player_id, wine_number, score, created_at, updated_at)
SELECT id, event_id, player_id, wine_number, score, created_at, updated_at
FROM wine_scores_backup
WHERE score >= 1 AND score <= 5;

-- Drop the backup table
DROP TABLE IF EXISTS wine_scores_backup;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_wine_scores_event_id ON wine_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_wine_scores_player_id ON wine_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_wine_scores_wine_number ON wine_scores(event_id, wine_number);
