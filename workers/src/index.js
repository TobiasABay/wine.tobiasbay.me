// No external imports needed

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache'
};

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Extract API path
        let apiPath = path;
        if (path.startsWith('/backend/api/')) {
            apiPath = path.substring('/backend'.length);
        }

        try {
            // Health check
            if (apiPath === '/api/health') {
                return new Response(JSON.stringify({ status: 'OK' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Get leaderboard
            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/leaderboard') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getLeaderboard(eventId, env, corsHeaders);
            }

            // Default response
            return new Response(JSON.stringify({
                error: 'Route not found',
                debug: {
                    path: path,
                    apiPath: apiPath,
                    method: method
                }
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Request error:', error);
            return new Response(JSON.stringify({
                error: 'Internal server error',
                details: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// Get leaderboard for event
async function getLeaderboard(eventId, env, corsHeaders) {
    try {
        // Get all players for this event
        const playersResult = await env.wine_events.prepare(`
            SELECT id, name, presentation_order FROM players 
            WHERE event_id = ? AND is_active = 1 
            ORDER BY presentation_order ASC
        `).bind(eventId).all();
        const players = playersResult.results || [];

        if (players.length === 0) {
            return new Response(JSON.stringify({ success: true, leaderboard: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get wine categories for this event
        const categoriesResult = await env.wine_events.prepare(
            'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC'
        ).bind(eventId).all();
        const categories = categoriesResult.results || [];

        // Calculate scores for each player
        const leaderboard = [];
        for (const player of players) {
            let totalPoints = 0;
            let correctGuesses = 0;
            let totalGuesses = 0;

            // Get all guesses for this player across all wines
            const allPlayerGuessesResult = await env.wine_events.prepare(
                'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?'
            ).bind(player.id).all();
            const allPlayerGuesses = allPlayerGuessesResult.results || [];

            // For each wine (including their own wine)
            for (const wineOwner of players) {
                // Get the actual wine details for this wine (what the wine owner submitted)
                const actualWineDetailsResult = await env.wine_events.prepare(
                    'SELECT category_id, wine_answer FROM player_wine_details WHERE player_id = ?'
                ).bind(wineOwner.id).all();
                const actualWineDetails = actualWineDetailsResult.results || [];

                // Filter guesses for this specific wine
                const playerGuessesForThisWine = allPlayerGuesses.filter(guess =>
                    guess.wine_number === wineOwner.presentation_order
                );

                // Compare guesses with actual details
                for (const guess of playerGuessesForThisWine) {
                    totalGuesses++;
                    const actualDetail = actualWineDetails.find(d => d.category_id === guess.category_id);

                    if (actualDetail && actualDetail.wine_answer.toLowerCase() === guess.guess.toLowerCase()) {
                        // Correct guess! Get the difficulty factor
                        const category = categories.find(c => c.id === guess.category_id);
                        const difficultyFactor = category ? parseInt(category.difficulty_factor) || 1 : 1;

                        totalPoints += difficultyFactor;
                        correctGuesses++;
                    }
                }
            }

            const accuracy = totalGuesses > 0 ? ((correctGuesses / totalGuesses) * 100).toFixed(1) : "0.0";

            leaderboard.push({
                player_id: player.id,
                player_name: player.name,
                presentation_order: player.presentation_order,
                total_points: totalPoints,
                correct_guesses: correctGuesses,
                total_guesses: totalGuesses,
                accuracy: accuracy
            });
        }

        // Sort by total points (descending), then by accuracy (descending)
        leaderboard.sort((a, b) => {
            if (b.total_points !== a.total_points) {
                return b.total_points - a.total_points;
            }
            return parseFloat(b.accuracy) - parseFloat(a.accuracy);
        });

        return new Response(JSON.stringify({
            success: true,
            leaderboard
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error calculating leaderboard:', error);
        return new Response(JSON.stringify({
            error: 'Failed to calculate leaderboard',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
