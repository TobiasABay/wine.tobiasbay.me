-- Update score constraint to 1-5 (instead of 1-10)
-- Keep REAL for decimal support

-- Step 1: Create a new table with updated constraint
CREATE TABLE wine_scores_new (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    wine_number INTEGER NOT NULL,
    score REAL NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(event_id, player_id, wine_number)
);

-- Step 2: Copy data from old table to new table
INSERT INTO wine_scores_new (id, event_id, player_id, wine_number, score, created_at, updated_at)
SELECT id, event_id, player_id, wine_number, score, created_at, updated_at
FROM wine_scores;

-- Step 3: Drop old table
DROP TABLE wine_scores;

-- Step 4: Rename new table to original name
ALTER TABLE wine_scores_new RENAME TO wine_scores;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_wine_scores_event ON wine_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_wine_scores_wine_number ON wine_scores(wine_number);

