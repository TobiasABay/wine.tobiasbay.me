import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    TextField,
    Paper,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { ArrowBack, WineBar } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Player, WineCategory } from '../services/api';
import { useSmartPolling } from '../hooks/useSmartPolling';
import { webSocketService } from '../services/websocket';

// Country to regions mapping for smart filtering
const COUNTRY_REGIONS_MAP: { [key: string]: string[] } = {
    'France': [
        'Alsace', 'Beaujolais', 'Bordeaux', 'Burgundy', 'Champagne', 'Corsica',
        'Jura', 'Languedoc-Roussillon', 'Loire Valley', 'Provence', 'Rhône Valley', 'Savoie',
        'Côtes du Rhône', 'Côte de Nuits', 'Côte de Beaune', 'Châteauneuf-du-Pape',
        'Sancerre', 'Pouilly-Fumé', 'Vouvray', 'Muscadet', 'Cahors', 'Madiran'
    ],
    'Italy': [
        'Abruzzo', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Liguria',
        'Lombardy', 'Marche', 'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Tuscany', 'Umbria', 'Veneto',
        'Amarone della Valpolicella', 'Barolo', 'Barbaresco', 'Chianti', 'Brunello di Montalcino',
        'Soave', 'Prosecco', 'Valpolicella', 'Montepulciano d\'Abruzzo', 'Nebbiolo d\'Alba',
        'Barbera d\'Asti', 'Dolcetto d\'Alba', 'Gavi', 'Verdicchio', 'Falanghina'
    ],
    'Spain': [
        'Andalusia', 'Castilla y León', 'Catalonia', 'Cava', 'Galicia', 'Jerez',
        'La Mancha', 'Navarra', 'Priorat', 'Rías Baixas', 'Ribera del Duero', 'Rioja', 'Valencia',
        'Toro', 'Rueda', 'Albarino', 'Tempranillo', 'Garnacha', 'Monastrell', 'Bobal'
    ],
    'Germany': [
        'Ahr', 'Baden', 'Franken', 'Hessische Bergstraße', 'Mosel', 'Nahe', 'Pfalz',
        'Rheingau', 'Rheinhessen', 'Saale-Unstrut', 'Saxony', 'Württemberg',
        'Riesling', 'Gewürztraminer', 'Müller-Thurgau', 'Silvaner', 'Grauburgunder',
        'Spätburgunder', 'Dornfelder', 'Lemberger'
    ],
    'United States': [
        'Central Coast', 'Columbia Valley', 'Finger Lakes', 'Long Island', 'Napa Valley',
        'Paso Robles', 'Sonoma County', 'Willamette Valley', 'Russian River Valley',
        'Carneros', 'Stags Leap District', 'Rutherford', 'Oakville', 'St. Helena',
        'Santa Barbara', 'Monterey', 'Livermore Valley', 'Lodi', 'Sierra Foothills'
    ],
    'Portugal': [
        'Alentejo', 'Douro Valley', 'Vinho Verde', 'Porto', 'Madeira', 'Dão',
        'Bairrada', 'Setúbal', 'Lisboa', 'Tejo', 'Beiras'
    ],
    'Austria': [
        'Burgenland', 'Wachau', 'Kamptal', 'Kremstal', 'Traisental', 'Wagram',
        'Weinviertel', 'Thermenregion', 'Neusiedlersee', 'Mittelburgenland', 'Südburgenland'
    ],
    'Chile': [
        'Casablanca Valley', 'Colchagua Valley', 'Maipo Valley', 'Rapel Valley',
        'Maule Valley', 'Curicó Valley', 'Aconcagua Valley', 'Leyda Valley',
        'Bio Bio Valley', 'Itata Valley', 'Cachapoal Valley'
    ],
    'Argentina': [
        'Mendoza', 'Salta', 'Catamarca', 'La Rioja', 'San Juan', 'Neuquén',
        'Río Negro', 'Patagonia', 'Uco Valley', 'Luján de Cuyo', 'Maipú'
    ],
    'Australia': [
        'Barossa Valley', 'Hunter Valley', 'Margaret River', 'McLaren Vale', 'Clare Valley',
        'Adelaide Hills', 'Coonawarra', 'Yarra Valley', 'Mornington Peninsula',
        'Eden Valley', 'Langhorne Creek', 'Heathcote', 'Grampians'
    ],
    'New Zealand': [
        'Central Otago', 'Marlborough', 'Hawke\'s Bay', 'Wairarapa', 'Canterbury',
        'Waipara', 'Nelson', 'Auckland', 'Gisborne', 'North Canterbury'
    ],
    'South Africa': [
        'Constantia', 'Paarl', 'Stellenbosch', 'Franschhoek', 'Walker Bay',
        'Elgin', 'Hemel-en-Aarde', 'Robertson', 'Swartland', 'Tulbagh'
    ],
    'Canada': [
        'Niagara Peninsula', 'Okanagan Valley', 'Similkameen Valley', 'Fraser Valley',
        'Cowichan Valley', 'Annapolis Valley', 'Prince Edward County'
    ],
    'Greece': [
        'Santorini', 'Naoussa', 'Nemea', 'Mantinia', 'Patras', 'Samos',
        'Crete', 'Rhodes', 'Cephalonia', 'Paros'
    ],
    'Hungary': [
        'Tokaj', 'Eger', 'Villány', 'Szekszárd', 'Somló', 'Balaton',
        'Badacsony', 'Csopak', 'Kunság', 'Mátra'
    ],
    'Croatia': [
        'Istria', 'Dalmatia', 'Slavonia', 'Primorje', 'Hrvatsko Zagorje',
        'Plešivica', 'Međimurje', 'Podunavlje'
    ],
    'Georgia': [
        'Kakheti', 'Imereti', 'Racha', 'Lechkhumi', 'Kartli', 'Adjara',
        'Guria', 'Samegrelo', 'Svaneti', 'Meskheti'
    ],
    'Turkey': [
        'Thrace', 'Aegean', 'Central Anatolia', 'Eastern Anatolia', 'Southeastern Anatolia',
        'Marmara', 'Black Sea', 'Mediterranean'
    ],
    'Lebanon': [
        'Bekaa Valley', 'Mount Lebanon', 'South Lebanon', 'North Lebanon'
    ],
    'Israel': [
        'Galilee', 'Golan Heights', 'Judean Hills', 'Negev', 'Shomron',
        'Samaria', 'Coastal Plain'
    ],
    'Bulgaria': [
        'Northern Region', 'Southern Region', 'Eastern Region', 'Southwestern Region',
        'Danube Plain', 'Thracian Valley', 'Black Sea Coast'
    ],
    'Romania': [
        'Transylvania', 'Moldova', 'Muntenia', 'Oltenia', 'Banat', 'Crișana',
        'Maramureș', 'Dobrogea'
    ],
    'Slovenia': [
        'Primorska', 'Posavje', 'Podravje', 'Bela Krajina', 'Dolenjska',
        'Gorenjska', 'Štajerska'
    ],
    'Czech Republic': [
        'Moravia', 'Bohemia', 'Mikulov', 'Znojmo', 'Velké Pavlovice',
        'Slovácko', 'Mělník'
    ],
    'Slovakia': [
        'Malokarpatská', 'Južnoslovenská', 'Východoslovenská', 'Nitrianska',
        'Stredoslovenská', 'Severoslovenská'
    ]
};

