-- Add device_id column to players table to prevent duplicate joins
ALTER TABLE players ADD COLUMN device_id TEXT;
