import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Divider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { ArrowBack, Person, Shuffle, PlayArrow } from '@mui/icons-material';
import FullscreenButton from '../../components/FullscreenButton';
import QRCode from 'qrcode';
import { apiService, type Event, type Player } from '../../services/api';
import { webSocketService } from '../../services/websocket';

export default function EventCreatedPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [autoShuffle, setAutoShuffle] = useState<boolean>(false);
    const [eventData, setEventData] = useState<Event | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const { eventId: urlEventId } = useParams();

    useEffect(() => {
        const loadEventData = async () => {
            if (!urlEventId) {
                setLoading(false);
                return;
            }

            try {
                const event = await apiService.getEvent(urlEventId);
                setEventData(event);
                setJoinCode(event.join_code);
                setPlayers(event.players || []);
                setAutoShuffle(event.auto_shuffle);

                // Generate QR code with join code as parameter
                const qrData = `${window.location.origin}/join-event?code=${event.join_code}`;
                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeUrl(qrCodeDataURL);

                // Connect to WebSocket and join event room
                webSocketService.connect();
                webSocketService.joinEvent(urlEventId);

                // Set up real-time event listeners
                webSocketService.onPlayerJoined((data) => {
                    setPlayers(data.allPlayers);
                });

                webSocketService.onPlayerLeft((data) => {
                    setPlayers(data.allPlayers);
                });

                webSocketService.onPlayersShuffled((shuffledPlayers) => {
                    setPlayers(shuffledPlayers);
                });

            } catch (error) {
                console.error('Error loading event:', error);
                alert('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        loadEventData();

        // Cleanup WebSocket connection on unmount
        return () => {
            if (urlEventId) {
                webSocketService.leaveEvent(urlEventId);
            }
        };
    }, [urlEventId]);


    const handleAutoShuffleToggle = async (checked: boolean) => {
        if (!urlEventId) return;

        try {
            setAutoShuffle(checked);
            await apiService.updateEventAutoShuffle(urlEventId, checked);
        } catch (error) {
            console.error('Error updating auto shuffle:', error);
            // Revert the toggle if the API call failed
            setAutoShuffle(!checked);
            alert('Failed to update shuffle setting');
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleStart = () => {
        if (urlEventId) {
            navigate(`/event/${urlEventId}`);
        }
    };


    if (loading) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" sx={{ color: 'white' }}>
                    Loading event...
                </Typography>
            </Container>
        );
    }

    if (!eventData) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" sx={{ color: 'white' }}>
                    Event not found
                </Typography>
                <Button onClick={handleBack} sx={{ mt: 2, color: 'white' }}>
                    Go Back
                </Button>
            </Container>
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                padding: 0,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                overflow: 'auto'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 3,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{
                            color: 'white',
                            scale: 1.5,
                            '&:hover': {
                                scale: 1.7,
                            }
                        }}
                    >
                    </Button>
                    <Typography variant="h4" component="h1" sx={{ ml: 3, fontWeight: 'bold', color: 'white' }}>
                        Event Created!
                    </Typography>
                </Box>

                <FullscreenButton />
            </Box>

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: { xs: 2, sm: 4 },
                    minHeight: 'calc(100vh - 120px)'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: { xs: 2, sm: 4 },
                        padding: { xs: 3, sm: 6 },
                        border: '1px solid rgba(255,255,255,0.2)',
                        maxWidth: 600,
                        width: '100%',
                        overflow: 'auto'
                    }}
                >

                    <Grid container spacing={{ xs: 1, sm: 2 }}>

                        {/* Join Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Join Code
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: { xs: 1, sm: 2 },
                                    flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                    <Chip
                                        label={joinCode}
                                        sx={{
                                            fontSize: { xs: '1.5rem', sm: '2rem' },
                                            fontWeight: 'bold',
                                            height: { xs: 50, sm: 60 },
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white',
                                            minWidth: { xs: 120, sm: 150 }
                                        }}
                                    />

                                </Box>
                            </Box>
                        </Grid>

                        {/* QR Code */}
                        <Grid size={12}>
                            <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                                {qrCodeUrl && (
                                    <Box sx={{
                                        display: 'inline-block',
                                        p: { xs: 1, sm: 2 },
                                        backgroundColor: 'white',
                                        borderRadius: 2,
                                        mb: 2
                                    }}>
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Code"
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                maxWidth: '200px',
                                                height: 'auto'
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Players List */}
                        <Grid size={12}>
                            <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Presentation Order ({players.length})
                                </Typography>
                                {players.length === 0 ? (
                                    <Box sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        border: '1px dashed rgba(255,255,255,0.2)'
                                    }}>
                                        <Person sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)', mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.6 }}>
                                            No players joined yet. Share the join code or QR code to invite guests!
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Paper sx={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        maxHeight: 200,
                                        overflow: 'auto'
                                    }}>
                                        <List>
                                            {players.map((player, index) => (
                                                <Box key={player.id}>
                                                    <ListItem sx={{ py: 1.5 }}>
                                                        <Avatar sx={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            color: 'white',
                                                            mr: 2,
                                                            width: 32,
                                                            height: 32,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {player.presentation_order}
                                                        </Avatar>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                                    {player.name}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
                                                                    Wine #{player.presentation_order} • Joined {new Date(player.joined_at).toLocaleString()}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {index < players.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />}
                                                </Box>
                                            ))}
                                        </List>
                                    </Paper>
                                )}
                            </Box>
                        </Grid>

                        {/* Bottom Controls */}
                        <Grid size={12}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                pt: 2,
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {/* Auto Shuffle Toggle */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={autoShuffle}
                                                onChange={(e) => handleAutoShuffleToggle(e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: 'white',
                                                        '& + .MuiSwitch-track': {
                                                            backgroundColor: 'rgba(255,255,255,0.5)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase': {
                                                        color: 'rgba(255,255,255,0.5)',
                                                    },
                                                    '& .MuiSwitch-track': {
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, order: -1 }}>
                                                <Shuffle sx={{ color: 'white', fontSize: '1.2rem' }} />
                                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                                    Auto Shuffle
                                                </Typography>
                                            </Box>
                                        }
                                        labelPlacement="start"
                                        sx={{
                                            '& .MuiFormControlLabel-label': {
                                                color: 'white',
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Start Button */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Button
                                        onClick={handleStart}
                                        variant="contained"
                                        startIcon={<PlayArrow />}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '2px solid white',
                                            borderRadius: 3,
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 200,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.3)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                                            },
                                            '&:active': {
                                                transform: 'translateY(0px)',
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        Start
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}
