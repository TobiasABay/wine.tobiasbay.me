import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    Paper,
    Avatar,
    CircularProgress,
    Chip,
    Collapse,
    Divider
} from '@mui/material';
import { ArrowBack, EmojiEvents, Star, ExpandMore, ExpandLess } from '@mui/icons-material';
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

export default function FinishPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
    const [wineAverages, setWineAverages] = useState<Record<string, number>>({});
    const [wineAnswers, setWineAnswers] = useState<any>(null);
    const [wineGuesses, setWineGuesses] = useState<any>(null);
    const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
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
                const eventData = await apiService.getEvent(eventId);
                setEvent(eventData);

                // Get leaderboard data
                const leaderboardData = await apiService.getLeaderboard(eventId);
                setLeaderboard(leaderboardData.leaderboard || []);
                setWineAverages(leaderboardData.wineAverages || {});

                // Get wine answers data for comparison
                try {
                    const answersData = await apiService.getEventWineAnswers(eventId);
                    setWineAnswers(answersData);
                } catch (answersError) {
                    console.log('Error fetching wine answers:', answersError);
                    setWineAnswers(null);
                }

                // Get wine guesses data to show what each player guessed
                try {
                    const guessesData = await apiService.getEventWineGuesses(eventId);
                    setWineGuesses(guessesData);
                } catch (guessesError) {
                    console.log('Error fetching wine guesses:', guessesError);
                    setWineGuesses(null);
                }
            } catch (error: any) {
                console.error('Error loading event:', error);
                setError(error.message || 'Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        loadEventData();
    }, [eventId]);

    const handleBack = () => {
        navigate(`/event/${eventId}`);
    };

    const togglePlayerExpansion = (playerId: string) => {
        const newExpanded = new Set(expandedPlayers);
        if (newExpanded.has(playerId)) {
            newExpanded.delete(playerId);
        } else {
            newExpanded.add(playerId);
        }
        setExpandedPlayers(newExpanded);
    };

    const isGuessCorrect = (guess: string, categoryId: string, wineNumber: number) => {
        if (!wineAnswers || !wineAnswers.categories) return false;

        const category = wineAnswers.categories.find((cat: any) => cat.id === categoryId);
        if (!category) return false;

        const answer = category.answers.find((ans: any) => ans.presentation_order === wineNumber);
        if (!answer) return false;

        return answer.wine_answer.toLowerCase() === guess.toLowerCase();
    };


    const getAllGuessesForPlayer = (currentPlayerId: string) => {
        if (!wineGuesses || !wineGuesses.categories || !leaderboard) return [];

        // Find the current player
        const currentPlayer = leaderboard.find(p => p.player_id === currentPlayerId);
        if (!currentPlayer) return [];

        // Get all players for this event
        const allPlayers = leaderboard.map(player => ({
            id: player.player_id,
            name: player.player_name,
            presentation_order: player.presentation_order
        }));

        // Get all wines that have been tasted (from the presentation orders)
        const wineNumbers = [...new Set(allPlayers.map(p => p.presentation_order))].sort((a, b) => a - b);

        // For each wine, get all players' guesses for each category
        const wineData = wineNumbers.map(wineNumber => {
            const winePlayers = allPlayers.filter(p => p.presentation_order === wineNumber);
            const wineName = winePlayers.length > 0 ? winePlayers[0].name : `Wine #${wineNumber}`;

            const playerGuesses = allPlayers.map(player => {
                const playerCategories = [];

                for (const category of wineGuesses.categories) {
                    const playerGuess = category.guesses.find((g: any) =>
                        g.player_name === player.name && g.wine_number === wineNumber
                    );

                    if (playerGuess) {
                        playerCategories.push({
                            categoryName: category.guessing_element,
                            categoryId: category.id,
                            guess: playerGuess.guess,
                            isCorrect: isGuessCorrect(playerGuess.guess, category.id, wineNumber)
                        });
                    }
                }

                return {
                    playerId: player.id,
                    playerName: player.name,
                    categories: playerCategories
                };
            });

            return {
                wineNumber,
                wineName,
                players: playerGuesses
            };
        });

        return wineData;
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

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 4
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
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <EmojiEvents sx={{
                        fontSize: '4rem',
                        color: '#ffd700',
                        mb: 2,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                    }} />
                    <Typography
                        variant="h2"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            mb: 2
                        }}
                    >
                        Wine Tasting Complete!
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            color: 'white',
                            opacity: 0.9,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {event?.name}
                    </Typography>
                </Box>

                {/* Leaderboard */}
                <Paper sx={{
                    p: 4,
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
                        🏆 Final Leaderboard
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {leaderboard.map((player, index) => {
                            const isWinner = index === 0;
                            const medalColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#667eea';

                            return (
                                <Box key={player.player_id} sx={{ mb: 2 }}>
                                    <Paper
                                        sx={{
                                            p: 3,
                                            backgroundColor: isWinner ? 'rgba(255, 215, 0, 0.1)' : 'rgba(102, 126, 234, 0.05)',
                                            border: isWinner ? '2px solid #ffd700' : '1px solid rgba(102, 126, 234, 0.2)',
                                            borderRadius: 3,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            '&:hover': {
                                                backgroundColor: isWinner ? 'rgba(255, 215, 0, 0.15)' : 'rgba(102, 126, 234, 0.1)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        {/* Winner Crown */}
                                        {isWinner && (
                                            <EmojiEvents
                                                sx={{
                                                    position: 'absolute',
                                                    top: -15,
                                                    left: -15,
                                                    fontSize: '2rem',
                                                    color: '#ffd700',
                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                                }}
                                            />
                                        )}

                                        {/* Rank Badge */}
                                        <Box
                                            sx={{
                                                backgroundColor: medalColor,
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 50,
                                                height: 50,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '1.3rem',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            #{index + 1}
                                        </Box>

                                        {/* Player Avatar */}
                                        <Avatar
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                backgroundColor: '#667eea',
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {player.player_name.charAt(0).toUpperCase()}
                                        </Avatar>

                                        {/* Player Info */}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: '#2c3e50',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                {player.player_name}
                                                {isWinner && <Star sx={{ color: '#ffd700', fontSize: '1.2rem' }} />}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#7f8c8d'
                                                    }}
                                                >
                                                    Wine #{player.presentation_order}
                                                </Typography>
                                                {wineAverages && wineAverages[player.presentation_order.toString()] && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#667eea',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            {wineAverages[player.presentation_order.toString()]}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: '#95a5a6',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        >
                                                            /5.0
                                                        </Typography>
                                                        <Box sx={{
                                                            width: 20,
                                                            height: 4,
                                                            backgroundColor: '#ecf0f1',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            ml: 0.5
                                                        }}>
                                                            <Box sx={{
                                                                width: `${(wineAverages[player.presentation_order.toString()] / 5) * 100}%`,
                                                                height: '100%',
                                                                backgroundColor: wineAverages[player.presentation_order.toString()] >= 4 ? '#27ae60' :
                                                                    wineAverages[player.presentation_order.toString()] >= 3 ? '#f39c12' : '#e74c3c',
                                                                borderRadius: 2
                                                            }} />
                                                        </Box>
                                                    </Box>
                                                )}
                                                {/* Dropdown Button */}
                                                <Button
                                                    size="small"
                                                    onClick={() => togglePlayerExpansion(player.player_id)}
                                                    sx={{
                                                        minWidth: 'auto',
                                                        p: 0.5,
                                                        color: '#667eea',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    {expandedPlayers.has(player.player_id) ? <ExpandLess /> : <ExpandMore />}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Score Info */}
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    color: '#2c3e50',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {player.total_points} pts
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#7f8c8d'
                                                }}
                                            >
                                                {player.correct_guesses}/{player.total_guesses} correct
                                            </Typography>
                                            <Chip
                                                label={`${player.accuracy}% accuracy`}
                                                size="small"
                                                sx={{
                                                    mt: 0.5,
                                                    backgroundColor: parseFloat(player.accuracy) >= 70 ? '#e8f5e8' :
                                                        parseFloat(player.accuracy) >= 40 ? '#fff3cd' : '#f8d7da',
                                                    color: parseFloat(player.accuracy) >= 70 ? '#155724' :
                                                        parseFloat(player.accuracy) >= 40 ? '#856404' : '#721c24',
                                                    fontWeight: 'medium',
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </Box>
                                    </Paper>

                                    {/* Player Details Dropdown */}
                                    <Collapse in={expandedPlayers.has(player.player_id)}>
                                        <Paper sx={{
                                            mt: 1,
                                            p: 2,
                                            backgroundColor: 'rgba(102, 126, 234, 0.02)',
                                            border: '1px solid rgba(102, 126, 234, 0.1)',
                                            borderRadius: 2
                                        }}>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    color: '#2c3e50',
                                                    fontWeight: 'bold',
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                👤 {player.player_name}'s View
                                            </Typography>

                                            {wineGuesses && wineGuesses.categories ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                    {getAllGuessesForPlayer(player.player_id).length > 0 ? (
                                                        getAllGuessesForPlayer(player.player_id).map((wineData, wineIndex) => (
                                                            <Box key={wineIndex}>
                                                                <Typography
                                                                    variant="h6"
                                                                    sx={{
                                                                        fontWeight: 'bold',
                                                                        color: '#2c3e50',
                                                                        mb: 2,
                                                                        fontSize: '1.1rem',
                                                                        borderBottom: '2px solid #667eea',
                                                                        pb: 1
                                                                    }}
                                                                >
                                                                    🍷 {wineData.wineName}:
                                                                </Typography>

                                                                {wineData.players.map((playerData, playerIndex) => (
                                                                    <Box key={playerIndex} sx={{ mb: 2 }}>
                                                                        <Typography
                                                                            variant="body1"
                                                                            sx={{
                                                                                fontWeight: 'bold',
                                                                                color: '#2c3e50',
                                                                                mb: 1,
                                                                                fontSize: '1rem',
                                                                                ml: 1
                                                                            }}
                                                                        >
                                                                            {playerData.playerName}:
                                                                        </Typography>

                                                                        {playerData.categories.map((category: any, categoryIndex: number) => (
                                                                            <Box key={categoryIndex} sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1,
                                                                                mb: 1,
                                                                                ml: 3,
                                                                                p: 1,
                                                                                backgroundColor: category.isCorrect ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                                                                                borderRadius: 1,
                                                                                border: `1px solid ${category.isCorrect ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`
                                                                            }}>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        fontWeight: 'medium',
                                                                                        color: '#2c3e50',
                                                                                        minWidth: '80px'
                                                                                    }}
                                                                                >
                                                                                    {category.categoryName}:
                                                                                </Typography>
                                                                                <Chip
                                                                                    label={category.isCorrect ? "Correct" : "Incorrect"}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: 18,
                                                                                        fontSize: '0.65rem',
                                                                                        backgroundColor: category.isCorrect ? '#e8f5e8' : '#f8d7da',
                                                                                        color: category.isCorrect ? '#155724' : '#721c24'
                                                                                    }}
                                                                                />
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        fontWeight: 'medium',
                                                                                        color: '#2c3e50',
                                                                                        fontStyle: 'italic'
                                                                                    }}
                                                                                >
                                                                                    "{category.guess}"
                                                                                </Typography>
                                                                            </Box>
                                                                        ))}
                                                                        <Divider sx={{ my: 1 }} />
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                                                            No guesses found for this player.
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                                                    No guess data available for this player.
                                                </Typography>
                                            )}
                                        </Paper>
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </Box>
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

