const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'database', 'wine_events.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
            }
        });
    }

    // Event methods
    createEvent(eventData) {
        return new Promise(async (resolve, reject) => {
            const eventId = uuidv4();
            const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

            const sql = `
                INSERT INTO events (
                    id, name, date, max_participants, wine_type, location,
                    description, budget, duration, wine_notes, join_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                eventId,
                eventData.name,
                eventData.date,
                eventData.maxParticipants,
                eventData.wineType,
                eventData.location,
                eventData.description || '',
                eventData.budget || '',
                eventData.duration || '',
                eventData.wineNotes || '',
                joinCode
            ], async (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Save wine categories if provided
                if (eventData.wineCategories && eventData.wineCategories.length > 0) {
                    try {
                        for (const category of eventData.wineCategories) {
                            const categoryId = uuidv4();
                            await new Promise((categoryResolve, categoryReject) => {
                                const categorySql = `
                                    INSERT INTO wine_categories (
                                        id, event_id, guessing_element, difficulty_factor
                                    ) VALUES (?, ?, ?, ?)
                                `;
                                this.db.run(categorySql, [
                                    categoryId,
                                    eventId,
                                    category.guessing_element,
                                    category.difficulty_factor
                                ], (categoryErr) => {
                                    if (categoryErr) {
                                        categoryReject(categoryErr);
                                    } else {
                                        categoryResolve();
                                    }
                                });
                            });
                        }
                    } catch (categoryError) {
                        reject(categoryError);
                        return;
                    }
                }

                resolve({ id: eventId, joinCode });
            });
        });
    }

    getEventById(eventId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM events WHERE id = ? AND is_active = 1';
            this.db.get(sql, [eventId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getEventByJoinCode(joinCode) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM events WHERE join_code = ? AND is_active = 1';
            this.db.get(sql, [joinCode], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getAllEvents() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM events ORDER BY created_at DESC';
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    updateEventAutoShuffle(eventId, autoShuffle) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE events SET auto_shuffle = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [autoShuffle, eventId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Player methods
    addPlayer(eventId, playerName) {
        return new Promise((resolve, reject) => {
            const playerId = uuidv4();

            // Get current player count for presentation order
            const countSql = 'SELECT COUNT(*) as count FROM players WHERE event_id = ? AND is_active = 1';
            this.db.get(countSql, [eventId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                const presentationOrder = row.count + 1;

                const sql = `
                    INSERT INTO players (id, event_id, name, presentation_order)
                    VALUES (?, ?, ?, ?)
                `;

                this.db.run(sql, [playerId, eventId, playerName, presentationOrder], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: playerId, presentationOrder });
                    }
                });
            });
        });
    }

    getPlayersByEventId(eventId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM players 
                WHERE event_id = ? AND is_active = 1 
                ORDER BY presentation_order ASC
            `;
            this.db.all(sql, [eventId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    shufflePlayers(eventId) {
        return new Promise((resolve, reject) => {
            // Get all players for the event
            this.getPlayersByEventId(eventId).then(players => {
                // Shuffle the players array
                const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

                // Update presentation order for each player
                const updatePromises = shuffledPlayers.map((player, index) => {
                    return new Promise((updateResolve, updateReject) => {
                        const sql = 'UPDATE players SET presentation_order = ? WHERE id = ?';
                        this.db.run(sql, [index + 1, player.id], function (err) {
                            if (err) {
                                updateReject(err);
                            } else {
                                updateResolve();
                            }
                        });
                    });
                });

                Promise.all(updatePromises)
                    .then(() => resolve(shuffledPlayers))
                    .catch(reject);
            }).catch(reject);
        });
    }

    updatePlayerOrder(eventId, players) {
        return new Promise((resolve, reject) => {
            // Update each player's presentation order
            const updatePromises = players.map((player, index) => {
                return new Promise((updateResolve, updateReject) => {
                    const sql = 'UPDATE players SET presentation_order = ? WHERE id = ? AND event_id = ?';
                    this.db.run(sql, [index + 1, player.id, eventId], function (err) {
                        if (err) {
                            updateReject(err);
                        } else {
                            updateResolve();
                        }
                    });
                });
            });

            Promise.all(updatePromises)
                .then(() => resolve())
                .catch(reject);
        });
    }

    removePlayer(playerId) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE players SET is_active = 0 WHERE id = ?';
            this.db.run(sql, [playerId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Wine categories methods
    addWineCategory(eventId, categoryData) {
        return new Promise((resolve, reject) => {
            const categoryId = uuidv4();
            const sql = `
                INSERT INTO wine_categories (id, event_id, guessing_element, difficulty_factor)
                VALUES (?, ?, ?, ?)
            `;

            this.db.run(sql, [
                categoryId,
                eventId,
                categoryData.guessingElement,
                categoryData.difficultyFactor
            ], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: categoryId });
                }
            });
        });
    }

    getWineCategoriesByEventId(eventId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC';
            this.db.all(sql, [eventId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Wine answers methods
    savePlayerWineAnswers(playerId, wineAnswers) {
        return new Promise(async (resolve, reject) => {
            try {
                // First, delete any existing answers for this player
                await new Promise((deleteResolve, deleteReject) => {
                    const deleteSql = 'DELETE FROM player_wine_details WHERE player_id = ?';
                    this.db.run(deleteSql, [playerId], (err) => {
                        if (err) {
                            deleteReject(err);
                        } else {
                            deleteResolve();
                        }
                    });
                });

                // Insert new answers
                for (const answer of wineAnswers) {
                    const answerId = uuidv4();
                    await new Promise((answerResolve, answerReject) => {
                        const answerSql = `
                            INSERT INTO player_wine_details (
                                id, player_id, category_id, wine_answer
                            ) VALUES (?, ?, ?, ?)
                        `;
                        this.db.run(answerSql, [
                            answerId,
                            playerId,
                            answer.categoryId,
                            answer.wineAnswer
                        ], (err) => {
                            if (err) {
                                answerReject(err);
                            } else {
                                answerResolve();
                            }
                        });
                    });
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    getPlayerWineDetails(playerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT pwd.*, wc.guessing_element 
                FROM player_wine_details pwd
                JOIN wine_categories wc ON pwd.category_id = wc.id
                WHERE pwd.player_id = ?
            `;
            this.db.all(sql, [playerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    startEvent(eventId) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE events SET event_started = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [eventId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, changes: this.changes });
                }
            });
        });
    }

    updatePlayerReadyStatus(playerId, isReady) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE players SET is_ready = ? WHERE id = ?';
            this.db.run(sql, [isReady ? 1 : 0, playerId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, changes: this.changes });
                }
            });
        });
    }

    getEventByPlayerId(playerId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT e.* FROM events e JOIN players p ON e.id = p.event_id WHERE p.id = ?';
            this.db.get(sql, [playerId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = new Database();