// All regions for fallback
const ALL_WINE_REGIONS = [
    // Italy
    'Abruzzo', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Liguria',
    'Lombardy', 'Marche', 'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Tuscany', 'Umbria', 'Veneto',
    'Amarone della Valpolicella', 'Barolo', 'Barbaresco', 'Chianti', 'Brunello di Montalcino',
    'Soave', 'Prosecco', 'Valpolicella', 'Montepulciano d\'Abruzzo', 'Nebbiolo d\'Alba',
    'Barbera d\'Asti', 'Dolcetto d\'Alba', 'Gavi', 'Verdicchio', 'Falanghina',

    // France
    'Alsace', 'Beaujolais', 'Bordeaux', 'Burgundy', 'Champagne', 'Corsica',
    'Jura', 'Languedoc-Roussillon', 'Loire Valley', 'Provence', 'Rhône Valley', 'Savoie',
    'Côtes du Rhône', 'Côte de Nuits', 'Côte de Beaune', 'Châteauneuf-du-Pape',
    'Sancerre', 'Pouilly-Fumé', 'Vouvray', 'Muscadet', 'Cahors', 'Madiran',

    // Spain
    'Andalusia', 'Castilla y León', 'Catalonia', 'Cava', 'Galicia', 'Jerez',
    'La Mancha', 'Navarra', 'Priorat', 'Rías Baixas', 'Ribera del Duero', 'Rioja', 'Valencia',
    'Toro', 'Rueda', 'Albarino', 'Tempranillo', 'Garnacha', 'Monastrell', 'Bobal',

    // Germany
    'Ahr', 'Baden', 'Franken', 'Hessische Bergstraße', 'Mosel', 'Nahe', 'Pfalz',
    'Rheingau', 'Rheinhessen', 'Saale-Unstrut', 'Saxony', 'Württemberg',
    'Riesling', 'Gewürztraminer', 'Müller-Thurgau', 'Silvaner', 'Grauburgunder',
    'Spätburgunder', 'Dornfelder', 'Lemberger',

    // United States
    'Central Coast', 'Columbia Valley', 'Finger Lakes', 'Long Island', 'Napa Valley',
    'Paso Robles', 'Sonoma County', 'Willamette Valley', 'Russian River Valley',
    'Carneros', 'Stags Leap District', 'Rutherford', 'Oakville', 'St. Helena',
    'Santa Barbara', 'Monterey', 'Livermore Valley', 'Lodi', 'Sierra Foothills',

    // Portugal
    'Alentejo', 'Douro Valley', 'Vinho Verde', 'Porto', 'Madeira', 'Dão',
    'Bairrada', 'Setúbal', 'Lisboa', 'Tejo', 'Beiras',

    // Austria
    'Burgenland', 'Wachau', 'Kamptal', 'Kremstal', 'Traisental', 'Wagram',
    'Weinviertel', 'Thermenregion', 'Neusiedlersee', 'Mittelburgenland', 'Südburgenland',

    // Chile
    'Casablanca Valley', 'Colchagua Valley', 'Maipo Valley', 'Rapel Valley',
    'Maule Valley', 'Curicó Valley', 'Aconcagua Valley', 'Leyda Valley',
    'Bio Bio Valley', 'Itata Valley', 'Cachapoal Valley',

    // Argentina
    'Mendoza', 'Salta', 'Catamarca', 'La Rioja', 'San Juan', 'Neuquén',
    'Río Negro', 'Patagonia', 'Uco Valley', 'Luján de Cuyo', 'Maipú',

    // Australia
    'Barossa Valley', 'Hunter Valley', 'Margaret River', 'McLaren Vale', 'Clare Valley',
    'Adelaide Hills', 'Coonawarra', 'Yarra Valley', 'Mornington Peninsula',
    'Eden Valley', 'Langhorne Creek', 'Heathcote', 'Grampians',

    // New Zealand
    'Central Otago', 'Marlborough', 'Hawke\'s Bay', 'Wairarapa', 'Canterbury',
    'Waipara', 'Nelson', 'Auckland', 'Gisborne', 'North Canterbury',

    // South Africa
    'Constantia', 'Paarl', 'Stellenbosch', 'Franschhoek', 'Walker Bay',
    'Elgin', 'Hemel-en-Aarde', 'Robertson', 'Swartland', 'Tulbagh',

    // Canada
    'Niagara Peninsula', 'Okanagan Valley', 'Similkameen Valley', 'Fraser Valley',
    'Cowichan Valley', 'Annapolis Valley', 'Prince Edward County',

    // Greece
    'Santorini', 'Naoussa', 'Nemea', 'Mantinia', 'Patras', 'Samos',
    'Crete', 'Rhodes', 'Cephalonia', 'Paros',

    // Hungary
    'Tokaj', 'Eger', 'Villány', 'Szekszárd', 'Somló', 'Balaton',
    'Badacsony', 'Csopak', 'Kunság', 'Mátra',

    // Croatia
    'Istria', 'Dalmatia', 'Slavonia', 'Primorje', 'Hrvatsko Zagorje',
    'Plešivica', 'Međimurje', 'Podunavlje',

    // Georgia
    'Kakheti', 'Imereti', 'Racha', 'Lechkhumi', 'Kartli', 'Adjara',
    'Guria', 'Samegrelo', 'Svaneti', 'Meskheti',

    // Turkey
    'Thrace', 'Aegean', 'Central Anatolia', 'Eastern Anatolia', 'Southeastern Anatolia',
    'Marmara', 'Black Sea', 'Mediterranean',

    // Lebanon
    'Bekaa Valley', 'Mount Lebanon', 'South Lebanon', 'North Lebanon',

    // Israel
    'Galilee', 'Golan Heights', 'Judean Hills', 'Negev', 'Shomron',
    'Samaria', 'Coastal Plain',

    // Bulgaria
    'Northern Region', 'Southern Region', 'Eastern Region', 'Southwestern Region',
    'Danube Plain', 'Thracian Valley', 'Black Sea Coast',

    // Romania
    'Transylvania', 'Moldova', 'Muntenia', 'Oltenia', 'Banat', 'Crișana',
    'Maramureș', 'Dobrogea',

    // Slovenia
    'Primorska', 'Posavje', 'Podravje', 'Bela Krajina', 'Dolenjska',
    'Gorenjska', 'Štajerska',

    // Czech Republic
    'Moravia', 'Bohemia', 'Mikulov', 'Znojmo', 'Velké Pavlovice',
    'Slovácko', 'Mělník',

    // Slovakia
    'Malokarpatská', 'Južnoslovenská', 'Východoslovenská', 'Nitrianska',
    'Stredoslovenská', 'Severoslovenská',

    // Generic
    'Other'
];

