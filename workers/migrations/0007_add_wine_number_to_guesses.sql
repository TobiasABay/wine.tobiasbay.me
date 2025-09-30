-- Add wine_number column to player_wine_guesses table
ALTER TABLE player_wine_guesses ADD COLUMN wine_number INTEGER NOT NULL DEFAULT 1;
