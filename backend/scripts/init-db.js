const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'wine_events.db');

// Ensure database directory exists
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    // Events table
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            max_participants INTEGER NOT NULL,
            wine_type TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT,
            budget TEXT,
            duration TEXT,
            wine_notes TEXT,
            join_code TEXT UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            auto_shuffle BOOLEAN DEFAULT 0,
            event_started BOOLEAN DEFAULT 0,
            current_wine_number INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Players table
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            name TEXT NOT NULL,
            presentation_order INTEGER,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            is_ready BOOLEAN DEFAULT 0,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        )
    `);

    // Wine categories table
    db.run(`
        CREATE TABLE IF NOT EXISTS wine_categories (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            guessing_element TEXT NOT NULL,
            difficulty_factor TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        )
    `);

    // Player wine details table
    db.run(`
        CREATE TABLE IF NOT EXISTS player_wine_details (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            wine_answer TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES wine_categories (id) ON DELETE CASCADE
        )
    `);

    // Player wine guesses table
    db.run(`
        CREATE TABLE IF NOT EXISTS player_wine_guesses (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            guess TEXT NOT NULL,
            wine_number INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES wine_categories (id) ON DELETE CASCADE
        )
    `);

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_join_code ON events(join_code)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_players_event_id ON players(event_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_wine_categories_event_id ON wine_categories(event_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_players_presentation_order ON players(event_id, presentation_order)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_player_wine_details_player_id ON player_wine_details(player_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_player_wine_details_category_id ON player_wine_details(category_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_player_wine_guesses_player_id ON player_wine_guesses(player_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_player_wine_guesses_category_id ON player_wine_guesses(category_id)`);

    console.log('Database tables created successfully');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed');
    }
});
