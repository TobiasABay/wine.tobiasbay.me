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
    Divider
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, EmojiEvents, Star } from '@mui/icons-material';
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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
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

                // Build wine answers from event data (players with their wine_details)
                let answersData = null;
                if (eventData.players && eventData.players.length > 0) {
                    answersData = {
                        success: true,
                        players: eventData.players.map(player => ({
                            player_id: player.id,
                            player_name: player.name,
                            presentation_order: player.presentation_order,
                            answers: (player.wine_details || []).map(detail => ({
                                category_id: detail.category_id,
                                wine_answer: detail.wine_answer,
                                guessing_element: detail.guessing_element || ''
                            }))
                        }))
                    };
                }

                // Get wine guesses
                try {
                    const guessesData = await apiService.getEventWineGuesses(eventId);

                    // Build my guesses array - pass answersData directly
                    const myGuessesArray = buildMyGuessesArray(
                        leaderboard[currentPlayerIndex],
                        guessesData,
                        leaderboard,
                        answersData
                    );
                    setMyGuesses(myGuessesArray);
                } catch (guessesError) {
                    console.log('Error fetching wine guesses:', guessesError);
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

    const buildMyGuessesArray = (
        playerData: LeaderboardPlayer,
        guessesData: any,
        leaderboard: LeaderboardPlayer[],
        answersData: any
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
                    const correctAnswer = getCorrectAnswer(category.id, wineNumber, answersData);

                    currentPlayerGuesses.push({
                        categoryName: category.guessing_element,
                        categoryId: category.id,
                        guess: playerGuess.guess,
                        correctAnswer: correctAnswer,
                        isCorrect: isGuessCorrect(playerGuess.guess, category.id, wineNumber, answersData)
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

    const isGuessCorrect = (guess: string, categoryId: string, targetPlayerOrder: number, answersData: any) => {
        if (!answersData) return false;

        if (answersData.categories) {
            const category = answersData.categories.find((cat: any) => cat.id === categoryId);
            if (!category) return false;

            const answer = category.answers.find((ans: any) => ans.presentation_order === targetPlayerOrder);
            if (!answer) return false;

            return answer.wine_answer.toLowerCase() === guess.toLowerCase();
        } else if (answersData.players) {
            const targetPlayer = answersData.players.find((player: any) => player.presentation_order === targetPlayerOrder);
            if (!targetPlayer) return false;

            const answer = targetPlayer.answers.find((ans: any) => ans.category_id === categoryId);
            if (!answer) return false;

            return answer.wine_answer.toLowerCase() === guess.toLowerCase();
        }

        return false;
    };

    const getCorrectAnswer = (categoryId: string, targetPlayerOrder: number, answersData: any) => {
        if (!answersData) return 'Unknown';

        if (answersData.categories) {
            const category = answersData.categories.find((cat: any) => cat.id === categoryId);
            if (!category) return 'Unknown';

            const answer = category.answers.find((ans: any) => ans.presentation_order === targetPlayerOrder);
            return answer ? answer.wine_answer : 'Unknown';
        } else if (answersData.players) {
            const targetPlayer = answersData.players.find((player: any) => player.presentation_order === targetPlayerOrder);
            if (!targetPlayer) return 'Unknown';

            const answer = targetPlayer.answers.find((ans: any) => ans.category_id === categoryId);
            return answer ? answer.wine_answer : 'Unknown';
        }

        return 'Unknown';
    };

    const handleBack = () => {
        navigate(`/score/${eventId}`);
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
        </Box>
    );
}

