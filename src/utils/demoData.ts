import type { Event, Player, WineCategory, PlayerWineDetail } from '../services/api';

// Demo event ID - consistent for demo mode
export const DEMO_EVENT_ID = 'demo-event-001';

// Demo wine categories
export const DEMO_CATEGORIES: WineCategory[] = [
    {
        id: 'demo-cat-1',
        guessing_element: 'Grape Variety',
        difficulty_factor: '2'
    },
    {
        id: 'demo-cat-2',
        guessing_element: 'Country',
        difficulty_factor: '1'
    },
    {
        id: 'demo-cat-3',
        guessing_element: 'Region',
        difficulty_factor: '3'
    }
];

// Demo wine details for each player
const ALICE_WINE_DETAILS: PlayerWineDetail[] = [
    {
        id: 'detail-1-1',
        player_id: 'demo-player-1',
        category_id: 'demo-cat-1',
        wine_answer: 'Pinot Noir',
        created_at: new Date().toISOString(),
        guessing_element: 'Grape Variety'
    },
    {
        id: 'detail-1-2',
        player_id: 'demo-player-1',
        category_id: 'demo-cat-2',
        wine_answer: 'France',
        created_at: new Date().toISOString(),
        guessing_element: 'Country'
    },
    {
        id: 'detail-1-3',
        player_id: 'demo-player-1',
        category_id: 'demo-cat-3',
        wine_answer: 'Burgundy',
        created_at: new Date().toISOString(),
        guessing_element: 'Region'
    }
];

const BOB_WINE_DETAILS: PlayerWineDetail[] = [
    {
        id: 'detail-2-1',
        player_id: 'demo-player-2',
        category_id: 'demo-cat-1',
        wine_answer: 'Cabernet Sauvignon',
        created_at: new Date().toISOString(),
        guessing_element: 'Grape Variety'
    },
    {
        id: 'detail-2-2',
        player_id: 'demo-player-2',
        category_id: 'demo-cat-2',
        wine_answer: 'Chile',
        created_at: new Date().toISOString(),
        guessing_element: 'Country'
    },
    {
        id: 'detail-2-3',
        player_id: 'demo-player-2',
        category_id: 'demo-cat-3',
        wine_answer: 'Maipo Valley',
        created_at: new Date().toISOString(),
        guessing_element: 'Region'
    }
];

const CHARLIE_WINE_DETAILS: PlayerWineDetail[] = [
    {
        id: 'detail-3-1',
        player_id: 'demo-player-3',
        category_id: 'demo-cat-1',
        wine_answer: 'Merlot',
        created_at: new Date().toISOString(),
        guessing_element: 'Grape Variety'
    },
    {
        id: 'detail-3-2',
        player_id: 'demo-player-3',
        category_id: 'demo-cat-2',
        wine_answer: 'Italy',
        created_at: new Date().toISOString(),
        guessing_element: 'Country'
    },
    {
        id: 'detail-3-3',
        player_id: 'demo-player-3',
        category_id: 'demo-cat-3',
        wine_answer: 'Tuscany',
        created_at: new Date().toISOString(),
        guessing_element: 'Region'
    }
];

const DIANA_WINE_DETAILS: PlayerWineDetail[] = [
    {
        id: 'detail-4-1',
        player_id: 'demo-player-4',
        category_id: 'demo-cat-1',
        wine_answer: 'Chardonnay',
        created_at: new Date().toISOString(),
        guessing_element: 'Grape Variety'
    },
    {
        id: 'detail-4-2',
        player_id: 'demo-player-4',
        category_id: 'demo-cat-2',
        wine_answer: 'Australia',
        created_at: new Date().toISOString(),
        guessing_element: 'Country'
    },
    {
        id: 'detail-4-3',
        player_id: 'demo-player-4',
        category_id: 'demo-cat-3',
        wine_answer: 'Margaret River',
        created_at: new Date().toISOString(),
        guessing_element: 'Region'
    }
];

// Demo players
export const DEMO_PLAYERS: Player[] = [
    {
        id: 'demo-player-1',
        event_id: DEMO_EVENT_ID,
        name: 'Alice',
        presentation_order: 1,
        joined_at: new Date().toISOString(),
        is_active: true,
        is_ready: true,
        wine_details: ALICE_WINE_DETAILS
    },
    {
        id: 'demo-player-2',
        event_id: DEMO_EVENT_ID,
        name: 'Bob',
        presentation_order: 2,
        joined_at: new Date().toISOString(),
        is_active: true,
        is_ready: true,
        wine_details: BOB_WINE_DETAILS
    },
    {
        id: 'demo-player-3',
        event_id: DEMO_EVENT_ID,
        name: 'Charlie',
        presentation_order: 3,
        joined_at: new Date().toISOString(),
        is_active: true,
        is_ready: true,
        wine_details: CHARLIE_WINE_DETAILS
    },
    {
        id: 'demo-player-4',
        event_id: DEMO_EVENT_ID,
        name: 'Diana',
        presentation_order: 4,
        joined_at: new Date().toISOString(),
        is_active: true,
        is_ready: true,
        wine_details: DIANA_WINE_DETAILS
    }
];

