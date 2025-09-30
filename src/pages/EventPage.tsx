import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Player } from '../services/api';
import AverageScore from '../components/AverageScore';
import WineCategoriesDisplay from '../components/WineCategoriesDisplay';

export default function EventPage() {
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
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
                // Check if user is the event creator
                const hasCreatorSession = sessionStorage.getItem(`is-creator-${eventId}`) === 'true';
                const hasCreatorLocalStorage = localStorage.getItem(`event-creator-${eventId}`) !== null;
                const creatorTime = localStorage.getItem(`creator-time-${eventId}`);
                const isRecentCreator = creatorTime !== null && (Date.now() - parseInt(creatorTime)) < (24 * 60 * 60 * 1000);
                const isCreator = hasCreatorSession || (hasCreatorLocalStorage && isRecentCreator) || (hasCreatorLocalStorage && !creatorTime);

                // Load event data
                const event = await apiService.getEvent(eventId);

                // Find the first player in the sequence (lowest presentation_order)
                const sortedPlayers = (event.players || []).sort((a, b) => a.presentation_order - b.presentation_order);
                if (sortedPlayers.length > 0) {
                    setCurrentPlayer(sortedPlayers[0]);
                }

                // If not the creator, redirect to scoring page
                if (!isCreator) {
                    navigate(`/score/${eventId}`);
                    return;
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
        navigate(-1);
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" align="center">
                    Loading event...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" color="error" align="center">
                    {error}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBack />}>
                        Go Back
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!currentPlayer) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" align="center">
                    No players found for this event
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBack />}>
                        Go Back
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: 4
        }}>
            <Container maxWidth="md">
                {/* Header with Back Button and Player Info */}
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

                    {/* Player Name and Wine Number */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
                        <Typography
                            variant="h1"
                            sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '2.5rem', md: '3.5rem' },
                                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
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
                </Box>

                {/* Average Score Component - Fixed position in upper right */}
                {eventId && currentPlayer && (
                    <AverageScore
                        eventId={eventId}
                        wineNumber={currentPlayer.presentation_order}
                    />
                )}

                {/* Wine Categories Display */}
                {eventId && (
                    <Box sx={{ mt: 4 }}>
                        <WineCategoriesDisplay eventId={eventId} />
                    </Box>
                )}

            </Container>
        </Box>
    );
}
