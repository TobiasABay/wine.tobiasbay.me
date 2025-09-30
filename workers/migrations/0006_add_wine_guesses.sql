-- Add player wine guesses table
CREATE TABLE IF NOT EXISTS player_wine_guesses (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    guess TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES wine_categories (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_wine_guesses_player_id ON player_wine_guesses(player_id);
CREATE INDEX IF NOT EXISTS idx_player_wine_guesses_category_id ON player_wine_guesses(category_id);
