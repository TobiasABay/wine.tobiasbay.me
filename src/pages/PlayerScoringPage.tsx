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

export default function PlayerScoringPage() {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [score, setScore] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [wineCategories, setWineCategories] = useState<WineCategory[]>([]);
    const [categoryGuesses, setCategoryGuesses] = useState<Record<string, string>>({});
    const [guessesSubmitted, setGuessesSubmitted] = useState<boolean>(false);
    const { eventId } = useParams();
    const navigate = useNavigate();

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
                if (!event.event_started) {
                    setError('Event has not started yet. Please wait for the event creator to start the event.');
                    setLoading(false);
                    return;
                }

                // Find the first player in the sequence (lowest presentation_order)
                const sortedPlayers = (event.players || []).sort((a, b) => a.presentation_order - b.presentation_order);
                if (sortedPlayers.length > 0) {
                    setCurrentPlayer(sortedPlayers[0]);
                }

                // Check if player has already submitted a score for this wine
                const response = await apiService.getWineScores(eventId);
                const wineData = response.averages[sortedPlayers[0]?.presentation_order.toString()];

                if (wineData && wineData.scores) {
                    const playerScore = wineData.scores.find(s => s.player_id === playerId);
                    if (playerScore) {
                        setScore(playerScore.score.toString());
                        setSubmitted(true);
                    }
                }

                // Check if player has already submitted category guesses
                try {
                    const guessesResponse = await apiService.getPlayerWineGuesses(playerId);
                    if (guessesResponse && guessesResponse.guesses) {
                        const guesses: Record<string, string> = {};
                        guessesResponse.guesses.forEach((guess: any) => {
                            guesses[guess.category_id] = guess.guess;
                        });
                        setCategoryGuesses(guesses);
                        setGuessesSubmitted(true);
                    }
                } catch (guessesError) {
                    console.log('No existing guesses found:', guessesError);
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
    };

    const getOptionsForCategory = (guessingElement: string): string[] => {
        const element = guessingElement || '';

        if (element === 'Country') {
            return [
                'France', 'Italy', 'Spain', 'Germany', 'Portugal', 'Austria',
                'United States', 'Australia', 'Chile', 'Argentina', 'South Africa',
                'New Zealand', 'Canada', 'Greece', 'Hungary', 'Romania', 'Bulgaria',
                'Croatia', 'Slovenia', 'Georgia', 'Turkey', 'Lebanon', 'Israel',
                'Brazil', 'Uruguay', 'Mexico', 'Peru', 'Other'
            ];
        } else if (element === 'Region') {
            return [
                'Bordeaux', 'Burgundy', 'Champagne', 'Loire Valley', 'Rhône Valley',
                'Alsace', 'Languedoc-Roussillon', 'Provence', 'Tuscany', 'Piedmont',
                'Veneto', 'Sicily', 'Puglia', 'Rioja', 'Ribera del Duero', 'Priorat',
                'Catalonia', 'Andalusia', 'Mosel', 'Rheingau', 'Pfalz', 'Baden',
                'Douro', 'Alentejo', 'Vinho Verde', 'Napa Valley', 'Sonoma',
                'Central Coast', 'Willamette Valley', 'Columbia Valley', 'Barossa Valley',
                'Hunter Valley', 'Margaret River', 'Marlborough', 'Central Otago',
                'Mendoza', 'Colchagua Valley', 'Casablanca Valley', 'Stellenbosch',
                'Paarl', 'Other'
            ];
        } else if (element === 'Grape Variety') {
            return [
                'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Malbec',
                'Sangiovese', 'Nebbiolo', 'Barbera', 'Dolcetto', 'Primitivo',
                'Tempranillo', 'Garnacha/Grenache', 'Monastrell', 'Albariño',
                'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio/Pinot Gris',
                'Chenin Blanc', 'Viognier', 'Gewürztraminer', 'Muscat', 'Semillon',
                'Verdejo', 'Torrontés', 'Carménère', 'Petit Verdot', 'Cabernet Franc',
                'Zinfandel', 'Pinotage', 'Other'
            ];
        } else if (element === 'Vintage') {
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let year = currentYear; year >= currentYear - 30; year--) {
                years.push(year.toString());
            }
            return years;
        } else if (element === 'Price Range') {
            return [
                'Under $10', '$10-$20', '$20-$30', '$30-$50', '$50-$75',
                '$75-$100', '$100-$150', '$150-$200', 'Over $200'
            ];
        } else if (element === 'Alcohol Content') {
            return [
                'Under 12%', '12-13%', '13-14%', '14-15%', '15-16%', 'Over 16%'
            ];
        }

        return ['Option 1', 'Option 2', 'Option 3', 'Other'];
    };

    const handleSubmitGuesses = async () => {
        if (submitting || !currentPlayerId) return;

        setSubmitting(true);
        setError('');

        try {
            const guesses = Object.entries(categoryGuesses).map(([categoryId, guess]) => ({
                category_id: categoryId,
                guess: guess
            }));

            await apiService.submitPlayerWineGuesses(currentPlayerId, guesses);
            setGuessesSubmitted(true);
        } catch (error: any) {
            setError(error.message || 'Failed to submit guesses');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (submitting || !currentPlayer || !currentPlayerId) return;

        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
            setError('Please enter a score between 1 and 5');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await apiService.submitWineScore(eventId!, currentPlayerId, currentPlayer.presentation_order, scoreNum);
            setSubmitted(true);
        } catch (error: any) {
            setError(error.message || 'Failed to submit score');
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
                                Score Submitted!
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                Your Score: {score}/5
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
                                Thank you for rating this wine! The results will be shown to the event creator.
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

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !score || parseInt(score) < 1 || parseInt(score) > 5}
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
                                {submitting ? 'Submitting...' : 'Submit Score'}
                            </Button>
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

                        {guessesSubmitted ? (
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
                                    const options = getOptionsForCategory(category.guessing_element);
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

                                <Button
                                    onClick={handleSubmitGuesses}
                                    disabled={submitting || Object.keys(categoryGuesses).length === 0}
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
                                    {submitting ? 'Submitting...' : 'Submit Guesses'}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}
            </Container>
        </Box>
    );
}
