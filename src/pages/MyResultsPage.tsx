import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    Paper,
    CircularProgress,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, EmojiEvents, Star, Feedback, Close } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Event } from '../services/api';

interface LeaderboardPlayer {
    player_id: string;
    player_name: string;
    presentation_order: number;
    total_points: number;
    correct_guesses: number;
    total_guesses: number;
    accuracy: string;
}

export default function MyResultsPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [myPlayerData, setMyPlayerData] = useState<LeaderboardPlayer | null>(null);
    const [myRank, setMyRank] = useState<number>(0);
    const [myGuesses, setMyGuesses] = useState<any[]>([]);
    const [wineAnswers, setWineAnswers] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string>('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
    const { eventId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Wine Tasting - My Results';
    }, []);

    useEffect(() => {
        const loadMyResults = async () => {
            if (!eventId) {
                setError('Event ID not found');
                setLoading(false);
                return;
            }

            try {
                // Get current player ID from localStorage
                const currentPlayerId = localStorage.getItem(`player-id-${eventId}`);

                if (!currentPlayerId) {
                    setError('Player session not found. Please rejoin the event.');
                    setLoading(false);
                    return;
                }

                const eventData = await apiService.getEvent(eventId);
                setEvent(eventData);

                // Get leaderboard data
                const leaderboardData = await apiService.getLeaderboard(eventId);
                const leaderboard = leaderboardData.leaderboard || [];

                // Find current player in leaderboard
                const currentPlayerIndex = leaderboard.findIndex((p: LeaderboardPlayer) => p.player_id === currentPlayerId);
                if (currentPlayerIndex === -1) {
                    setError('Player not found in leaderboard');
                    setLoading(false);
                    return;
                }

                setMyPlayerData(leaderboard[currentPlayerIndex]);
                setMyRank(currentPlayerIndex + 1);

                // Get wine answers data for comparison
                try {
                    const answersData = await apiService.getEventWineAnswers(eventId);
                    setWineAnswers(answersData);
                } catch (answersError) {
                    console.log('Error fetching wine answers:', answersError);
                    setWineAnswers(null);
                }

            } catch (error: any) {
                console.error('Error loading results:', error);
                setError(error.message || 'Failed to load results');
            } finally {
                setLoading(false);
            }
        };

        loadMyResults();
    }, [eventId]);

    // Build guesses array when wine answers are loaded
    useEffect(() => {
        const buildGuesses = async () => {
            if (!eventId || !myPlayerData || !wineAnswers) return;

            try {
                const guessesData = await apiService.getEventWineGuesses(eventId);
                const leaderboardData = await apiService.getLeaderboard(eventId);
                const leaderboard = leaderboardData.leaderboard || [];

                const myGuessesArray = buildMyGuessesArray(
                    myPlayerData,
                    guessesData,
                    leaderboard
                );
                setMyGuesses(myGuessesArray);
            } catch (error) {
                console.log('Error building guesses:', error);
            }
        };

        buildGuesses();
    }, [eventId, myPlayerData, wineAnswers]);

    const buildMyGuessesArray = (
        playerData: LeaderboardPlayer,
        guessesData: any,
        leaderboard: LeaderboardPlayer[]
    ) => {
        if (!guessesData || !guessesData.categories) return [];

        const allPlayers = leaderboard.map(player => ({
            id: player.player_id,
            name: player.player_name,
            presentation_order: player.presentation_order
        }));

        const wineData = [];

        for (const wineOwner of allPlayers) {
            const wineName = wineOwner.name;
            const wineNumber = wineOwner.presentation_order;

            const currentPlayerGuesses = [];

            for (const category of guessesData.categories) {
                const playerGuess = category.guesses.find((g: any) =>
                    g.player_name === playerData.player_name && g.wine_number === wineNumber
                );

                if (playerGuess) {
                    const correctAnswer = getCorrectAnswer(category.id, wineNumber);

                    currentPlayerGuesses.push({
                        categoryName: category.guessing_element,
                        categoryId: category.id,
                        guess: playerGuess.guess,
                        correctAnswer: correctAnswer,
                        isCorrect: isGuessCorrect(playerGuess.guess, category.id, wineNumber)
                    });
                }
            }

            if (currentPlayerGuesses.length > 0) {
                wineData.push({
                    wineNumber,
                    wineName,
                    categories: currentPlayerGuesses
                });
            }
        }

        return wineData;
    };

    const isGuessCorrect = (guess: string, categoryId: string, targetPlayerOrder: number) => {
        if (!wineAnswers) return false;

        if (wineAnswers.categories) {
            const category = wineAnswers.categories.find((cat: any) => cat.id === categoryId);
            if (!category) return false;

            const answer = category.answers.find((ans: any) => ans.presentation_order === targetPlayerOrder);
            if (!answer) return false;

            return answer.wine_answer.toLowerCase() === guess.toLowerCase();
        } else if (wineAnswers.players) {
            const targetPlayer = wineAnswers.players.find((player: any) => player.presentation_order === targetPlayerOrder);
            if (!targetPlayer) return false;

            const answer = targetPlayer.answers.find((ans: any) => ans.category_id === categoryId);
            if (!answer) return false;

            return answer.wine_answer.toLowerCase() === guess.toLowerCase();
        }

        return false;
    };

    const getCorrectAnswer = (categoryId: string, targetPlayerOrder: number) => {
        if (!wineAnswers) return 'Unknown';

        if (wineAnswers.categories) {
            const category = wineAnswers.categories.find((cat: any) => cat.id === categoryId);
            if (!category) return 'Unknown';

            const answer = category.answers.find((ans: any) => ans.presentation_order === targetPlayerOrder);
            return answer ? answer.wine_answer : 'Unknown';
        } else if (wineAnswers.players) {
            const targetPlayer = wineAnswers.players.find((player: any) => player.presentation_order === targetPlayerOrder);
            if (!targetPlayer) return 'Unknown';

            const answer = targetPlayer.answers.find((ans: any) => ans.category_id === categoryId);
            return answer ? answer.wine_answer : 'Unknown';
        }

        return 'Unknown';
    };

    const handleBack = () => {
        navigate(`/score/${eventId}`);
    };

    // Show feedback modal after loading results
    useEffect(() => {
        if (!loading && myPlayerData && eventId) {
            // Check if feedback already submitted for this event
            const feedbackKey = `feedback-${eventId}-${myPlayerData.player_id}`;
            const alreadySubmitted = localStorage.getItem(feedbackKey);
            
            if (!alreadySubmitted) {
                // Show modal after a short delay
                setTimeout(() => {
                    setFeedbackModalOpen(true);
                }, 1000);
            }
        }
    }, [loading, myPlayerData, eventId]);

    const handleFeedbackSubmit = async () => {
        if (!feedback.trim() || !eventId || !myPlayerData) return;

        try {
            setFeedbackSubmitting(true);
            await apiService.submitFeedback(eventId, myPlayerData.player_id, myPlayerData.player_name, feedback);
            
            // Mark as submitted in localStorage
            const feedbackKey = `feedback-${eventId}-${myPlayerData.player_id}`;
            localStorage.setItem(feedbackKey, 'true');
            
            setFeedbackModalOpen(false);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleFeedbackSkip = () => {
        if (!eventId || !myPlayerData) return;
        
        // Mark as submitted (skipped) so modal doesn't show again
        const feedbackKey = `feedback-${eventId}-${myPlayerData.player_id}`;
        localStorage.setItem(feedbackKey, 'skipped');
        setFeedbackModalOpen(false);
    };

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <CircularProgress sx={{ color: 'white' }} size={60} />
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
                <Container maxWidth="md">
                    <Typography variant="h4" sx={{ color: 'white', textAlign: 'center' }}>
                        {error}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ color: 'white' }}>
                            Go Back
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    const medalColor = myRank === 1 ? '#ffd700' : myRank === 2 ? '#c0c0c0' : myRank === 3 ? '#cd7f32' : '#667eea';
    const isWinner = myRank === 1;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: { xs: 2, md: 4 },
            px: { xs: 1, sm: 2 }
        }}>
            <Container maxWidth="md">
                {/* Header */}
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

                {/* Title */}
                <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 6 } }}>
                    {isWinner && (
                        <EmojiEvents sx={{
                            fontSize: { xs: '3rem', md: '4rem' },
                            color: '#ffd700',
                            mb: { xs: 1, md: 2 },
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }} />
                    )}
                    <Typography
                        variant="h2"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
                            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            mb: { xs: 1, md: 2 }
                        }}
                    >
                        My Results
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            color: 'white',
                            opacity: 0.9,
                            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {event?.name}
                    </Typography>
                </Box>

                {/* My Stats Card */}
                {myPlayerData && (
                    <Paper sx={{
                        p: { xs: 2, sm: 3, md: 4 },
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: isWinner ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        mb: 3
                    }}>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box
                                    sx={{
                                        backgroundColor: medalColor,
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: { xs: 50, md: 60 },
                                        height: { xs: 50, md: 60 },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: { xs: '1.2rem', md: '1.5rem' },
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    #{myRank}
                                </Box>
                                {isWinner && <Star sx={{ color: '#ffd700', fontSize: '2rem' }} />}
                            </Box>

                            <Typography
                                variant="h4"
                                sx={{
                                    color: '#2c3e50',
                                    fontWeight: 'bold',
                                    mb: 1,
                                    fontSize: { xs: '1.5rem', md: '2rem' }
                                }}
                            >
                                {myPlayerData.player_name}
                            </Typography>

                            <Typography variant="body1" sx={{ color: '#7f8c8d', mb: 2 }}>
                                Wine #{myPlayerData.presentation_order}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h3" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                                        {myPlayerData.total_points}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                        Total Points
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="h3" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                                        {myPlayerData.correct_guesses}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                        Correct Guesses
                                    </Typography>
                                </Box>

                                <Box>
                                    <Chip
                                        label={`${myPlayerData.accuracy}%`}
                                        sx={{
                                            height: '48px',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            backgroundColor: parseFloat(myPlayerData.accuracy) >= 70 ? '#e8f5e8' :
                                                parseFloat(myPlayerData.accuracy) >= 40 ? '#fff3cd' : '#f8d7da',
                                            color: parseFloat(myPlayerData.accuracy) >= 70 ? '#155724' :
                                                parseFloat(myPlayerData.accuracy) >= 40 ? '#856404' : '#721c24',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: '#7f8c8d', mt: 1 }}>
                                        Accuracy
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                )}

                {/* My Guesses */}
                <Paper sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            mb: 3,
                            textAlign: 'center'
                        }}
                    >
                        🍷 My Guesses
                    </Typography>

                    {myGuesses.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {myGuesses.map((wineData, wineIndex) => (
                                <Box key={wineIndex}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#2c3e50',
                                            mb: 2,
                                            fontSize: { xs: '1rem', sm: '1.25rem' },
                                            borderBottom: '2px solid #667eea',
                                            pb: 1
                                        }}
                                    >
                                        Wine #{wineData.wineNumber} - {wineData.wineName}
                                    </Typography>

                                    {wineData.categories.map((category: any, categoryIndex: number) => (
                                        <Box key={categoryIndex} sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            justifyContent: 'space-between',
                                            gap: { xs: 1, sm: 2 },
                                            mb: 2,
                                            p: 2,
                                            backgroundColor: category.isCorrect ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                                            borderRadius: 2,
                                            border: `2px solid ${category.isCorrect ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#2c3e50',
                                                        minWidth: '120px'
                                                    }}
                                                >
                                                    {category.categoryName}:
                                                </Typography>
                                                <Chip
                                                    icon={category.isCorrect ?
                                                        <CheckCircle sx={{ fontSize: '1.1rem !important' }} /> :
                                                        <Cancel sx={{ fontSize: '1.1rem !important' }} />
                                                    }
                                                    label={category.isCorrect ? "Correct" : "Wrong"}
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        backgroundColor: category.isCorrect ? '#d4edda' : '#f8d7da',
                                                        color: category.isCorrect ? '#155724' : '#721c24',
                                                        border: `1px solid ${category.isCorrect ? '#c3e6cb' : '#f5c6cb'}`,
                                                        '& .MuiChip-icon': {
                                                            color: category.isCorrect ? '#155724' : '#721c24'
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: 2,
                                                width: '100%',
                                                mt: { xs: 1, sm: 0 }
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'normal', color: '#7f8c8d' }}>
                                                        Your guess:
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: '#2c3e50',
                                                            px: 2,
                                                            py: 0.5,
                                                            backgroundColor: 'rgba(102, 126, 234, 0.15)',
                                                            borderRadius: 1
                                                        }}
                                                    >
                                                        {category.guess}
                                                    </Typography>
                                                </Box>

                                                {!category.isCorrect && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'normal', color: '#7f8c8d' }}>
                                                            Correct:
                                                        </Typography>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                color: '#27ae60',
                                                                px: 2,
                                                                py: 0.5,
                                                                backgroundColor: 'rgba(39, 174, 96, 0.15)',
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            {category.correctAnswer}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body1" sx={{ color: '#7f8c8d', textAlign: 'center', fontStyle: 'italic' }}>
                            No guesses found.
                        </Typography>
                    )}
                </Paper>

                {/* Thank You Message */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            opacity: 0.9,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        Thank you for participating! 🍷
                    </Typography>
                </Box>
            </Container>

            {/* Feedback Modal */}
            <Dialog 
                open={feedbackModalOpen} 
                onClose={handleFeedbackSkip}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Feedback sx={{ color: '#667eea' }} />
                        Share Your Feedback
                    </Box>
                    <IconButton
                        onClick={handleFeedbackSkip}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        We'd love to hear about your wine tasting experience! Your feedback helps us improve future events.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Tell us what you thought about the event..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        variant="outlined"
                        autoFocus
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={handleFeedbackSubmit}
                        variant="contained"
                        disabled={!feedback.trim() || feedbackSubmitting}
                        startIcon={feedbackSubmitting ? <CircularProgress size={16} /> : null}
                        fullWidth
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)'
                            }
                        }}
                    >
                        {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

