-- Create player_feedback table
CREATE TABLE IF NOT EXISTS player_feedback (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    feedback TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON player_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_player_id ON player_feedback(player_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON player_feedback(created_at DESC);

