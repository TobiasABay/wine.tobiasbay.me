import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    TextField,
    Paper,
    Alert
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Player } from '../services/api';

export default function PlayerScoringPage() {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [score, setScore] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
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
            </Container>
        </Box>
    );
}
