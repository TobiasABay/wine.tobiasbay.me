import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Button
} from '@mui/material';
import { WineBar } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useSmartPolling } from '../hooks/useSmartPolling';

interface WineCategoriesDisplayProps {
    eventId: string;
    isEventCreator?: boolean;
}

interface WineGuess {
    player_name: string;
    guess: string;
    presentation_order: number;
    wine_number: number;
}

interface WineCategoryWithGuesses {
    id: string;
    guessing_element: string;
    difficulty_factor: string;
    guesses: WineGuess[];
}

export default function WineCategoriesDisplay({ eventId, isEventCreator = false }: WineCategoriesDisplayProps) {
    const [categories, setCategories] = useState<WineCategoryWithGuesses[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [currentWineNumber, setCurrentWineNumber] = useState<number>(1);
    const [totalWines, setTotalWines] = useState<number>(0);
    const [averageScore, setAverageScore] = useState<number | null>(null);
    const [scoreCount, setScoreCount] = useState<number>(0);
    const navigate = useNavigate();

    // Fetch initial data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!eventId) {
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching initial wine data...');

                // Get event data to know current wine number and total wines
                const event = await apiService.getEvent(eventId);
                const wineNum = event.current_wine_number || 1;
                setCurrentWineNumber(wineNum);
                setTotalWines(event.players?.length || 0);

                // Get average score for current wine
                try {
                    const scoresResponse = await apiService.getWineScores(eventId);
                    const wineData = scoresResponse.averages[wineNum.toString()];
                    if (wineData) {
                        setAverageScore(wineData.average);
                        setScoreCount(wineData.totalScores);
                    } else {
                        setAverageScore(null);
                        setScoreCount(0);
                    }
                } catch (scoreError) {
                    console.log('Error fetching scores:', scoreError);
                    setAverageScore(null);
                    setScoreCount(0);
                }

                // Try to get categories with guesses first
                try {
                    const guessesResponse = await apiService.getEventWineGuesses(eventId);
                    console.log('Wine guesses response:', guessesResponse);

                    if (guessesResponse && guessesResponse.categories && Array.isArray(guessesResponse.categories)) {
                        setCategories(guessesResponse.categories);
                        return;
                    }
                } catch (guessesError) {
                    console.log('Wine guesses API failed, falling back to categories only:', guessesError);
                }

                // Fallback to categories only
                const categoriesResponse = await apiService.getWineCategories(eventId);
                console.log('Wine categories response:', categoriesResponse);

                if (categoriesResponse && Array.isArray(categoriesResponse)) {
                    // Convert categories to the expected format with empty guesses
                    const categoriesWithEmptyGuesses = categoriesResponse.map(category => ({
                        id: category.id,
                        guessing_element: category.guessing_element,
                        difficulty_factor: category.difficulty_factor,
                        guesses: []
                    }));
                    setCategories(categoriesWithEmptyGuesses);
                } else {
                    console.log('No valid categories found');
                    setCategories([]);
                }
            } catch (error: any) {
                console.error('Error fetching wine categories:', error);
                setError(error.message || 'Failed to load wine categories');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [eventId]);

    const handleNextWine = async () => {
        if (!eventId || !totalWines) return;

        const nextWineNumber = currentWineNumber + 1;
        if (nextWineNumber <= totalWines) {
            try {
                // Update database and local state immediately
                await apiService.setCurrentWine(eventId, nextWineNumber);
                setCurrentWineNumber(nextWineNumber);
                // Refresh data for the new wine
                await refreshWineData(nextWineNumber);
            } catch (error) {
                console.error('Error setting current wine:', error);
            }
        } else if (currentWineNumber === totalWines) {
            // If on last wine and clicking finish, navigate to finish page
            navigate(`/finish/${eventId}`);
        }
    };

    const handlePreviousWine = async () => {
        if (!eventId) return;

        const prevWineNumber = currentWineNumber - 1;
        if (prevWineNumber >= 1) {
            try {
                // Update database and local state immediately
                await apiService.setCurrentWine(eventId, prevWineNumber);
                setCurrentWineNumber(prevWineNumber);
                // Refresh data for the new wine
                await refreshWineData(prevWineNumber);
            } catch (error) {
                console.error('Error setting current wine:', error);
            }
        }
    };


    // Function to refresh wine data
    const refreshWineData = async (wineNumber?: number) => {
        const targetWineNumber = wineNumber || currentWineNumber;

        try {
            // Get updated average score for current wine
            const scoresResponse = await apiService.getWineScores(eventId);
            const wineData = scoresResponse.averages[targetWineNumber.toString()];
            if (wineData) {
                setAverageScore(wineData.average);
                setScoreCount(wineData.totalScores);
            } else {
                setAverageScore(null);
                setScoreCount(0);
            }

            // Get updated wine guesses
            const guessesResponse = await apiService.getEventWineGuesses(eventId);
            if (guessesResponse && guessesResponse.categories && Array.isArray(guessesResponse.categories)) {
                setCategories(guessesResponse.categories);
            }
        } catch (error) {
            console.error('Error refreshing wine data:', error);
        }
    };

    // Polling for real-time updates (wine changes, scores, guesses)
    // Use a ref to track current wine to avoid recreating callback on every state change
    const currentWineNumberRef = useRef(currentWineNumber);
    useEffect(() => {
        currentWineNumberRef.current = currentWineNumber;
    }, [currentWineNumber]);

    useSmartPolling(async () => {
        try {
            // Get updated event data for total wines count and current wine
            const event = await apiService.getEvent(eventId);
            setTotalWines(event.players?.length || 0);

            // Check if current wine has changed
            const eventCurrentWine = event.current_wine_number || 1;
            if (eventCurrentWine !== currentWineNumberRef.current) {
                console.log('Current wine changed to', eventCurrentWine);
                setCurrentWineNumber(eventCurrentWine);
                // Refresh data for the new wine immediately
                await refreshWineData(eventCurrentWine);
            } else {
                // Refresh wine data for current wine
                await refreshWineData(eventCurrentWine);
            }
        } catch (error) {
            console.error('Error polling for updates:', error);
        }
    }, {
        enabled: true,
        interval: 5000 // Poll every 5 seconds for real-time updates
    });

    if (loading) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'white', mt: 1, opacity: 0.8 }}>
                    Loading wine categories...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                    Error loading wine categories: {error}
                </Typography>
            </Paper>
        );
    }

    if (categories.length === 0) {
        return (
            <Paper sx={{
                p: 3,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
            }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                    Wine Categories
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mb: 2 }}>
                    No wine categories defined for this event
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.6, fontSize: '0.7rem' }}>
                    Event ID: {eventId}
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WineBar sx={{ color: 'white', mr: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Wine Categories & Player Guesses
                        </Typography>
                    </Box>

                    {/* Average Score Display */}
                    {averageScore !== null && (
                        <Chip
                            label={`★ ${averageScore.toFixed(1)} (${scoreCount} ${scoreCount === 1 ? 'score' : 'scores'})`}
                            sx={{
                                backgroundColor: 'rgba(255,215,0,0.9)',
                                color: '#333',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        />
                    )}
                </Box>

                {/* Wine Navigation - Only for Event Creator */}
                {isEventCreator && totalWines > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            onClick={handlePreviousWine}
                            disabled={currentWineNumber === 1}
                            variant="outlined"
                            size="small"
                            sx={{
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.5)',
                                fontWeight: 'bold',
                                px: 2,
                                py: 0.75,
                                fontSize: '0.875rem',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderColor: 'white',
                                },
                                '&:disabled': {
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: 'rgba(255,255,255,0.3)',
                                }
                            }}
                        >
                            Previous
                        </Button>

                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', px: 1 }}>
                            Wine {currentWineNumber} of {totalWines}
                        </Typography>

                        <Button
                            onClick={handleNextWine}
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: currentWineNumber === totalWines ? '#4caf50' : '#ffd700',
                                color: currentWineNumber === totalWines ? 'white' : '#333',
                                fontWeight: 'bold',
                                px: 2,
                                py: 0.75,
                                fontSize: '0.875rem',
                                '&:hover': {
                                    backgroundColor: currentWineNumber === totalWines ? '#45a049' : '#ffc107',
                                }
                            }}
                        >
                            {currentWineNumber === totalWines ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'grid', gap: 3 }}>
                {(categories || []).map((category) => {
                    if (!category || !category.id) return null;

                    // Filter guesses to only show the current wine number
                    const currentWineGuesses = (category.guesses || []).filter(
                        guess => guess && guess.wine_number === currentWineNumber
                    );

                    return (
                        <Paper
                            key={category.id}
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}
                        >
                            {/* Category Header */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            color: '#2c3e50',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: '#667eea',
                                                flexShrink: 0
                                            }}
                                        />
                                        {category.guessing_element || 'Unknown Category'}
                                    </Typography>

                                    {category.difficulty_factor && (
                                        <Chip
                                            label={`Difficulty: ${category.difficulty_factor}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: category.difficulty_factor === 'Easy' ? '#e8f5e8' :
                                                    category.difficulty_factor === 'Medium' ? '#fff3cd' : '#f8d7da',
                                                color: category.difficulty_factor === 'Easy' ? '#155724' :
                                                    category.difficulty_factor === 'Medium' ? '#856404' : '#721c24',
                                                fontWeight: 'medium',
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            {/* Player Guesses */}
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#34495e',
                                        fontWeight: 'medium',
                                        mb: 2,
                                        fontSize: '1rem'
                                    }}
                                >
                                    Player Guesses ({currentWineGuesses.length})
                                </Typography>

                                {currentWineGuesses.length === 0 ? (
                                    <Box
                                        sx={{
                                            p: 3,
                                            textAlign: 'center',
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            borderRadius: 2,
                                            border: '2px dashed rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#7f8c8d',
                                                fontStyle: 'italic',
                                                fontWeight: 'medium'
                                            }}
                                        >
                                            No guesses submitted yet
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#95a5a6',
                                                mt: 1
                                            }}
                                        >
                                            Players will appear here once they submit their guesses
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {(() => {
                                            // Group guesses by guess value
                                            const groupedGuesses = currentWineGuesses.reduce((acc, guess) => {
                                                if (!guess) return acc;
                                                const key = `${guess.guess || 'No guess'}_${guess.wine_number}`;
                                                if (!acc[key]) {
                                                    acc[key] = {
                                                        guess: guess.guess || 'No guess',
                                                        wine_number: guess.wine_number,
                                                        count: 0
                                                    };
                                                }
                                                acc[key].count++;
                                                return acc;
                                            }, {} as Record<string, { guess: string; wine_number: number; count: number }>);

                                            // Convert to array and sort by wine number, then by guess
                                            const sortedGuesses = Object.values(groupedGuesses).sort((a, b) => {
                                                if (a.wine_number !== b.wine_number) {
                                                    return a.wine_number - b.wine_number;
                                                }
                                                return a.guess.localeCompare(b.guess);
                                            });

                                            return sortedGuesses.map((groupedGuess, index) => (
                                                <Paper
                                                    key={index}
                                                    sx={{
                                                        p: 1.5,
                                                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                                        borderRadius: 4,
                                                        minWidth: '120px',
                                                        flex: '1 1 auto'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#34495e',
                                                            fontWeight: 'medium',
                                                            fontSize: '0.875rem',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {groupedGuess.guess}
                                                        {groupedGuess.count > 1 && (
                                                            <Typography
                                                                component="span"
                                                                sx={{
                                                                    color: '#7f8c8d',
                                                                    fontWeight: 'normal',
                                                                    fontSize: '0.8rem',
                                                                    ml: 0.5
                                                                }}
                                                            >
                                                                ({groupedGuess.count})
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                </Paper>
                                            ));
                                        })()}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
}
