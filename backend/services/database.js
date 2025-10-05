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
                console.log(`[WINE_ANSWERS] Player ${playerId} submitting wine answers:`, wineAnswers);

                // Get player info for logging
                const playerInfo = await new Promise((resolve, reject) => {
                    const sql = `
                        SELECT p.name, p.presentation_order, e.id as event_id, e.name as event_name
                        FROM players p
                        JOIN events e ON p.event_id = e.id
                        WHERE p.id = ?
                    `;
                    this.db.get(sql, [playerId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!playerInfo) {
                    console.log(`[WINE_ANSWERS] Player not found: ${playerId}`);
                    reject(new Error('Player not found'));
                    return;
                }

                console.log(`[WINE_ANSWERS] Player: ${playerInfo.name} (Order: ${playerInfo.presentation_order}) in event: ${playerInfo.event_name}`);

                // Get wine categories for validation
                const categories = await new Promise((resolve, reject) => {
                    const sql = 'SELECT id, guessing_element FROM wine_categories WHERE event_id = ?';
                    this.db.all(sql, [playerInfo.event_id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                const validCategoryIds = categories.map(c => c.id);
                console.log(`[WINE_ANSWERS] Valid categories for event:`, validCategoryIds);

                // Validate that all submitted categories are valid for this event
                for (const answer of wineAnswers) {
                    if (!validCategoryIds.includes(answer.categoryId)) {
                        console.log(`[WINE_ANSWERS] Invalid category ID: ${answer.categoryId} for event: ${playerInfo.event_id}`);
                        reject(new Error(`Invalid category ID: ${answer.categoryId}`));
                        return;
                    }
                }

                // Log the wine answers being submitted
                console.log(`[WINE_ANSWERS] Submitting answers for ${playerInfo.name}:`);
                for (const answer of wineAnswers) {
                    const category = categories.find(c => c.id === answer.categoryId);
                    console.log(`  - ${category?.guessing_element || 'Unknown'}: "${answer.wineAnswer}"`);
                }

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

                console.log(`[WINE_ANSWERS] Successfully saved ${wineAnswers.length} wine answers for ${playerInfo.name}`);

                resolve();
            } catch (error) {
                console.error('[WINE_ANSWERS] Error saving wine answers:', error);
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
            const sql = 'UPDATE events SET event_started = 1, current_wine_number = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [eventId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, changes: this.changes });
                }
            });
        });
    }

    setCurrentWine(eventId, wineNumber) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE events SET current_wine_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [wineNumber, eventId], function (err) {
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

    // Wine scores methods
    getWineScores(eventId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT ws.*, p.name as player_name, p.presentation_order
                FROM wine_scores ws
                JOIN players p ON ws.player_id = p.id
                WHERE ws.event_id = ?
                ORDER BY ws.wine_number, p.presentation_order
            `;
            this.db.all(sql, [eventId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Calculate average scores by wine number
                    const wineAverages = {};
                    const wineCounts = {};

                    (rows || []).forEach(score => {
                        const wineNum = score.wine_number;
                        if (!wineAverages[wineNum]) {
                            wineAverages[wineNum] = 0;
                            wineCounts[wineNum] = 0;
                        }
                        wineAverages[wineNum] += score.score;
                        wineCounts[wineNum]++;
                    });

                    // Calculate final averages
                    const averages = {};
                    Object.keys(wineAverages).forEach(wineNum => {
                        averages[wineNum] = {
                            average: Math.round((wineAverages[wineNum] / wineCounts[wineNum]) * 10) / 10,
                            totalScores: wineCounts[wineNum],
                            scores: (rows || []).filter(s => s.wine_number == wineNum)
                        };
                    });

                    resolve({
                        success: true,
                        averages: averages,
                        allScores: rows || []
                    });
                }
            });
        });
    }

    submitWineScore(eventId, playerId, wineNumber, score) {
        return new Promise((resolve, reject) => {
            const scoreId = uuidv4();
            const sql = `
                INSERT OR REPLACE INTO wine_scores (
                    id, event_id, player_id, wine_number, score, updated_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            this.db.run(sql, [scoreId, eventId, playerId, wineNumber, score], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, changes: this.changes });
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

    // Wine guesses methods
    submitPlayerWineGuesses(playerId, wineNumber, guesses) {
        return new Promise(async (resolve, reject) => {
            try {
                // First, delete existing guesses for this player and wine
                await new Promise((deleteResolve, deleteReject) => {
                    this.db.run('DELETE FROM player_wine_guesses WHERE player_id = ? AND wine_number = ?', [playerId, wineNumber], (err) => {
                        if (err) deleteReject(err);
                        else deleteResolve();
                    });
                });

                // Insert new guesses
                for (const guess of guesses) {
                    await new Promise((insertResolve, insertReject) => {
                        const guessId = uuidv4();
                        const sql = `
                            INSERT INTO player_wine_guesses (
                                id, player_id, category_id, guess, wine_number
                            ) VALUES (?, ?, ?, ?, ?)
                        `;
                        this.db.run(sql, [guessId, playerId, guess.category_id, guess.guess, wineNumber], (err) => {
                            if (err) insertReject(err);
                            else insertResolve();
                        });
                    });
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    getPlayerWineGuesses(playerId, wineNumber) {
        return new Promise((resolve, reject) => {
            let sql, params;
            if (wineNumber) {
                sql = 'SELECT category_id, guess FROM player_wine_guesses WHERE player_id = ? AND wine_number = ?';
                params = [playerId, wineNumber];
            } else {
                sql = 'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?';
                params = [playerId];
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getEventWineGuesses(eventId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Get all wine categories for the event
                const categories = await new Promise((resolve, reject) => {
                    const sql = 'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                // For each category, get all guesses
                const categoriesWithGuesses = [];
                for (const category of categories) {
                    const guesses = await new Promise((resolve, reject) => {
                        const sql = `
                            SELECT pwg.guess, p.name as player_name, p.presentation_order, pwg.wine_number
                            FROM player_wine_guesses pwg
                            JOIN players p ON pwg.player_id = p.id
                            WHERE pwg.category_id = ? AND p.event_id = ?
                            ORDER BY p.presentation_order ASC, pwg.wine_number ASC
                        `;
                        this.db.all(sql, [category.id, eventId], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    });

                    categoriesWithGuesses.push({
                        id: category.id,
                        guessing_element: category.guessing_element,
                        difficulty_factor: category.difficulty_factor,
                        guesses: guesses
                    });
                }

                resolve(categoriesWithGuesses);
            } catch (error) {
                reject(error);
            }
        });
    }

    getEventWineAnswers(eventId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Get all players for the event
                const players = await new Promise((resolve, reject) => {
                    const sql = 'SELECT * FROM players WHERE event_id = ? ORDER BY presentation_order ASC';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                // Get all wine categories for the event
                const categories = await new Promise((resolve, reject) => {
                    const sql = 'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                // For each player, get their wine answers
                const playersWithAnswers = [];
                for (const player of players) {
                    const answers = await new Promise((resolve, reject) => {
                        const sql = `
                            SELECT pwd.category_id, pwd.wine_answer, wc.guessing_element
                            FROM player_wine_details pwd
                            JOIN wine_categories wc ON pwd.category_id = wc.id
                            WHERE pwd.player_id = ?
                            ORDER BY wc.created_at ASC
                        `;
                        this.db.all(sql, [player.id], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    });

                    playersWithAnswers.push({
                        player_id: player.id,
                        player_name: player.name,
                        presentation_order: player.presentation_order,
                        answers: answers
                    });
                }

                resolve(playersWithAnswers);
            } catch (error) {
                reject(error);
            }
        });
    }

    calculateLeaderboard(eventId) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`[LEADERBOARD] Calculating leaderboard for event: ${eventId}`);

                // Get all players for the event
                const players = await new Promise((resolve, reject) => {
                    const sql = 'SELECT * FROM players WHERE event_id = ? ORDER BY presentation_order ASC';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                console.log(`[LEADERBOARD] Found ${players.length} players:`, players.map(p => `${p.name} (Order: ${p.presentation_order})`));

                // Get all wine categories for the event
                const categories = await new Promise((resolve, reject) => {
                    const sql = 'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });

                console.log(`[LEADERBOARD] Found ${categories.length} categories:`, categories.map(c => c.guessing_element));

                // Calculate scores for each player
                const leaderboard = [];
                for (const player of players) {
                    console.log(`[LEADERBOARD] Calculating score for ${player.name} (ID: ${player.id})`);
                    let totalPoints = 0;
                    let correctGuesses = 0;
                    let totalGuesses = 0;

                    // Get all guesses for this player across all wines
                    const allPlayerGuesses = await new Promise((resolve, reject) => {
                        const sql = 'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?';
                        this.db.all(sql, [player.id], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    });

                    console.log(`[LEADERBOARD] ${player.name} made ${allPlayerGuesses.length} total guesses`);

                    // For each wine (including their own wine)
                    for (const wineOwner of players) {
                        console.log(`[LEADERBOARD] Checking ${player.name}'s guesses for ${wineOwner.name}'s wine (Order: ${wineOwner.presentation_order})`);

                        // Get the actual wine details for this wine (what the wine owner submitted)
                        const actualWineDetails = await new Promise((resolve, reject) => {
                            const sql = 'SELECT category_id, wine_answer FROM player_wine_details WHERE player_id = ?';
                            this.db.all(sql, [wineOwner.id], (err, rows) => {
                                if (err) reject(err);
                                else resolve(rows);
                            });
                        });

                        console.log(`[LEADERBOARD] ${wineOwner.name}'s actual wine details:`, actualWineDetails.map(d => {
                            const category = categories.find(c => c.id === d.category_id);
                            return `${category?.guessing_element || 'Unknown'}: "${d.wine_answer}"`;
                        }));

                        // Filter guesses for this specific wine
                        const playerGuessesForThisWine = allPlayerGuesses.filter(guess =>
                            guess.wine_number === wineOwner.presentation_order
                        );

                        console.log(`[LEADERBOARD] ${player.name}'s guesses for ${wineOwner.name}'s wine:`, playerGuessesForThisWine.map(g => {
                            const category = categories.find(c => c.id === g.category_id);
                            return `${category?.guessing_element || 'Unknown'}: "${g.guess}"`;
                        }));

                        // Compare guesses with actual details
                        for (const guess of playerGuessesForThisWine) {
                            totalGuesses++;
                            const actualDetail = actualWineDetails.find(d => d.category_id === guess.category_id);
                            const category = categories.find(c => c.id === guess.category_id);

                            if (actualDetail && actualDetail.wine_answer.toLowerCase() === guess.guess.toLowerCase()) {
                                // Correct guess! Get the difficulty factor
                                const difficultyFactor = category ? parseInt(category.difficulty_factor) || 1 : 1;

                                totalPoints += difficultyFactor;
                                correctGuesses++;

                                console.log(`[LEADERBOARD] ✅ ${player.name} correctly guessed ${category?.guessing_element || 'Unknown'}: "${guess.guess}" (${difficultyFactor} points)`);
                            } else {
                                console.log(`[LEADERBOARD] ❌ ${player.name} incorrectly guessed ${category?.guessing_element || 'Unknown'}: "${guess.guess}" (Correct: "${actualDetail?.wine_answer || 'N/A'}")`);
                            }
                        }
                    }

                    console.log(`[LEADERBOARD] ${player.name} final score: ${correctGuesses}/${totalGuesses} correct, ${totalPoints} points`);

                    leaderboard.push({
                        player_id: player.id,
                        player_name: player.name,
                        presentation_order: player.presentation_order,
                        total_points: totalPoints,
                        correct_guesses: correctGuesses,
                        total_guesses: totalGuesses,
                        accuracy: totalGuesses > 0 ? (correctGuesses / totalGuesses * 100).toFixed(1) : '0.0'
                    });
                }

                // Get wine scores for average calculation
                const wineScores = await new Promise((resolve, reject) => {
                    const sql = 'SELECT wine_number, score FROM wine_scores WHERE event_id = ?';
                    this.db.all(sql, [eventId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });

                // Calculate wine averages
                const wineAverages = {};
                const wineScoreCounts = {};

                wineScores.forEach(score => {
                    const wineNum = score.wine_number;
                    if (!wineAverages[wineNum]) {
                        wineAverages[wineNum] = 0;
                        wineScoreCounts[wineNum] = 0;
                    }
                    wineAverages[wineNum] += score.score;
                    wineScoreCounts[wineNum]++;
                });

                // Calculate final averages
                if (wineAverages && Object.keys(wineAverages).length > 0) {
                    Object.keys(wineAverages).forEach(wineNum => {
                        wineAverages[wineNum] = Math.round((wineAverages[wineNum] / wineScoreCounts[wineNum]) * 10) / 10;
                    });
                }

                // Sort by total points descending
                leaderboard.sort((a, b) => b.total_points - a.total_points);

                resolve({
                    leaderboard,
                    wineAverages: wineAverages || {}
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new Database();
