-- Wine scores table
CREATE TABLE IF NOT EXISTS wine_scores (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wine_scores_event_id ON wine_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_wine_scores_player_id ON wine_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_wine_scores_wine_number ON wine_scores(event_id, wine_number);