// Demo event
export const DEMO_EVENT: Event = {
    id: DEMO_EVENT_ID,
    name: 'Demo Wine Tasting',
    date: new Date().toISOString(),
    max_participants: 4,
    wine_type: 'Red Wine',
    location: 'Demo Location',
    description: 'A test event for development',
    budget: '$100',
    duration: '2 hours',
    wine_notes: 'Various red wines from around the world',
    join_code: 'DEMO01',
    is_active: true,
    auto_shuffle: false,
    event_started: true,
    current_wine_number: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    players: DEMO_PLAYERS,
    wine_categories: DEMO_CATEGORIES
};

// Helper to check if we're in demo mode
export function isDemoMode(): boolean {
    return sessionStorage.getItem('demo-mode') === 'true';
}

// Helper to set demo mode
export function enableDemoMode(): void {
    sessionStorage.setItem('demo-mode', 'true');
}

// Helper to exit demo mode
export function disableDemoMode(): void {
    sessionStorage.removeItem('demo-mode');
    // Clear demo data from localStorage
    localStorage.removeItem(`demo-scores-${DEMO_EVENT_ID}`);
    localStorage.removeItem(`demo-guesses-${DEMO_EVENT_ID}`);
}

// Get demo scores from localStorage
export function getDemoScores(eventId: string) {
    if (eventId !== DEMO_EVENT_ID) return { success: true, averages: {}, allScores: [] };

    const stored = localStorage.getItem(`demo-scores-${eventId}`);
    if (!stored) {
        return { success: true, averages: {}, allScores: [] };
    }

    const scores = JSON.parse(stored);

    // Calculate averages
    const averages: any = {};
    const groupedByWine: any = {};

    scores.forEach((score: any) => {
        const wineNum = score.wine_number.toString();
        if (!groupedByWine[wineNum]) {
            groupedByWine[wineNum] = [];
        }
        groupedByWine[wineNum].push(score);
    });

    Object.keys(groupedByWine).forEach(wineNum => {
        const wineScores = groupedByWine[wineNum];
        const sum = wineScores.reduce((acc: number, s: any) => acc + s.score, 0);
        const avg = sum / wineScores.length;

        averages[wineNum] = {
            average: Math.round(avg * 10) / 10,
            totalScores: wineScores.length,
            scores: wineScores
        };
    });

    return { success: true, averages, allScores: scores };
}

// Save demo score to localStorage
export function saveDemoScore(eventId: string, playerId: string, wineNumber: number, score: number) {
    if (eventId !== DEMO_EVENT_ID) return;

    const stored = localStorage.getItem(`demo-scores-${eventId}`);
    const scores = stored ? JSON.parse(stored) : [];

    // Remove existing score for this player/wine combo
    const filtered = scores.filter((s: any) =>
        !(s.player_id === playerId && s.wine_number === wineNumber)
    );

    // Add new score
    filtered.push({
        id: `demo-score-${Date.now()}`,
        event_id: eventId,
        player_id: playerId,
        wine_number: wineNumber,
        score: score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });

    localStorage.setItem(`demo-scores-${eventId}`, JSON.stringify(filtered));
}

// Get demo guesses from localStorage
export function getDemoGuesses(eventId: string) {
    if (eventId !== DEMO_EVENT_ID) return { success: true, categories: [] };

    const stored = localStorage.getItem(`demo-guesses-${eventId}`);
    if (!stored) {
        return { success: true, categories: DEMO_CATEGORIES.map(cat => ({ ...cat, guesses: [] })) };
    }

    const guesses = JSON.parse(stored);

    // Group by category
    const categoriesWithGuesses = DEMO_CATEGORIES.map(category => ({
        ...category,
        guesses: guesses.filter((g: any) => g.category_id === category.id)
    }));

    return { success: true, categories: categoriesWithGuesses };
}

// Save demo guess to localStorage
export function saveDemoGuess(playerId: string, wineNumber: number, categoryId: string, guess: string) {
    const stored = localStorage.getItem(`demo-guesses-${DEMO_EVENT_ID}`);
    const guesses = stored ? JSON.parse(stored) : [];

    // Find player name
    const player = DEMO_PLAYERS.find(p => p.id === playerId);

    // Remove existing guess for this player/wine/category combo
    const filtered = guesses.filter((g: any) =>
        !(g.player_id === playerId && g.wine_number === wineNumber && g.category_id === categoryId)
    );

    // Add new guess
    filtered.push({
        id: `demo-guess-${Date.now()}`,
        player_id: playerId,
        category_id: categoryId,
        guess: guess,
        wine_number: wineNumber,
        player_name: player?.name || 'Unknown',
        presentation_order: player?.presentation_order || 0
    });

    localStorage.setItem(`demo-guesses-${DEMO_EVENT_ID}`, JSON.stringify(filtered));
}

