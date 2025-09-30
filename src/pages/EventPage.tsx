import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Container,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
    Avatar
} from '@mui/material';
import { ArrowBack, Person, WineBar, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Event, Player, WineCategory } from '../services/api';

export default function EventPage() {
    const [eventData, setEventData] = useState<Event | null>(null);
    const [wineCategories, setWineCategories] = useState<WineCategory[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
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
                // Load event data
                const event = await apiService.getEvent(eventId);
                setEventData(event);

                // Load wine categories
                const categories = await apiService.getWineCategories(eventId);
                setWineCategories(categories);

                // Find the first player in the sequence (lowest presentation_order)
                const sortedPlayers = (event.players || []).sort((a, b) => a.presentation_order - b.presentation_order);
                if (sortedPlayers.length > 0) {
                    setCurrentPlayer(sortedPlayers[0]);
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

    const handleNextPlayer = () => {
        if (!eventData?.players) return;
        const sortedPlayers = eventData.players.sort((a, b) => a.presentation_order - b.presentation_order);
        const nextIndex = (currentPlayerIndex + 1) % sortedPlayers.length;
        setCurrentPlayerIndex(nextIndex);
        setCurrentPlayer(sortedPlayers[nextIndex]);
    };

    const handlePreviousPlayer = () => {
        if (!eventData?.players) return;
        const sortedPlayers = eventData.players.sort((a, b) => a.presentation_order - b.presentation_order);
        const prevIndex = currentPlayerIndex === 0 ? sortedPlayers.length - 1 : currentPlayerIndex - 1;
        setCurrentPlayerIndex(prevIndex);
        setCurrentPlayer(sortedPlayers[prevIndex]);
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

    if (!eventData || !currentPlayer) {
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
                {/* Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
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
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        {eventData.name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', opacity: 0.8 }}>
                        Wine Tasting Event
                    </Typography>
                </Box>

                {/* Current Player Card */}
                <Paper sx={{
                    p: 4,
                    mb: 4,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    {/* Player Navigation */}
                    {eventData.players && eventData.players.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Button
                                onClick={handlePreviousPlayer}
                                startIcon={<NavigateBefore />}
                                variant="outlined"
                                sx={{
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                    '&:hover': {
                                        borderColor: '#5a6fd8',
                                        backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                    }
                                }}
                            >
                                Previous
                            </Button>
                            <Typography variant="h6" sx={{ color: '#666', fontWeight: 'medium' }}>
                                Player {currentPlayerIndex + 1} of {eventData.players.length}
                            </Typography>
                            <Button
                                onClick={handleNextPlayer}
                                endIcon={<NavigateNext />}
                                variant="outlined"
                                sx={{
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                    '&:hover': {
                                        borderColor: '#5a6fd8',
                                        backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                    }
                                }}
                            >
                                Next
                            </Button>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{
                            backgroundColor: '#667eea',
                            width: 60,
                            height: 60,
                            mr: 3,
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                        }}>
                            <Person />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                                {currentPlayer.name}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#666', mt: 0.5 }}>
                                Wine #{currentPlayer.presentation_order}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Wine Categories */}
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                            <WineBar sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Wine Categories to Guess
                        </Typography>

                        {wineCategories.length > 0 ? (
                            <List sx={{ bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 2, p: 2 }}>
                                {wineCategories.map((category, index) => (
                                    <Box key={category.id}>
                                        <ListItem sx={{ py: 1.5 }}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Chip
                                                            label={`${index + 1}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#667eea',
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                minWidth: 32
                                                            }}
                                                        />
                                                        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                                                            {category.guessingElement}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                                                        Difficulty: {category.difficultyFactor}/5
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                        {index < wineCategories.length - 1 && (
                                            <Divider sx={{ mx: 2 }} />
                                        )}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body1" sx={{ color: '#666', fontStyle: 'italic' }}>
                                No wine categories found for this event.
                            </Typography>
                        )}
                    </Box>
                </Paper>

                {/* Event Info */}
                <Paper sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                        Event Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        <Box>
                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                Date
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                {new Date(eventData.date).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                Wine Type
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                {eventData.wine_type}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                Location
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                {eventData.location}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                Participants
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                {eventData.players?.length || 0} / {eventData.max_participants}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
