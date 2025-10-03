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
    Chip
} from '@mui/material';
import { ArrowBack, EmojiEvents, Star } from '@mui/icons-material';
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
                                <Paper
                                    key={player.player_id}
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                            );
                        })}
                    </Box>
                </Paper>

                {/* Wine Averages Section */}
                {wineAverages && Object.keys(wineAverages).length > 0 && (
                    <Paper sx={{
                        p: 4,
                        mt: 4,
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
                            🍷 Wine Average Scores
                        </Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 2
                        }}>
                            {wineAverages && Object.entries(wineAverages)
                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                .map(([wineNumber, average]) => (
                                    <Paper
                                        key={wineNumber}
                                        sx={{
                                            p: 2,
                                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                            border: '1px solid rgba(102, 126, 234, 0.2)',
                                            borderRadius: 2,
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#2c3e50',
                                                fontWeight: 'bold',
                                                mb: 1
                                            }}
                                        >
                                            Wine #{wineNumber}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    color: '#667eea',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {average}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#7f8c8d'
                                                }}
                                            >
                                                / 5.0
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            width: '100%',
                                            height: 6,
                                            backgroundColor: '#ecf0f1',
                                            borderRadius: 3,
                                            mt: 1,
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{
                                                width: `${(average / 5) * 100}%`,
                                                height: '100%',
                                                backgroundColor: average >= 4 ? '#27ae60' :
                                                    average >= 3 ? '#f39c12' : '#e74c3c',
                                                borderRadius: 3,
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </Box>
                                    </Paper>
                                ))}
                        </Box>
                    </Paper>
                )}

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