export default function PlayerScoringPage() {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [currentWineNumber, setCurrentWineNumber] = useState<number>(1);
    const [score, setScore] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [wineCategories, setWineCategories] = useState<WineCategory[]>([]);
    const [categoryGuesses, setCategoryGuesses] = useState<Record<string, string>>({});
    const [guessesSubmitted, setGuessesSubmitted] = useState<boolean>(false);
    const [eventStarted, setEventStarted] = useState<boolean>(false);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const { eventId } = useParams();
    const navigate = useNavigate();

    // Initialize selectedCountry when wine categories are loaded
    useEffect(() => {
        if (wineCategories.length > 0) {
            const countryCategory = wineCategories.find(cat => {
                const element = cat.guessing_element;
                return element === 'Country';
            });
            if (countryCategory && categoryGuesses[countryCategory.id]) {
                setSelectedCountry(categoryGuesses[countryCategory.id]);
            }
        }
    }, [wineCategories, categoryGuesses]);

    useEffect(() => {
        const loadEventData = async () => {
            if (!eventId) {
                setError('Event ID not found');
                setLoading(false);
                return;
            }

            try {
                // Get current player ID from localStorage
                const playerId = localStorage.getItem(`player-id-${eventId}`);
                console.log('PlayerScoringPage: eventId =', eventId);
                console.log('PlayerScoringPage: playerId from localStorage =', playerId);
                console.log('PlayerScoringPage: all localStorage keys =', Object.keys(localStorage));

                if (!playerId) {
                    setError('Player not found. Please join the event first.');
                    setLoading(false);
                    return;
                }
                setCurrentPlayerId(playerId);

                // Load event data
                console.log('PlayerScoringPage: Loading event data for eventId =', eventId);
                const event = await apiService.getEvent(eventId);
                console.log('PlayerScoringPage: Event data loaded =', event);

                // Load wine categories
                const categories = await apiService.getWineCategories(eventId);
                setWineCategories(categories);

                // Check if event has started
                setEventStarted(event.event_started || false);
                if (!event.event_started) {
                    setError('Event has not started yet. Please wait for the event creator to start the event.');
                    setLoading(false);
                    return;
                }

                // Store all players sorted by presentation order
                const sortedPlayers = (event.players || []).sort((a, b) => a.presentation_order - b.presentation_order);
                setAllPlayers(sortedPlayers);

                // Get current wine number from the event
                const eventCurrentWine = event.current_wine_number || 1;
                setCurrentWineNumber(eventCurrentWine);

                // Set current player based on current wine number
                const playerForCurrentWine = sortedPlayers.find(p => p.presentation_order === eventCurrentWine);
                if (playerForCurrentWine) {
                    setCurrentPlayer(playerForCurrentWine);
                }
            } catch (error: any) {
                console.error('Error loading event:', error);
                if (error.message?.includes('Event not found')) {
                    setError('Event not found. Please check if the event ID is correct.');
                } else if (error.message?.includes('Player not found')) {
                    setError('Player session expired. Please rejoin the event.');
                } else {
                    setError(`Failed to load event data: ${error.message || 'Unknown error'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        loadEventData();
    }, [eventId]);

    // Load score and guesses for the current wine
    useEffect(() => {
        const loadCurrentWineData = async () => {
            if (!eventId || !currentPlayerId || !currentPlayer) {
                console.log('Skipping loadCurrentWineData - missing data');
                return;
            }

            console.log('Loading data for Wine #' + currentPlayer.presentation_order, 'Player:', currentPlayer.name);

            try {
                // Reset states
                setScore('');
                setSubmitted(false);
                setCategoryGuesses({});
                setGuessesSubmitted(false);

                // Check if player has already submitted a score for this wine
                const response = await apiService.getWineScores(eventId);
                const wineData = response.averages[currentPlayer.presentation_order.toString()];

                if (wineData && wineData.scores) {
                    const playerScore = wineData.scores.find(s => s.player_id === currentPlayerId);
                    if (playerScore) {
                        console.log('Found existing score:', playerScore.score);
                        setScore(playerScore.score.toString());
                        setSubmitted(true);
                    }
                }

                // Check if player has already submitted category guesses for this specific wine
                try {
                    const guessesResponse = await apiService.getPlayerWineGuesses(currentPlayerId, currentPlayer.presentation_order);
                    console.log('Guesses response for Wine #' + currentPlayer.presentation_order + ':', guessesResponse);
                    if (guessesResponse && guessesResponse.guesses && guessesResponse.guesses.length > 0) {
                        const guesses: Record<string, string> = {};
                        guessesResponse.guesses.forEach((guess: any) => {
                            guesses[guess.category_id] = guess.guess;
                        });
                        console.log('Setting guesses:', guesses);
                        setCategoryGuesses(guesses);
                        setGuessesSubmitted(true);
                    } else {
                        console.log('No guesses found, setting submitted to false');
                        setGuessesSubmitted(false);
                    }
                } catch (guessesError) {
                    console.log('No existing guesses found for this wine:', guessesError);
                    setGuessesSubmitted(false);
                }
            } catch (error: any) {
                console.error('Error loading wine data:', error);
            }
        };

        loadCurrentWineData();
    }, [eventId, currentPlayerId, currentPlayer, currentWineNumber]);

    // WebSocket setup for real-time updates
    useEffect(() => {
        if (!eventId) return;

        // Connect to WebSocket and join event room
        webSocketService.connect();
        webSocketService.joinEvent(eventId);

        // Listen for current wine changes
        const handleCurrentWineChanged = (data: { eventId: string; wineNumber: number; timestamp: string }) => {
            console.log('Current wine changed via WebSocket from', currentWineNumber, 'to', data.wineNumber);

            // Update current wine number
            setCurrentWineNumber(data.wineNumber);

            // Update current player to match the new wine number
            const playerForWine = allPlayers.find(p => p.presentation_order === data.wineNumber);
            if (playerForWine) {
                setCurrentPlayer(playerForWine);
                console.log('Updated current player to:', playerForWine.name);
            }

            // Clear any existing scores and guesses for the new wine
            setScore('');
            setCategoryGuesses({});
            setSubmitted(false);
        };

        webSocketService.onCurrentWineChanged(handleCurrentWineChanged);

        // Cleanup
        return () => {
            webSocketService.offCurrentWineChanged(handleCurrentWineChanged);
            webSocketService.leaveEvent(eventId);
        };
    }, [eventId, allPlayers, currentWineNumber]);

    // Fallback polling for other event updates (reduced frequency)
    const { refreshNow } = useSmartPolling(async () => {
        if (!eventId || !eventStarted) return;

        try {
            const event = await apiService.getEvent(eventId);

            // Update event started state
            setEventStarted(event.event_started || false);
        } catch (error) {
            console.error('Error polling for event updates:', error);
        }
    }, {
        enabled: !!eventId && eventStarted,
        interval: 30000 // Poll every 30 seconds for other updates (reduced frequency)
    });

    const handleScoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // Only allow numbers 1-5
        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 5)) {
            setScore(value);
        }
    };

    const handleCategoryGuessChange = (categoryId: string, guess: string) => {
        setCategoryGuesses(prev => ({
            ...prev,
            [categoryId]: guess
        }));

        // Check if this is a country selection and update selectedCountry
        const category = wineCategories.find(cat => cat.id === categoryId);
        if (category) {
            const guessingElement = category.guessing_element;
            if (guessingElement === 'Country') {
                setSelectedCountry(guess);
                // Clear region selection when country changes
                const regionCategory = wineCategories.find(cat => {
                    const element = cat.guessing_element;
                    return element === 'Region';
                });
                if (regionCategory) {
                    setCategoryGuesses(prev => ({
                        ...prev,
                        [regionCategory.id]: ''
                    }));
                }
            }
        }
    };

    // Helper function to get options based on guessing element and selected country
    const getOptionsForCategory = (guessingElement: string, selectedCountry?: string): string[] => {
        const element = guessingElement || '';

        if (element === 'Country') {
            return [
                'Algeria',
                'Argentina',
                'Armenia',
                'Australia',
                'Austria',
                'Belgium',
                'Brazil',
                'Bulgaria',
                'Canada',
                'Chile',
                'China',
                'Colombia',
                'Croatia',
                'Czech Republic',
                'Egypt',
                'England',
                'Estonia',
                'Ethiopia',
                'France',
                'Georgia',
                'Germany',
                'Greece',
                'Hungary',
                'India',
                'Ireland',
                'Israel',
                'Italy',
                'Japan',
                'Kenya',
                'Latvia',
                'Lebanon',
                'Lithuania',
                'Mexico',
                'Moldova',
                'Montenegro',
                'Morocco',
                'Netherlands',
                'New Zealand',
                'Other',
                'Peru',
                'Poland',
                'Portugal',
                'Romania',
                'Russia',
                'Scotland',
                'Serbia',
                'Slovakia',
                'Slovenia',
                'South Africa',
                'Spain',
                'Switzerland',
                'Tanzania',
                'Turkey',
                'Ukraine',
                'United States',
                'Uruguay',
                'Wales'
            ];
        } else if (element === 'Region') {
            // If a country is selected, show only regions from that country
            if (selectedCountry && COUNTRY_REGIONS_MAP[selectedCountry]) {
                return COUNTRY_REGIONS_MAP[selectedCountry];
            }
            // Otherwise show all regions
            return ALL_WINE_REGIONS;
        } else if (element === 'Grape Variety') {
            return [
                'Barbera', 'Cabernet Sauvignon', 'Carmenère', 'Chardonnay', 'Chenin Blanc',
                'Dolcetto', 'Gewürztraminer', 'Grenache', 'Malbec', 'Merlot', 'Mourvèdre',
                'Muscat', 'Nebbiolo', 'Petit Verdot', 'Pinot Grigio', 'Pinot Noir', 'Riesling',
                'Sangiovese', 'Sauvignon Blanc', 'Semillon', 'Syrah', 'Tempranillo', 'Torrontés',
                'Viognier', 'Zinfandel'
            ];
        } else if (element === 'Age/Vintage' || element === 'Vintage') {
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let year = currentYear; year >= 1950; year--) {
                years.push(year.toString());
            }
            return years;
        } else if (element === 'Price Range') {
            return [
                '0-39 kr', '40-59 kr', '60-79 kr', '80-99 kr', '100-119 kr', '120-139 kr',
                '140-159 kr', '160-179 kr', '180-199 kr', 'Over 200 kr'
            ];
        } else if (element === 'Producer/Winery') {
            return [
                'Beringer', 'Bollinger', 'Caymus', 'Château Margaux', 'Cloudy Bay', 'Dom Pérignon',
                'Domaine de la Romanée-Conti', 'Far Niente', 'Gallo', 'Jordan Vineyard',
                'Kendall-Jackson', 'Krug', 'Louis Roederer', 'Moët & Chandon', 'Opus One',
                'Penfolds', 'Perrier-Jouët', 'Ridge Vineyards', 'Robert Mondavi', 'Silver Oak',
                'Stag\'s Leap Wine Cellars', 'Taittinger', 'Veuve Clicquot', 'Yellow Tail'
            ];
        } else if (element === 'Wine Style') {
            return [
                'Bold', 'Complex', 'Crisp', 'Dessert', 'Dry', 'Earthy', 'Elegant',
                'Fortified', 'Fruity', 'Full-Bodied', 'Light-Bodied', 'Medium-Bodied',
                'Mineral', 'Off-Dry', 'Smooth', 'Sparkling', 'Sweet'
            ];
        } else if (element === 'Alcohol Content') {
            return [
                'Under 12%', '12-13%', '13-14%', '14-15%', '15-16%', '16-17%', 'Over 17%'
            ];
        } else if (element === 'Tannin Level') {
            return [
                'High', 'Medium-High', 'Medium', 'Medium-Low', 'Low'
            ];
        } else if (element === 'Acidity Level') {
            return [
                'High', 'Medium-High', 'Medium', 'Medium-Low', 'Low'
            ];
        } else if (element === 'Body Type') {
            return [
                'Full', 'Medium-Full', 'Medium', 'Medium-Light', 'Light'
            ];
        } else if (element === 'Finish Length') {
            return [
                'Long', 'Medium-Long', 'Medium', 'Medium-Short', 'Short'
            ];
        }

        return ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
    };

    const handleSubmitAll = async () => {
        if (submitting || !currentPlayer || !currentPlayerId) return;

        // Validate score
        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
            setError('Please enter a score between 1 and 5');
            return;
        }

        // Validate categories (if there are categories)
        if (wineCategories.length > 0) {
            const missingCategories = wineCategories.filter(category =>
                !categoryGuesses[category.id] || categoryGuesses[category.id].trim() === ''
            );

            if (missingCategories.length > 0) {
                setError(`Please fill in all categories: ${missingCategories.map(c => c.guessing_element).join(', ')}`);
                return;
            }
        }

        setSubmitting(true);
        setError('');

        try {
            // Submit score
            await apiService.submitWineScore(eventId!, currentPlayerId, currentPlayer.presentation_order, scoreNum);

            // Submit guesses if there are categories
            if (wineCategories.length > 0) {
                const guesses = Object.entries(categoryGuesses).map(([categoryId, guess]) => ({
                    category_id: categoryId,
                    guess: guess
                }));
                await apiService.submitPlayerWineGuesses(currentPlayerId, currentPlayer.presentation_order, guesses);
            }

            setSubmitted(true);
            setGuessesSubmitted(true);
            // Immediately refresh to show updated scores and guesses
            await refreshNow();
        } catch (error: any) {
            setError(error.message || 'Failed to submit score and guesses');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4
            }}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Typography variant="h4" align="center" sx={{ color: 'white' }}>
                        Loading...
                    </Typography>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4
            }}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Back
                    </Button>
                    <Alert severity="error" sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                        {error}
                    </Alert>
                    {error.includes('Player session expired') && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button
                                onClick={() => navigate('/join-event')}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#ffd700',
                                    color: '#333',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        backgroundColor: '#ffc107',
                                    }
                                }}
                            >
                                Rejoin Event
                            </Button>
                        </Box>
                    )}
                </Container>
            </Box>
        );
    }

    if (!currentPlayer) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4
            }}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" align="center" sx={{ color: 'white' }}>
                        No wine to score at this time
                    </Typography>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 4
        }}>
            <Container maxWidth="md">
                {/* Header with Back Button */}
                <Box sx={{ mb: 4 }}>
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Back
                    </Button>
                </Box>

                {/* Player Name and Wine Number */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h1"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            mb: 2
                        }}
                    >
                        {currentPlayer.name}
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            color: 'white',
                            opacity: 0.8,
                            fontWeight: 'medium',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            fontSize: { xs: '1.5rem', md: '2rem' }
                        }}
                    >
                        Wine #{currentPlayer.presentation_order}
                    </Typography>
                </Box>

                {/* Scoring Interface */}
                <Paper sx={{
                    p: 4,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    textAlign: 'center'
                }}>
                    {submitted ? (
                        <Box>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                                {wineCategories.length > 0 ? 'Score & Guesses Submitted!' : 'Score Submitted!'}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                Your Score: {score}/5
                            </Typography>
                            {wineCategories.length > 0 && (
                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 2 }}>
                                    Your category guesses have been submitted successfully!
                                </Typography>
                            )}
                            <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
                                Thank you for participating! The results will be shown to the event creator.
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                                Rate This Wine
                            </Typography>

                            <TextField
                                label="Score (1-5)"
                                type="number"
                                value={score}
                                onChange={handleScoreChange}
                                inputProps={{ min: 1, max: 5 }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#ffd700',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255,255,255,0.7)',
                                        '&.Mui-focused': {
                                            color: '#ffd700',
                                        },
                                    },
                                }}
                                fullWidth
                            />


                        </Box>
                    )}
                </Paper>

                {/* Category Guessing Interface */}
                {wineCategories.length > 0 && (
                    <Paper sx={{
                        p: 4,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        mt: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <WineBar sx={{ color: 'white', mr: 1 }} />
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                                Guess the Wine Details
                            </Typography>
                        </Box>

                        {guessesSubmitted && Object.keys(categoryGuesses).length > 0 ? (
                            <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                                    Guesses Submitted!
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white', opacity: 0.8, mb: 2 }}>
                                    Your guesses for this wine:
                                </Typography>
                                {wineCategories.map((category) => (
                                    <Box key={category.id} sx={{ mb: 2 }}>
                                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                                            {category.guessing_element}: {categoryGuesses[category.id] || 'No guess'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                                    What do you think about this wine?
                                </Typography>

                                {wineCategories.map((category) => {
                                    const options = getOptionsForCategory(category.guessing_element, selectedCountry);
                                    return (
                                        <Box key={category.id} sx={{ mb: 3 }}>
                                            <FormControl fullWidth>
                                                <InputLabel
                                                    id={`category-${category.id}`}
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        '&.Mui-focused': {
                                                            color: '#ffd700',
                                                        },
                                                    }}
                                                >
                                                    {category.guessing_element}
                                                </InputLabel>
                                                <Select
                                                    labelId={`category-${category.id}`}
                                                    value={categoryGuesses[category.id] || ''}
                                                    label={category.guessing_element}
                                                    onChange={(e) => handleCategoryGuessChange(category.id, e.target.value)}
                                                    disabled={submitting}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: 'rgba(255,255,255,0.3)',
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: 'rgba(255,255,255,0.5)',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#ffd700',
                                                            },
                                                        },
                                                        '& .MuiSelect-icon': {
                                                            color: 'rgba(255,255,255,0.7)',
                                                        },
                                                    }}
                                                >
                                                    {options.map((option) => (
                                                        <MenuItem key={option} value={option}>
                                                            {option}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    );
                                })}

                            </Box>
                        )}
                    </Paper>
                )}

                {/* Submit Button */}
                {!submitted && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            onClick={handleSubmitAll}
                            disabled={submitting || !score || parseInt(score) < 1 || parseInt(score) > 5 || (wineCategories.length > 0 && Object.keys(categoryGuesses).length !== wineCategories.length)}
                            variant="contained"
                            sx={{
                                backgroundColor: '#ffd700',
                                color: '#333',
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                '&:hover': {
                                    backgroundColor: '#ffc107',
                                },
                                '&:disabled': {
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                    color: 'rgba(255,255,255,0.7)',
                                }
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Score & Guesses'}
                        </Button>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
